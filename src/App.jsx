import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { supabase, supabaseConfigError } from './supabase.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
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

  if (session && !passwordRecovery) {
    return (
      <main className="role-landing" aria-live="polite">
        {roleLoading ? (
          <p>Loading...</p>
        ) : role ? (
          <div className="role-landing-content">
            <h1>{role === 'admin' ? 'Admin' : 'Staff'}</h1>
            <button
              type="button"
              className="role-sign-out-button"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          </div>
        ) : <p>Returning to sign in...</p>}
      </main>
    );
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
            {passwordRecovery ? (
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
