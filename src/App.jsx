import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { supabase, supabaseConfigError } from './supabase.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [roleLoading, setRoleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
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

  async function handleSignOut() {
    if (!supabase) return;

    setError('');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
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
            {session ? (
              <div className="login-card role-card" aria-live="polite">
                <p className="login-eyebrow">Internal Workspace</p>
                {roleLoading ? (
                  <>
                    <h2 className="login-title">Checking access</h2>
                    <p className="login-description">Verifying your assigned role...</p>
                  </>
                ) : role ? (
                  <>
                    <h2 className="login-title">{role === 'admin' ? 'Admin' : 'Staff'} access granted</h2>
                    <p className="login-description">
                      You are signed in as <strong>{role}</strong>.
                    </p>
                    <button type="button" className="sign-in-button" onClick={handleSignOut}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="login-title">Access not assigned</h2>
                    <p className="login-description">
                      {roleError || 'Your account does not have an assigned role.'}
                    </p>
                    <button type="button" className="sign-in-button" onClick={handleSignOut}>
                      Sign Out
                    </button>
                  </>
                )}
                {error && <p className="auth-message auth-error" role="alert">{error}</p>}
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
