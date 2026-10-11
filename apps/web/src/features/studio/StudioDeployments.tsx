import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GITHUB_REPOSITORY } from '../../../config';
import { Button } from '../../components/Primitives';
import { useAuth } from '../auth';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  headSha: string;
}

function parseWorkflowRuns(value: unknown): WorkflowRun[] {
  if (!value || typeof value !== 'object' || !('workflow_runs' in value)) {
    throw new Error('github_invalid_response');
  }
  const runs = value.workflow_runs;
  if (!Array.isArray(runs)) throw new Error('github_invalid_response');
  return runs.map((run: unknown) => {
    if (
      !run ||
      typeof run !== 'object' ||
      !('id' in run) ||
      typeof run.id !== 'number' ||
      !Number.isSafeInteger(run.id) ||
      !('name' in run) ||
      typeof run.name !== 'string' ||
      !('status' in run) ||
      typeof run.status !== 'string' ||
      !('conclusion' in run) ||
      !(typeof run.conclusion === 'string' || run.conclusion === null) ||
      !('created_at' in run) ||
      typeof run.created_at !== 'string' ||
      !Number.isFinite(Date.parse(run.created_at)) ||
      !('head_sha' in run) ||
      typeof run.head_sha !== 'string'
    ) {
      throw new Error('github_invalid_response');
    }
    return {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      headSha: run.head_sha,
    };
  });
}

function workflowState(run: WorkflowRun): string {
  return run.status === 'completed' ? (run.conclusion ?? 'completed') : run.status;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function StudioDeployments() {
  const { githubRequest } = useAuth();
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void githubRequest(
      `/repos/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}/actions/runs?per_page=10`,
    )
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) throw new Error('github_token_invalid');
          if (response.status === 403 || response.status === 404) {
            throw new Error('github_permission_denied');
          }
          if (response.status === 429) throw new Error('github_rate_limited');
          throw new Error('github_request_failed');
        }
        return parseWorkflowRuns(await response.json());
      })
      .then((result) => {
        if (active) setRuns(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const code = cause instanceof Error ? cause.message : 'unknown_error';
        const knownMessages: Record<string, string> = {
          authentication_required: 'Sign in with GitHub to view workflow status.',
          github_token_invalid: 'GitHub rejected the current session. Sign in again.',
          github_rate_limited: 'GitHub is rate-limiting requests. Try again shortly.',
          github_permission_denied: 'The current account cannot read the repository workflow runs.',
          github_unavailable: 'GitHub could not be reached. Try again when online.',
          github_invalid_response: 'GitHub returned an invalid workflow response.',
        };
        setError(knownMessages[code] ?? `Could not load workflow runs (${code}).`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [githubRequest, reload]);

  return (
    <section className="studio-deployments" aria-labelledby="deployments-title">
      <header className="studio-management-header">
        <Link className="studio-home-link" to="/studio">
          Go to Studio
        </Link>
        <h1 id="deployments-title">Deployments &amp; GitHub Sync Portal</h1>
        <Button type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>
          {loading ? 'Checking…' : 'Refresh status'}
        </Button>
      </header>

      <section className="studio-card deployments-summary" aria-label="Deployment configuration">
        <h2>Deployment pipeline</h2>
        <p>
          <strong>Repository:</strong> {GITHUB_REPOSITORY.owner}/{GITHUB_REPOSITORY.name}
        </p>
        <p>
          <strong>Branch:</strong> {GITHUB_REPOSITORY.branch}
        </p>
        <p>
          GitHub Actions runs are shown below. A successful content commit does not confirm that a
          Pages deployment has finished.
        </p>
      </section>

      <section
        className="studio-card deployment-history"
        aria-labelledby="deployment-history-title"
      >
        <div className="studio-section-heading">
          <div>
            <h2 id="deployment-history-title">Recent GitHub Actions runs</h2>
            <p className="studio-muted">Live status from the configured repository.</p>
          </div>
        </div>
        {loading && (
          <p className="status-message" role="status">
            Loading workflow runs…
          </p>
        )}
        {error && (
          <div className="deployment-error" role="alert">
            <p>{error}</p>
            <Button type="button" onClick={() => setReload((value) => value + 1)}>
              Try again
            </Button>
          </div>
        )}
        {!loading && !error && runs.length === 0 && (
          <p className="status-message" role="status">
            No GitHub Actions runs were returned for this repository.
          </p>
        )}
        {!loading && !error && runs.length > 0 && (
          <ol className="deployment-run-list">
            {runs.map((run) => (
              <li key={run.id}>
                <a
                  href={`https://github.com/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}/actions/runs/${run.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>{run.name}</strong>
                </a>
                <span className={`deployment-state state-${workflowState(run)}`}>
                  {workflowState(run)}
                </span>
                <time dateTime={run.createdAt}>{formatDate(run.createdAt)}</time>
                <code>{run.headSha.slice(0, 12)}</code>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
