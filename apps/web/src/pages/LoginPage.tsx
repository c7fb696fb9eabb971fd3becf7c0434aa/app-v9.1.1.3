import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { APP_ROUTES } from '../../config';

export function LoginPage() {
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithPat } = useAuth();
  const navigate = useNavigate();
  const errorMessages: Record<string, string> = {
    github_token_invalid: 'GitHub rejected this token.',
    repository_write_denied: 'This GitHub account cannot write to the configured repository.',
    github_rate_limited: 'GitHub is rate-limiting verification. Wait and try again.',
    github_unavailable: 'GitHub could not be reached. Check your connection and try again.',
    github_permission_denied: 'This GitHub account cannot access the configured repository.',
    github_request_failed: 'GitHub could not verify access. Try again shortly.',
    github_session_storage_unavailable:
      'Your browser could not save this session. Check its storage settings and try again.',
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pat.trim() || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithPat(pat.trim());
      setPat('');
      navigate(APP_ROUTES.home, { replace: true });
    } catch (cause) {
      const errorCode = cause instanceof Error ? cause.message : 'authentication_failed';
      setError(
        errorMessages[errorCode] ?? 'GitHub verification failed. Check access and try again.',
      );
    } finally {
      setPat('');
      setIsSubmitting(false);
    }
  }

  return (
    <section className="login-panel" aria-labelledby="login-title">
      <h1 className="login-heading" id="login-title">
        Authenticate
      </h1>
      <p className="login-copy">
        Authenticate with your account in order to push &amp; commit files to the configured
        repository.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="login-field">
          <label className="login-field-label" htmlFor="github-pat">
            Personal Access Token
          </label>
          <div className="login-input-control">
            <input
              autoComplete="new-password"
              className="login-input"
              id="github-pat"
              name="github-pat"
              onChange={(event) => setPat(event.target.value)}
              required
              type={showPat ? 'text' : 'password'}
              value={pat}
            />
            <button
              className="login-visibility-toggle"
              type="button"
              aria-controls="github-pat"
              aria-label={showPat ? 'Hide personal access token' : 'Show personal access token'}
              onClick={() => setShowPat((visible) => !visible)}
            >
              {showPat ? (
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M9.88 5.09A10.77 10.77 0 0 1 12 4.88c5.23 0 8.33 4.83 9.39 6.76a1 1 0 0 1 0 .96 16.4 16.4 0 0 1-3.05 3.87" />
                  <path d="M6.61 6.61a16.47 16.47 0 0 0-4 5.03 1 1 0 0 0 0 .96C3.67 14.53 6.77 19.36 12 19.36c1.14 0 2.18-.25 3.12-.67" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <button
          className="action-button action-button-secondary login-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Authenticating…' : 'Authenticate'}
        </button>
        <div className="login-provider-options" aria-label="Additional sign-in options">
          {['Google', 'GitHub', 'ChatGPT', 'SAML SSO', 'Passkey'].map((provider) => (
            <button
              key={provider}
              className="action-button action-button-secondary login-provider-button"
              type="button"
              disabled
            >
              Continue with {provider}
            </button>
          ))}
        </div>
        {error && (
          <p className="status-message status-error" role="alert">
            {error}
          </p>
        )}
      </form>
      <Link
        className="action-button action-button-secondary login-home-link"
        to={APP_ROUTES.publicHome}
      >
        <span className="login-home-arrow" aria-hidden="true">
          <svg
            focusable="false"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </span>
        <span>Return to Home Page</span>
      </Link>
    </section>
  );
}
