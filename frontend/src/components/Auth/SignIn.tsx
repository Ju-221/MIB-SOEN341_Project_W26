import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import cauldronImg from '../../assets/uploads/a-pot-of-soup-with-vegetables-and-herbs-free-png.webp';
import smokeGif from '../../assets/uploads/smoke.gif';
import mintImg from '../../assets/uploads/mint.png';
import './SignIn.css';

type View = 'signin' | 'signup';

interface SignInProps {
  readonly onSuccess?: () => void;
  readonly initialView?: View;
}

const FEATURES = [
  { text: 'Create recipes', icon: '✦' },
  { text: 'Generate with AI', icon: '✦' },
  { text: 'Organize your meals', icon: '✦' },
  { text: 'Be the healthiest you can be!', icon: '✦' },
];

const smokePositions = [
  { left: '53%', top: '-40%', transform: 'translateX(-50%)' },
  { left: '53%', top: '-40%', transform: 'translateX(-50%) scaleY(1.13)' },
  { left: '58%', top: '-40%', transform: 'translateX(-50%) scaleY(1.13)' },
  { left: '18%', top: '-40%', transform: 'translateX(-50%)' },
  { left: '18%', top: '-40%', transform: 'translateX(-50%) scaleY(1.13)' },
  { left: '23%', top: '-40%', transform: 'translateX(-50%) scaleY(1.13)' },
  { left: '35.5%', top: '-35%', transform: 'translateX(-50%)' },
  { left: '35.5%', top: '-35%', transform: 'translateX(-50%) scaleY(1.13)' },
  { left: '40.5%', top: '-35%', transform: 'translateX(-50%) scaleY(1.13)' },
];

// ── Top-level helpers (no nesting penalty) ───────────────────────────────────

async function fetchSignIn(
  email: string,
  password: string
): Promise<{ token: string; userEmail: string }> {
  const res = await fetch('http://localhost:3000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return { token: data.token, userEmail: data.user?.email || email };
}

async function fetchSignUp(
  email: string,
  password: string
): Promise<{ token: string; userEmail: string }> {
  const res = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  return { token: data.token, userEmail: data.user?.email || email };
}

function isValidEmail(email: string): boolean {
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return false;
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
}

function validateSignUp(email: string, password: string, confirm: string): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!email) errs.email = 'Email is required';
  else if (!isValidEmail(email)) errs.email = 'Please enter a valid email';
  if (!password) errs.password = 'Password is required';
  else if (password.length < 6) errs.password = 'Must be at least 6 characters';
  if (!confirm) errs.confirm = 'Please confirm your password';
  else if (password !== confirm) errs.confirm = 'Passwords do not match';
  return errs;
}

// ── SignInForm sub-component ─────────────────────────────────────────────────

interface SignInFormProps {
  readonly onSuccess?: () => void;
  readonly onSwitchView: () => void;
}

function SignInForm({ onSuccess, onSwitchView }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, userEmail } = await fetchSignIn(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', userEmail);
      localStorage.removeItem('rememberMe');
      if (rememberMe) localStorage.setItem('rememberMe', 'true');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="email">
            Email Address <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Password <span className="required">*</span>
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe">Remember me</label>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don&apos;t have an account?{' '}
          <a
            href="#signup"
            onClick={(e) => {
              e.preventDefault();
              onSwitchView();
            }}
          >
            Create one now
          </a>
        </p>
      </div>
    </>
  );
}

// ── SignUpForm sub-component ─────────────────────────────────────────────────

interface SignUpFormProps {
  readonly onSuccess?: () => void;
  readonly onSwitchView: () => void;
}

function SignUpForm({ onSuccess, onSwitchView }: SignUpFormProps) {
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [showSuPassword, setShowSuPassword] = useState(false);
  const [showSuConfirm, setShowSuConfirm] = useState(false);
  const [suErrors, setSuErrors] = useState<Record<string, string>>({});
  const [suLoading, setSuLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateSignUp(suEmail, suPassword, suConfirm);
    if (Object.keys(errs).length > 0) {
      setSuErrors(errs);
      return;
    }
    setSuErrors({});
    setSuLoading(true);
    try {
      const { token, userEmail } = await fetchSignUp(suEmail, suPassword);
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', userEmail);
      onSuccess?.();
    } catch (err) {
      setSuErrors({ general: err instanceof Error ? err.message : 'Signup failed' });
    } finally {
      setSuLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        {suErrors.general && <div className="auth-error">{suErrors.general}</div>}

        <div className="form-group">
          <label htmlFor="su-email">
            Email Address <span className="required">*</span>
          </label>
          <input
            type="email"
            id="su-email"
            placeholder="john.doe@example.com"
            value={suEmail}
            onChange={(e) => setSuEmail(e.target.value)}
          />
          {suErrors.email && <span className="field-error">{suErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="su-password">
            Password <span className="required">*</span>
          </label>
          <div className="password-input-wrapper">
            <input
              type={showSuPassword ? 'text' : 'password'}
              id="su-password"
              placeholder="Create a strong password"
              value={suPassword}
              onChange={(e) => setSuPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowSuPassword((v) => !v)}
              aria-label="Toggle password visibility"
            >
              {showSuPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <span className="help-text">Must be at least 6 characters</span>
          {suErrors.password && <span className="field-error">{suErrors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="su-confirm">
            Confirm Password <span className="required">*</span>
          </label>
          <div className="password-input-wrapper">
            <input
              type={showSuConfirm ? 'text' : 'password'}
              id="su-confirm"
              placeholder="Re-enter your password"
              value={suConfirm}
              onChange={(e) => setSuConfirm(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowSuConfirm((v) => !v)}
              aria-label="Toggle confirm password visibility"
            >
              {showSuConfirm ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {suErrors.confirm && <span className="field-error">{suErrors.confirm}</span>}
        </div>

        <button type="submit" className="auth-button" disabled={suLoading}>
          {suLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already registered?{' '}
          <a
            href="#signin"
            onClick={(e) => {
              e.preventDefault();
              onSwitchView();
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </>
  );
}

// ── Main SignIn component (lean orchestrator) ────────────────────────────────

function SignIn({ onSuccess, initialView = 'signin' }: SignInProps) {
  const [view, setView] = useState<View>(initialView);
  const slogansRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.auth-panel-title',
        { x: -70, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.auth-panel-subtitle',
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 0.25, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.auth-feature-item',
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.18, delay: 0.45, ease: 'power3.out' }
      );
    },
    { scope: slogansRef, dependencies: [view] }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    if (token && isRemembered) onSuccess?.();
  }, [onSuccess]);

  useEffect(() => {
    window.location.hash = view === 'signup' ? '#signup' : '#signin';
  }, [view]);

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      {/* Left panel — title + features */}
      <div ref={slogansRef} className="auth-slogans-container">
        <div className="auth-slogans-content">
          <h2 className="auth-panel-title">{view === 'signin' ? 'Sign in' : 'Register'}</h2>
          <p className="auth-panel-subtitle">to get access to our premium features:</p>
          <ul className="auth-features-list">
            {FEATURES.map((f) => (
              <li key={f.text} className="auth-feature-item">
                <span className="auth-feature-icon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card */}
      <div className="auth-wrap">
        <div className="auth-card-container">
          <img
            src={mintImg}
            alt=""
            draggable={false}
            aria-hidden="true"
            className="auth-card-mint"
          />
          <div className="auth-card">
            <div className="auth-header">
              <h1>MealMajor</h1>
            </div>
            {view === 'signin' ? (
              <SignInForm onSuccess={onSuccess} onSwitchView={() => setView('signup')} />
            ) : (
              <SignUpForm onSuccess={onSuccess} onSwitchView={() => setView('signin')} />
            )}
          </div>
        </div>
      </div>

      {/* Brown circle */}
      <div className="auth-circle" />

      {/* Cauldron */}
      <div className="auth-cauldron-mask" aria-hidden="true" />
      <div className="auth-cauldron-group" aria-hidden="true">
        <img src={cauldronImg} alt="Cauldron" className="auth-cauldron" draggable={false} />
        {smokePositions.map((pos, i) => (
          <img
            key={i}
            src={smokeGif}
            alt=""
            draggable={false}
            className="smoke"
            style={{ left: pos.left, top: pos.top, transform: pos.transform }}
          />
        ))}
      </div>
    </div>
  );
}

export default SignIn;
