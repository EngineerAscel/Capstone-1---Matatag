import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { supabase, supabaseConfigError } from './supabase.js';

const dashboardNavigation = [
  'Dashboard',
  'Inventory',
  'Stock Transactions',
  'Suppliers',
  'Orders & Receiving',
  'Material Receiving',
  'Fabrication Monitoring',
  'Notifications',
  'Reports',
  'Settings',
];

function BlankRows({ count, columns }) {
  return Array.from({ length: count }, (_, row) => (
    <tr key={row} aria-hidden="true">
      {Array.from({ length: columns }, (_, column) => <td key={column} />)}
    </tr>
  ));
}

function DashboardPanel({ title, subtitle, action, onAction, className = '', children }) {
  return (
    <section className={`dashboard-panel ${className}`}>
      <header className="dashboard-panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && (
          <button type="button" className="dashboard-text-action" onClick={() => onAction(action)}>
            {action} <ChevronRight size={12} />
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

function InventoryManagement({ onAction }) {
  const [inventoryFilter, setInventoryFilter] = useState('All items');
  const [activeCategory, setActiveCategory] = useState('');
  const filters = ['All items', 'Low Stock', 'Out of Stock', 'Archived'];
  const categories = ['Raw Materials', 'Industrial Parts', 'Consumables', 'Work-in-Progress', 'Finished Goods'];
  const columns = ['SKU', 'ITEM NAME', 'CATEGORY', 'ON-HAND QUANTITY', 'UNIT', 'REORDER POINT', 'STATUS', 'ACTIONS'];

  return (
    <>
      <section className="inventory-metrics" aria-label="Inventory summary">
        {[
          ['Active Inventory Items', 'unique SKUs • main warehouse'],
          ['In Stock', 'Above reorder point'],
          ['Low-Stock Items', 'At or below reorder point', true],
          ['Out of Stock', 'No on-hand quantity'],
        ].map(([title, detail, warning]) => (
          <article className="inventory-metric" key={title}>
            <div>{title}{warning && <AlertTriangle size={14} />}</div>
            <strong aria-hidden="true" />
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <div className="inventory-filter-tabs" role="tablist" aria-label="Inventory status">
        {filters.map((filter) => (
          <button
            type="button"
            role="tab"
            aria-selected={inventoryFilter === filter}
            className={inventoryFilter === filter ? 'active' : ''}
            key={filter}
            onClick={() => setInventoryFilter(filter)}
          >
            {filter}<span aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="inventory-search-row">
        <label className="inventory-search">
          <Search size={14} />
          <input type="search" aria-label="Search item name or SKU" placeholder="Search item name or SKU..." />
        </label>
        <select aria-label="Filter by category" defaultValue="">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select aria-label="Filter by stock status" defaultValue="">
          <option value="">All stock statuses</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
        <span className="inventory-active-count" aria-hidden="true" />
      </div>

      <div className="inventory-categories">
        <span>CATEGORIES</span>
        {categories.map((category) => (
          <button
            type="button"
            className={activeCategory === category ? 'active' : ''}
            key={category}
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(activeCategory === category ? '' : category)}
          >
            {category}
          </button>
        ))}
      </div>

      <section className="inventory-table-panel" aria-label="Inventory items">
        <div className="inventory-table-scroll">
          <table className="inventory-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 8 }, (_, row) => (
                <tr key={row}>
                  {columns.slice(0, -1).map((column) => <td key={column} />)}
                  <td className="inventory-row-actions">
                    {['View', 'Edit', 'Archive', 'Delete'].map((action) => (
                      <button type="button" key={action} onClick={() => onAction(action)}>{action}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="inventory-pagination">
          <span>Showing – of – items</span>
          <div>
            <button type="button" aria-label="Previous page" onClick={() => onAction('Previous page')}>‹</button>
            <span />
            <button type="button" aria-label="Next page" onClick={() => onAction('Next page')}>›</button>
          </div>
        </div>
      </section>

      <div className="inventory-notes">
        <p>On-hand stock reflects posted Stock Transactions only. Low Stock applies when quantity ≤ reorder point; zero stock is Out of Stock.</p>
        <p>Administrator controls • Delete is permitted only for unused, zero-stock records without transaction history. Archive preserves the ledger.</p>
      </div>
    </>
  );
}

function StockTransactions({ onAction }) {
  const [activeFilter, setActiveFilter] = useState('All transactions');
  const filters = ['All transactions', 'My transactions', 'Awaiting approval'];
  const columns = ['TRANSACTION ID', 'DATE', 'SKU / ITEM', 'TYPE', 'QUANTITY', 'RELATED JOB', 'RECORDED BY', 'ACTIONS'];

  return (
    <div className="stock-transactions-content">
      <p className="stock-breadcrumb">Workspace / Stock Transactions</p>

      <section className="stock-summary" aria-label="Transaction summary">
        <div><strong /><span>posted movements</span></div>
        <div><strong /><span>material reservation</span></div>
        <div><strong /><span>adjustments awaiting approval</span></div>
        <span className="stock-current-view" />
      </section>

      <aside className="stock-notice">
        <strong>Posted records are locked. Corrections use a linked adjustment.</strong>
        <span>Staff can record receipts, usage and reservations. Adjustments are submitted to an administrator; balances stay unchanged until approved.</span>
      </aside>

      <div className="stock-filter-tabs" role="tablist" aria-label="Transaction view">
        {filters.map((filter) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === filter}
            className={activeFilter === filter ? 'active' : ''}
            key={filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}{filter === 'Awaiting approval' && <span aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="stock-filters">
        <label className="stock-search-field">
          <span>SEARCH</span>
          <div><Search size={14} /><input type="search" placeholder="Search transaction ID, item or SKU..." /></div>
        </label>
        <label>
          <span>DATE RANGE</span>
          <select defaultValue=""><option value="">Select date range</option><option>Today</option><option>Last 7 days</option><option>Last 30 days</option></select>
        </label>
        <label>
          <span>ITEM / SKU</span>
          <select defaultValue=""><option value="">All items</option></select>
        </label>
        <label>
          <span>TRANSACTION TYPE</span>
          <select defaultValue=""><option value="">All transaction types</option><option>Stock Receipt</option><option>Material Usage</option><option>Stock Adjustment</option><option>Material Allocation</option></select>
        </label>
      </div>

      <section className="stock-history-panel" aria-label="Transaction history">
        <header className="stock-history-header">
          <h2>Transaction history</h2>
          <span />
        </header>
        <div className="stock-table-scroll">
          <table className="stock-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 7 }, (_, row) => (
                <tr key={row}>
                  {columns.slice(0, -1).map((column) => <td key={column} />)}
                  <td><button type="button" onClick={() => onAction('View Transaction')}>View <ChevronRight size={10} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stock-pagination">
          <span>Showing – of – records • Main warehouse</span>
          <div>
            <button type="button" aria-label="Previous page" onClick={() => onAction('Previous page')}>‹</button>
            <span />
            <button type="button" aria-label="Next page" onClick={() => onAction('Next page')}>›</button>
          </div>
        </div>
      </section>

      <div className="stock-notes">
        <p>Physical on hand = posted stock. Reserved = assigned to jobs, not consumed. Available = physical on hand − reserved.</p>
        <p>Low Stock applies when physical on hand ≤ reorder point. Allocations do not change physical-based stock alerts.</p>
      </div>
    </div>
  );
}

function SupplierManagement({ onAction }) {
  const columns = ['SUPPLIER NAME', 'CONTACT PERSON', 'PHONE', 'EMAIL', 'ADDRESS', 'ACTIONS'];
  const actions = ['View', 'Edit', 'Archive', 'Delete'];

  return (
    <div className="supplier-content">
      <p className="supplier-breadcrumb">Workspace / Suppliers</p>

      <div className="supplier-search-row">
        <label className="supplier-search">
          <Search size={14} />
          <input type="search" aria-label="Search supplier name, contact or email" placeholder="Search supplier name, contact or email..." />
        </label>
        <span className="supplier-count" aria-hidden="true" />
      </div>

      <section className="supplier-table-panel" aria-label="Suppliers">
        <div className="supplier-table-scroll">
          <table className="supplier-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 3 }, (_, row) => (
                <tr key={row}>
                  {columns.slice(0, -1).map((column) => <td key={column} />)}
                  <td className="supplier-row-actions">
                    {actions.map((action) => (
                      <button type="button" key={action} onClick={() => onAction(`${action} Supplier`)}>{action}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="supplier-pagination">
          <span>Showing – of – active suppliers</span>
          <div>
            <button type="button" aria-label="Previous page" onClick={() => onAction('Previous page')}>‹</button>
            <span />
            <button type="button" aria-label="Next page" onClick={() => onAction('Next page')}>›</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PurchaseOrders({ onAction }) {
  const [activeView, setActiveView] = useState('Purchase orders');
  const columns = ['PO NUMBER', 'SUPPLIER', 'ORDER DATE', 'ITEMS', 'ORDERED QUANTITY', 'RECEIVING STATUS', 'ACTIONS'];

  return (
    <div className="purchase-orders-content">
      <p className="orders-breadcrumb">Workspace / Orders &amp; Receiving</p>

      <section className="orders-summary" aria-label="Purchase order summary">
        {[
          ['Pending Receipt', 'approved • draft, not receivable'],
          ['Partially Received', 'Approved • outstanding quantities'],
          ['Received', 'All ordered lines are complete'],
        ].map(([title, detail]) => (
          <article className="orders-summary-card" key={title}>
            <span>{title}</span>
            <strong aria-hidden="true" />
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <div className="orders-tabs" role="tablist" aria-label="Orders and receiving views">
        {['Purchase orders', 'Receiving records'].map((view) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={activeView === view ? 'active' : ''}
            key={view}
            onClick={() => setActiveView(view)}
          >
            {view}<span aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="orders-filter-row">
        <label className="orders-search">
          <Search size={14} />
          <input type="search" aria-label="Search PO number or supplier" placeholder="Search PO number or supplier..." />
        </label>
        <label className="orders-status-filter">
          <span>Receiving status</span>
          <select defaultValue=""><option value="">All receiving statuses</option><option>Pending Receipt</option><option>Partially Received</option><option>Received</option></select>
        </label>
        <span className="orders-period" aria-hidden="true" />
      </div>

      <section className="orders-table-panel" aria-label="Purchase orders">
        <div className="orders-table-scroll">
          <table className="orders-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 5 }, (_, row) => (
                <tr key={row}>
                  {columns.slice(0, -1).map((column) => <td key={column} />)}
                  <td className="orders-row-actions">
                    <button type="button" onClick={() => onAction('View order')}>View order</button>
                    {row < 2 && <button type="button" onClick={() => onAction('Receive Materials')}>Receive Materials</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="orders-pagination">
          <span>Showing – of – purchase orders</span>
          <div>
            <button type="button" aria-label="Previous page" onClick={() => onAction('Previous page')}>‹</button>
            <span />
            <button type="button" aria-label="Next page" onClick={() => onAction('Next page')}>›</button>
          </div>
        </div>
      </section>

      <aside className="orders-notice">
        <strong>Only approved purchase orders can be received</strong>
        <span>Drafts and saved orders do not post inventory. Standard clean receipts update stock on confirmation; discrepancies require administrator approval before any stock update.</span>
      </aside>
    </div>
  );
}

function FabricationMonitoring({ onAction }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const columns = ['JOB ID', 'PRODUCT / PROJECT', 'CURRENT STATUS', 'ALLOCATED MATERIALS', 'LATEST UPDATE', 'ACTIONS'];

  return (
    <div className="fabrication-content">
      <p className="fabrication-breadcrumb">Workspace / Fabrication Monitoring</p>

      <section className="fabrication-metrics" aria-label="Fabrication job summary">
        {[
          ['Fabrication Jobs', 'Four selected products'],
          ['Planned', 'Raw Materials'],
          ['In Progress', 'Work-in-Progress'],
          ['Completed', 'Finished Goods'],
        ].map(([title, detail]) => (
          <article className="fabrication-metric" key={title}>
            <span>{title}</span>
            <strong aria-hidden="true" />
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <div className="fabrication-filters">
        <label className="fabrication-search">
          <Search size={14} />
          <input type="search" aria-label="Search job ID or product/project" placeholder="Search job ID or product/project..." />
        </label>
        <select aria-label="Filter by job status" defaultValue="">
          <option value="">All job statuses</option>
          <option>Planned</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <span aria-hidden="true" />
      </div>

      <section className="fabrication-table-panel" aria-label="Fabrication jobs">
        <div className="fabrication-table-scroll">
          <table className="fabrication-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 4 }, (_, row) => (
                <tr
                  key={row}
                  className={selectedJob === row ? 'selected' : ''}
                  onClick={() => setSelectedJob(row)}
                >
                  {columns.slice(0, -1).map((column) => <td key={column} />)}
                  <td>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      onAction('View job');
                    }}>
                      View job <ChevronRight size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="fabrication-pagination">
          <span>Showing – of – jobs · Select a row to open job details</span>
          <div>
            <button type="button" aria-label="Previous page" onClick={() => onAction('Previous page')}>‹</button>
            <span />
            <button type="button" aria-label="Next page" onClick={() => onAction('Next page')}>›</button>
          </div>
        </div>
      </section>

      <section className="fabrication-selected-job" aria-label="Selected job details">
        <header>
          <h2>Selected job</h2>
          <button type="button" onClick={() => onAction('Open job details')}>
            Open job details <ChevronRight size={10} />
          </button>
        </header>
        <div className="fabrication-detail-columns">
          <div><strong /><span /><span /></div>
          <div><strong /><span /><span /></div>
          <div><strong /><span /><span /></div>
        </div>
      </section>

      <p className="fabrication-note">Allocation reserves stock; it does not consume it. Actual usage is recorded separately in Stock Transactions.</p>
    </div>
  );
}

function Notifications({ onAction }) {
  const [activeFilter, setActiveFilter] = useState('All notifications');
  const filters = ['All notifications', 'Unread', 'Read', 'Resolved'];
  const columns = ['ALERT TYPE', 'SKU', 'ITEM', 'CURRENT QUANTITY', 'REORDER POINT', 'DATE', 'STATUS', 'ACTIONS'];

  return (
    <div className="notifications-content">
      <header className="notifications-page-heading">
        <div>
          <h1>Notifications</h1>
          <p>Monitor inventory alerts and important system updates.</p>
        </div>
        <button type="button" onClick={() => onAction('Mark all as read')}>Mark all as read</button>
      </header>

      <div className="notifications-tabs" role="tablist" aria-label="Notification status">
        {filters.map((filter) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === filter}
            className={activeFilter === filter ? 'active' : ''}
            key={filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}<span aria-hidden="true" />
          </button>
        ))}
      </div>

      <section className="notifications-table-panel" aria-label="Inventory alerts">
        <header className="notifications-table-title">
          <h2>Inventory alerts</h2>
          <span />
        </header>
        <div className="notifications-table-scroll">
          <table className="notifications-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 5 }, (_, row) => (
                <tr
                  key={row}
                  className={row === 0 ? 'selected' : ''}
                  onClick={() => onAction('Inventory Alert')}
                >
                  {columns.slice(0, -1).map((column) => <td key={column} />)}
                  <td className="notification-row-actions">
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      onAction('View Item');
                    }}>View Item <ChevronRight size={10} /></button>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      onAction('Mark Resolved');
                    }}>Mark Resolved</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="notifications-table-footer">
          <span>Showing all notifications • Current Quantity is physical on hand, not available stock</span>
        </footer>
      </section>

      <div className="notification-details-grid">
        <section className="notification-detail-panel">
          <header>
            <h2>Inventory alert</h2>
            <span />
          </header>
          <div className="notification-detail-content">
            <strong />
            <div />
            <p />
            <div className="notification-detail-actions">
              <button type="button" onClick={() => onAction('View Inventory Item')}>View Inventory Item <ChevronRight size={10} /></button>
              <button type="button" onClick={() => onAction('Mark Resolved')}>Mark Resolved</button>
            </div>
          </div>
        </section>
        <aside className="notification-explanation">
          <strong>Physical on hand ≤ reorder point</strong>
          <p>Unread / Read / Resolved: notification lifecycle. Low Stock / Out of Stock / In Stock: inventory condition.</p>
          <p>Configure reorder points through Edit Item in inventory. Replenishment decisions remain manual.</p>
        </aside>
      </div>
    </div>
  );
}

function Reports({ onAction }) {
  const [selectedReport, setSelectedReport] = useState('Inventory Status Report');
  const reports = [
    ['Inventory Status Report', 'Physical stock and availability'],
    ['Low-Stock Report', 'Items at or below reorder point'],
    ['Stock Transactions Report', 'Posted inventory movements'],
    ['Supplier and Purchase Order Report', 'Orders and receiving records'],
    ['Fabrication and Material Usage Report', 'Job allocation and consumption'],
  ];

  return (
    <div className="reports-content">
      <p className="reports-breadcrumb">Workspace / Reports</p>
      <p className="reports-type-label">REPORT TYPE</p>

      <div className="report-type-list" role="list">
        {reports.map(([title, detail]) => (
          <button
            type="button"
            className={`report-type-card${selectedReport === title ? ' selected' : ''}`}
            aria-pressed={selectedReport === title}
            key={title}
            onClick={() => setSelectedReport(title)}
          >
            <strong>{title}</strong>
            <span>{detail}</span>
          </button>
        ))}
      </div>

      <section className="report-filters">
        <header>
          <h2>Report filters</h2>
          <span />
        </header>
        <div className="report-filter-controls">
          <label>
            <span>SNAPSHOT DATE</span>
            <select defaultValue=""><option value="">Select date</option></select>
          </label>
          <label>
            <span>CATEGORY</span>
            <select defaultValue=""><option value="">All categories</option></select>
          </label>
          <label>
            <span>STATUS</span>
            <select defaultValue=""><option value="">All stock statuses</option></select>
          </label>
          <button type="button" onClick={() => onAction('Generate Report')}>Generate Report</button>
        </div>
      </section>

      <section className="report-preview" aria-label="Report preview">
        <div className="report-preview-content">
          <span className="report-preview-icon" aria-hidden="true" />
          <h2>Your report preview will appear here</h2>
          <p>Choose a report above, adjust the relevant filters, then select Generate Report to<br className="report-preview-break" /> review recorded warehouse data.</p>
          <span className="report-selected-label">Selected: {selectedReport}</span>
          <small />
          <small>No report generated yet</small>
        </div>
      </section>

      <aside className="reports-note">
        <strong>Reports use recorded operational data</strong>
        <span>Inventory reports show physical on hand. Reservations, pending adjustments and draft purchase orders do not change physical stock.</span>
      </aside>
    </div>
  );
}

function SystemSettings({ onAction }) {
  const [settingsTab, setSettingsTab] = useState('User Management');

  return (
    <div className="settings-content">
      <div className="settings-tabs" role="tablist" aria-label="System settings">
        {['User Management', 'Inventory Controls', 'Account'].map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === tab}
            className={settingsTab === tab ? 'active' : ''}
            key={tab}
            onClick={() => setSettingsTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {settingsTab === 'User Management' ? (
        <>
      <section className="user-management-panel">
        <header className="user-management-header">
          <div>
            <h2>User Management</h2>
            <p><span /> authorized accounts • <span /> Active • <span /> Inactive</p>
          </div>
          <div className="user-role-counts">
            <span>• Administrator •</span>
            <span>• Staff •</span>
          </div>
          <button type="button" onClick={() => onAction('Add User')}>
            <Plus size={12} strokeWidth={2.5} /> Add User
          </button>
        </header>

        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr><th>Name</th><th>Username/Email</th><th>Role</th><th>Account Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, row) => (
                <tr key={row}>
                  <td />
                  <td />
                  <td />
                  <td><span className="user-status-space" /></td>
                  <td className="user-row-actions">
                    <button type="button" onClick={() => onAction('Edit User')}>Edit User</button>
                    <button type="button" onClick={() => onAction('Deactivate User')}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="users-pagination">
          <span>Showing – of – accounts</span>
          <div>
            <button type="button" aria-label="Previous page" onClick={() => onAction('Previous page')}>‹</button>
            <span />
            <button type="button" aria-label="Next page" onClick={() => onAction('Next page')}>›</button>
          </div>
        </footer>
        <p className="users-policy">Inactive accounts cannot sign in. Account status does not change the assigned role; previous recorded operations are retained.</p>
      </section>

      <section className="access-safeguards">
        <h2>Access safeguards</h2>
        <p>Your current account cannot be deactivated or demoted. The last active Administrator is protected. Staff cannot see Settings or its controls.</p>
      </section>
      <p className="settings-baseline">Baseline • Administrator / Staff • Authorized workspace accounts</p>
        </>
      ) : (
        <div className="settings-empty-tab">{settingsTab}</div>
      )}
    </div>
  );
}

function AdminDashboard({ onSignOut, signingOut, error }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const metrics = [
    { title: 'Total Inventory Items', detail: 'active SKUs • main warehouse' },
    { title: 'Reorder Warnings', detail: 'low stock • out of stock', warning: true },
    { title: 'Purchase Orders', detail: 'not fully received • received' },
    { title: 'Fabrication Jobs', detail: 'active • completed' },
  ];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <h1>MetalFlow</h1>
          <p>JULITO METAL PRODUCTS TRADING</p>
        </div>

        <div className="warehouse-switcher">
          <strong>Main warehouse</strong>
          <span>Operations workspace</span>
        </div>

        <p className="dashboard-nav-label">WORKSPACE</p>
        <nav className="dashboard-navigation" aria-label="Workspace">
          {dashboardNavigation.map((item) => (
            <button
              type="button"
              key={item}
              className={`dashboard-nav-item${item === activeTab ? ' active' : ''}`}
              aria-current={item === activeTab ? 'page' : undefined}
              onClick={() => setActiveTab(item)}
            >
              <span>{item}</span>
              {item === 'Notifications' && <span className="nav-count" />}
            </button>
          ))}
        </nav>

        <footer className="dashboard-sidebar-footer">
          <button type="button" onClick={onSignOut} disabled={signingOut} aria-label="Sign out">
            Administrator access
          </button>
          <small>MetalFlow • Internal use only</small>
        </footer>
      </aside>

      <div className="dashboard-main">
        <header className={`dashboard-topbar${activeTab === 'Notifications' ? ' notification-topbar' : ''}`}>
          <div className="dashboard-heading">
            {activeTab === 'Notifications' ? (
              <p>Workspace / Notifications</p>
            ) : activeTab === 'Reports' ? (
              <>
                <h2>Reports</h2>
                <p>Generate and review inventory and operations records.</p>
              </>
            ) : activeTab === 'Settings' ? (
              <>
                <h2>System Settings</h2>
                <p>Manage authorized access, inventory thresholds and your account.</p>
              </>
            ) : (
              <>
            <h2>
              {activeTab === 'Dashboard'
                ? 'Dashboard'
                : activeTab === 'Inventory'
                  ? 'Inventory Management'
                  : activeTab === 'Stock Transactions' || activeTab === 'Suppliers' || activeTab === 'Orders & Receiving' || activeTab === 'Fabrication Monitoring' || activeTab === 'Reports'
                    ? activeTab
                    : 'Dashboard'}
            </h2>
            <p>
              {activeTab === 'Inventory'
                ? 'Material records, stock levels and warehouse availability'
                : activeTab === 'Stock Transactions'
                  ? 'Material movements, reservations and an auditable stock ledger'
                  : activeTab === 'Suppliers'
                    ? 'Maintain trusted industrial suppliers and purchasing contacts'
                    : activeTab === 'Orders & Receiving'
                      ? 'Track industrial procurement from approval to material receipt'
                      : activeTab === 'Fabrication Monitoring'
                        ? 'Track fabrication jobs, material allocations and actual usage'
                    : 'Overview of Inventory and Operations • Snapshot'}
            </p>
              </>
            )}
          </div>
          <div className="dashboard-top-actions">
            <button
              type="button"
              className="dashboard-notifications"
              aria-label="Notifications"
              onClick={() => setActiveTab('Notifications')}
            >
              <Bell size={14} />
              <span />
            </button>
            <div className="dashboard-profile">
              <strong />
              <span>Administrator</span>
            </div>
            <button
              type="button"
              className="dashboard-add-button"
              hidden={activeTab === 'Notifications' || activeTab === 'Reports' || activeTab === 'Settings'}
              onClick={() => setActiveTab(
                activeTab === 'Stock Transactions'
                  ? 'Record Transaction'
                  : activeTab === 'Suppliers'
                    ? 'Add Supplier'
                    : activeTab === 'Orders & Receiving'
                      ? 'Create Purchase Order'
                        : activeTab === 'Fabrication Monitoring'
                          ? 'New Fabrication Job'
                      : 'Add Item',
              )}
            >
              <Plus size={13} strokeWidth={2.5} />
              {activeTab === 'Stock Transactions'
                ? 'Record Transaction'
                : activeTab === 'Suppliers'
                  ? 'Add Supplier'
                  : activeTab === 'Orders & Receiving'
                    ? 'Create Purchase Order'
                    : activeTab === 'Fabrication Monitoring'
                      ? 'New Fabrication Job'
                  : 'Add Item'}
            </button>
          </div>
        </header>

        <div className={`dashboard-content${activeTab !== 'Dashboard' && activeTab !== 'Inventory' && activeTab !== 'Stock Transactions' && activeTab !== 'Suppliers' && activeTab !== 'Orders & Receiving' && activeTab !== 'Fabrication Monitoring' && activeTab !== 'Notifications' && activeTab !== 'Reports' && activeTab !== 'Settings' ? ' dashboard-empty-tab' : ''}${activeTab === 'Inventory' ? ' inventory-content' : ''}${activeTab === 'Stock Transactions' ? ' stock-content' : ''}${activeTab === 'Suppliers' ? ' supplier-content-shell' : ''}${activeTab === 'Orders & Receiving' ? ' orders-content-shell' : ''}${activeTab === 'Fabrication Monitoring' ? ' fabrication-content-shell' : ''}${activeTab === 'Notifications' ? ' notifications-content-shell' : ''}${activeTab === 'Reports' ? ' reports-content-shell' : ''}${activeTab === 'Settings' ? ' settings-content-shell' : ''}`}>
          {error && <p className="dashboard-error" role="alert">{error}</p>}

          {activeTab === 'Dashboard' ? (
            <>
          <section className="dashboard-metrics" aria-label="Inventory overview">
            {metrics.map((metric) => (
              <article className="dashboard-metric-card" key={metric.title}>
                <div className="dashboard-metric-label">
                  {metric.title}
                  {metric.warning && <AlertTriangle size={14} />}
                </div>
                <div className="dashboard-metric-value" aria-hidden="true" />
                <p><span /> {metric.detail} <ChevronRight size={10} /></p>
              </article>
            ))}
          </section>

          <DashboardPanel
            title="Reorder Warnings"
            subtitle="Showing warnings • physical on hand ≤ reorder point"
            action="View all alerts"
            onAction={setActiveTab}
            className="reorder-panel"
          >
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>SKU</th><th>ITEM</th><th>CATEGORY</th><th>QUANTITY</th><th>REORDER POINT</th><th>STATUS</th>
                  </tr>
                </thead>
                <tbody><BlankRows count={3} columns={6} /></tbody>
              </table>
            </div>
          </DashboardPanel>

          <div className="dashboard-two-column">
            <DashboardPanel title="Purchase Orders" subtitle="orders • approved outstanding • draft" action="View orders" onAction={setActiveTab}>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr><th>PO NUMBER</th><th>SUPPLIER</th><th>STATUS</th><th>RECEIVING PROGRESS</th></tr>
                  </thead>
                  <tbody><BlankRows count={3} columns={4} /></tbody>
                </table>
              </div>
            </DashboardPanel>
            <DashboardPanel title="Fabrication Activity" subtitle="active • completed" action="View jobs" onAction={setActiveTab}>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr><th>JOB ID</th><th>PRODUCT</th><th>CURRENT STATUS</th><th>LATEST UPDATE</th></tr>
                  </thead>
                  <tbody><BlankRows count={3} columns={4} /></tbody>
                </table>
              </div>
            </DashboardPanel>
          </div>

          <div className="dashboard-bottom-grid">
            <DashboardPanel title="Recent Stock Transactions" subtitle="Latest posted movements • pending adjustments excluded" action="View ledger" onAction={setActiveTab}>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr><th>DATE</th><th>ITEM</th><th>TYPE</th><th>QUANTITY</th><th>RECORDED BY</th></tr>
                  </thead>
                  <tbody><BlankRows count={3} columns={5} /></tbody>
                </table>
              </div>
            </DashboardPanel>
            <DashboardPanel title="Inventory by Category" subtitle="inventory items • count of distinct SKUs">
              <div className="category-list">
                {['Raw Materials', 'Industrial Parts', 'Consumables', 'WIP', 'Finished Goods'].map((category) => (
                  <div className="category-row" key={category}>
                    <span>{category}</span>
                    <div className="category-track" />
                    <strong />
                  </div>
                ))}
              </div>
            </DashboardPanel>
          </div>
            </>
          ) : activeTab === 'Inventory' ? (
            <InventoryManagement onAction={setActiveTab} />
          ) : activeTab === 'Stock Transactions' ? (
            <StockTransactions onAction={setActiveTab} />
          ) : activeTab === 'Suppliers' ? (
            <SupplierManagement onAction={setActiveTab} />
          ) : activeTab === 'Orders & Receiving' ? (
            <PurchaseOrders onAction={setActiveTab} />
          ) : activeTab === 'Fabrication Monitoring' ? (
            <FabricationMonitoring onAction={setActiveTab} />
          ) : activeTab === 'Notifications' ? (
            <Notifications onAction={setActiveTab} />
          ) : activeTab === 'Reports' ? (
            <Reports onAction={setActiveTab} />
          ) : activeTab === 'Settings' ? (
            <SystemSettings onAction={setActiveTab} />
          ) : (
            <p className="dashboard-empty-tab-label">{activeTab}</p>
          )}
         </div>
      </div>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [signInTransition, setSignInTransition] = useState(false);
  const [resetRequest, setResetRequest] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [roleLoading, setRoleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (active) {
        if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
        if (event === 'SIGNED_IN') setSignInTransition(true);
        setSession(nextSession);
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) {
      setRole(null);
      setRoleError('');
      setRoleLoading(false);
      return undefined;
    }

    let active = true;
    setRole(null);
    setRoleError('');
    setRoleLoading(true);

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error: lookupError }) => {
        if (!active) return;
        if (lookupError) {
          setRoleError(lookupError.message);
        } else if (data?.role === 'admin' || data?.role === 'staff') {
          setRole(data.role);
        } else {
          setRoleError('Your account is signed in, but an admin or staff role has not been assigned.');
        }
        setRoleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!signInTransition || !role || roleLoading) return undefined;

    const timer = window.setTimeout(() => setSignInTransition(false), 900);
    return () => window.clearTimeout(timer);
  }, [signInTransition, role, roleLoading]);

  useEffect(() => {
    if (!supabase || !session?.user?.id || roleLoading || role || !roleError) return;

    setError(roleError);
    supabase.auth.signOut().then(({ error: signOutError }) => {
      if (signOutError) {
        setError(`${roleError} Sign out failed: ${signOutError.message}`);
      }
    }).catch((signOutError) => {
      const message = signOutError instanceof Error ? signOutError.message : String(signOutError);
      setError(`${roleError} Sign out failed: ${message}`);
    });
  }, [session?.user?.id, roleLoading, role, roleError]);

  async function handleSignOut() {
    if (!supabase) return;

    setSigningOut(true);
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(signOutError.message);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : String(signOutError));
    } finally {
      setSigningOut(false);
    }
  }

  async function handleSignIn(event) {
    event.preventDefault();
    if (!supabase) return;

    setSubmitting(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) setError(signInError.message);
    setSubmitting(false);
  }

  async function handlePasswordResetRequest(event) {
    event.preventDefault();
    if (!supabase) return;

    setSubmitting(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
    setSubmitting(false);
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    if (!supabase) return;
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
    } else {
      setPasswordRecovery(false);
      setNewPassword('');
      setConfirmPassword('');
    }
    setSubmitting(false);
  }

  if (session && !passwordRecovery && !signInTransition && role === 'admin') {
    return <AdminDashboard onSignOut={handleSignOut} signingOut={signingOut} error={error} />;
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-brand-panel">
          <p className="brand-company">Julito Metal Products Trading</p>

          <div className="brand-copy">
            <div className="brand-accent" />
            <h1 className="brand-title">MetalFlow</h1>
            <p className="brand-description">
              Inventory Tracking &amp; Operations Management System.
            </p>
          </div>

          <svg
            aria-hidden="true"
            viewBox="185 490 440 245"
            preserveAspectRatio="xMaxYMax slice"
            className="brand-illustration"
            fill="none"
            stroke="#c7a26a"
            strokeOpacity="0.22"
            strokeWidth="1"
          >
            <path d="M210 568 L432 497 L625 557" />
            <path d="M210 568 L449 640 L625 586" />
            <path d="M294 542 L530 614" />
            <path d="M378 515 L614 586" />
            <path d="M530 614 L614 586" />
            <path d="M210 568 V648" />
            <path d="M449 640 V726" />
            <path d="M210 608 L449 687 L625 628" />
            <path d="M210 627 L449 707 L625 648" />
            <path d="M210 648 L449 726 L625 668" />
          </svg>

          <div className="brand-footer">
            <ShieldCheck size={14} strokeWidth={1.75} className="gold-icon" />
            <span>MetalFlow &bull; Internal use only</span>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-content">
            {session && !passwordRecovery ? (
              signInTransition ? (
                <section className="sign-in-success-card" aria-label="Sign-in successful" aria-live="polite">
                  <span className="success-check" aria-hidden="true">
                    <Check size={18} strokeWidth={2} />
                  </span>
                  <p className="success-badge">Access verified</p>
                  <h1>Sign-in successful</h1>
                  <p>Your assigned role determines your workspace.</p>
                </section>
              ) : role === 'admin' ? (
                <AdminDashboard onSignOut={handleSignOut} signingOut={signingOut} error={error} />
              ) : (
                <div className="login-card role-card" aria-live="polite">
                  {roleLoading ? (
                    <p className="login-description">Loading your workspace...</p>
                  ) : role ? (
                    <>
                      <p className="login-eyebrow">Internal Workspace</p>
                      <h2 className="login-title">{role === 'admin' ? 'Admin' : 'Staff'}</h2>
                      <button
                        type="button"
                        className="sign-in-button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                      >
                        {signingOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                      {error && <p className="auth-message auth-error" role="alert">{error}</p>}
                    </>
                  ) : (
                    <p className="login-description">Returning to sign in...</p>
                  )}
                </div>
              )
            ) : passwordRecovery ? (
              <div className="login-card">
                <p className="login-eyebrow">Account Recovery</p>
                <h2 className="login-title">Choose a new password</h2>
                <p className="login-description">Enter and confirm your new password.</p>
                <form className="login-form" onSubmit={handlePasswordUpdate}>
                  <label htmlFor="new-password" className="form-label">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    className="login-input"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                  />
                  <label htmlFor="confirm-password" className="password-label">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="login-input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                  />
                  {error && <p className="auth-message auth-error" role="alert">{error}</p>}
                  <button type="submit" className="sign-in-button" disabled={!supabase || submitting}>
                    {submitting ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            ) : resetRequest ? (
              <div className="login-card">
                <p className="login-eyebrow">Account Recovery</p>
                <h2 className="login-title">Reset your password</h2>
                <p className="login-description">
                  We’ll email you a secure link to choose a new password.
                </p>
                {resetSent ? (
                  <p className="auth-message auth-success" role="status">
                    If an account exists for this email, a password reset link has been sent.
                    Check your inbox and spam folder.
                  </p>
                ) : (
                  <form className="login-form" onSubmit={handlePasswordResetRequest}>
                    <label htmlFor="reset-email" className="form-label">Email</label>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="username"
                      placeholder="Enter your email"
                      className="login-input"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                    {error && <p className="auth-message auth-error" role="alert">{error}</p>}
                    <button type="submit" className="sign-in-button" disabled={!supabase || submitting}>
                      {submitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setResetRequest(false);
                    setResetSent(false);
                    setError('');
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div className="login-card">
                <p className="login-eyebrow">Internal Workspace</p>
                <h2 className="login-title">Welcome Back</h2>
                <p className="login-description">Sign in to access MetalFlow.</p>

                <form className="login-form" onSubmit={handleSignIn}>
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    className="login-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />

                  <label htmlFor="password" className="password-label">Password</label>
                  <div className="password-control">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="password-input"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="show-password-button"
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword
                        ? <EyeOff size={16} strokeWidth={1.75} />
                        : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="text-link reset-link"
                    onClick={() => {
                      setResetRequest(true);
                      setError('');
                    }}
                  >
                    Forgot password?
                  </button>

                  {error && <p className="auth-message auth-error" role="alert">{error}</p>}
                  {supabaseConfigError && (
                    <p className="auth-message auth-error" role="alert">{supabaseConfigError}</p>
                  )}

                  <button
                    type="submit"
                    className="sign-in-button"
                    disabled={!supabase || authLoading || submitting}
                  >
                    {submitting ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div className="authorization-note">
                    <Lock size={13} strokeWidth={1.75} className="authorization-icon" />
                    Authorized Personnel Only.
                  </div>
                </form>
              </div>
            )}

            <p className="login-help">
              Accounts are managed by authorized administrators.
              <br />
              For access assistance, contact your administrator.
            </p>
          </div>

          <div className="login-footer">MetalFlow &bull; Secure sign-in</div>
        </section>
      </div>
    </main>
  );
}
