import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { APP_ROUTES } from '../../config';
import { Icon } from '../components/Icon';
import { TextInput } from '../components/Primitives';

export function LoginPage() {
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithPat } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = (location.state as { from?: string } | null)?.from;
  const returnPath =
    requestedPath === APP_ROUTES.studioBase ||
    requestedPath?.startsWith(`${APP_ROUTES.studioBase}/`)
      ? requestedPath
      : APP_ROUTES.home;
  const errorMessages: Record<string, string> = {
    auth_provider_not_configured:
      'Secure GitHub verification is not configured for this environment yet.',
    authentication_unavailable: 'The verification API could not be reached. Try again shortly.',
    github_token_invalid: 'GitHub rejected this token.',
    repository_write_denied: 'This GitHub account cannot write to the configured repository.',
    github_rate_limited: 'GitHub is rate-limiting verification. Wait and try again.',
    github_verification_failed: 'GitHub verification is temporarily unavailable. Try again.',
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pat.trim() || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithPat(pat.trim());
      setPat('');
      navigate(returnPath, { replace: true });
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
      <div className="brand-mark brand-mark-centered">
        <Icon name="accessKey" size={17} />
      </div>
      <h1 className="login-heading" id="login-title">
        Verify GitHub access
      </h1>
      <p className="login-copy">
        The API will verify your GitHub identity and write permission for the configured repository.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="secret-field">
          <TextInput
            autoComplete="new-password"
            id="github-pat"
            label="GitHub classic personal access token"
            name="github-pat"
            onChange={(event) => setPat(event.target.value)}
            required
            type={showPat ? 'text' : 'password'}
            value={pat}
          />
          <button
            className="secret-toggle"
            type="button"
            aria-controls="github-pat"
            aria-label={showPat ? 'Hide personal access token' : 'Show personal access token'}
            onClick={() => setShowPat((visible) => !visible)}
          >
            {showPat ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          className="action-button action-button-primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Verifying…' : 'Verify and continue'}
        </button>
        {error && (
          <p className="status-message status-error" role="alert">
            {error}
          </p>
        )}
      </form>
      <p className="status-message">
        Your token is sent to the API for verification, cleared after the attempt, and never stored
        in browser persistence.
      </p>
      <Link className="status-message" to={APP_ROUTES.home}>
        Return to public home
      </Link>
    </section>
  );
}
