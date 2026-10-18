import { useState, type ChangeEvent, type RefObject } from 'react';
import { AnchoredDialog } from './Workspace';
import { Button } from './Primitives';
import { Icon } from './Icon';

export type GitHubRepositoryTarget = {
  owner: string;
  name: string;
  branch: string;
};

export type GitHubSyncCopy = {
  dialogLabel: string;
  title: string;
  closeLabel: string;
  ownerLabel: string;
  repositoryLabel: string;
  branchLabel: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  connectedTokenPlaceholder: string;
  resultsTitle: string;
  resultsMessage: string;
  connectedMessage: string;
  testSuccessMessage: string;
  testFailureMessage: string;
  saveSuccessMessage: string;
  saveFailureMessage: string;
  testLabel: string;
  saveLabel: string;
};

function connectionErrorMessage(cause: unknown, fallback: string): string {
  const code = cause instanceof Error ? cause.message : '';
  switch (code) {
    case 'github_token_invalid':
      return 'GitHub rejected this token. Check it and try again.';
    case 'github_permission_denied':
      return 'This token cannot access the configured repository.';
    case 'repository_write_denied':
      return 'The token can access the repository but does not have write permission.';
    case 'github_rate_limited':
      return 'GitHub is rate-limiting requests. Try again shortly.';
    case 'github_unavailable':
      return 'GitHub could not be reached. Check your connection and try again.';
    case 'github_session_storage_unavailable':
      return 'The browser could not store this session. Check browser storage settings.';
    default:
      return code ? `${fallback} (${code})` : fallback;
  }
}

export function GitHubSyncDialog({
  id,
  repository,
  copy,
  connected = false,
  onClose,
  onTest,
  onSave,
  saveDisabled = false,
  returnFocusRef,
  classNames = {},
}: {
  id: string;
  repository: GitHubRepositoryTarget;
  copy: GitHubSyncCopy;
  connected?: boolean;
  onClose: () => void;
  onTest: (token: string) => string | void | Promise<string | void>;
  onSave?: (token: string) => void;
  saveDisabled?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  classNames?: Partial<{
    root: string;
    header: string;
    title: string;
    close: string;
    content: string;
    field: string;
    input: string;
    results: string;
    resultsTitle: string;
    resultsMessage: string;
    footer: string;
  }>;
}) {
  const [token, setToken] = useState('');
  const [resultMessage, setResultMessage] = useState(
    connected ? copy.connectedMessage : copy.resultsMessage,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function handleTokenChange(event: ChangeEvent<HTMLInputElement>) {
    setToken(event.currentTarget.value);
    setResultMessage(copy.resultsMessage);
  }

  async function testConnection() {
    const candidate = token.trim();
    if ((!candidate && !connected) || isTesting || isSaving) return;
    setIsTesting(true);
    setResultMessage(copy.resultsMessage);
    try {
      const result = await onTest(candidate);
      setResultMessage(typeof result === 'string' ? result : copy.testSuccessMessage);
    } catch (cause) {
      setResultMessage(connectionErrorMessage(cause, copy.testFailureMessage));
    } finally {
      setIsTesting(false);
    }
  }

  async function saveConnection() {
    const candidate = token.trim();
    if (!candidate || isTesting || isSaving || !onSave) return;
    setIsSaving(true);
    try {
      await onSave(candidate);
      setResultMessage(copy.saveSuccessMessage);
    } catch (cause) {
      setResultMessage(connectionErrorMessage(cause, copy.saveFailureMessage));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnchoredDialog
      id={id}
      className={classNames.root ?? ''}
      ariaLabel={copy.dialogLabel}
      onClose={onClose}
      {...(returnFocusRef ? { returnFocusRef } : {})}
    >
      <header className={classNames.header}>
        <h2 className={classNames.title}>{copy.title}</h2>
        <Button
          type="button"
          className={classNames.close}
          aria-label={copy.closeLabel}
          onClick={onClose}
        >
          <Icon name="navigationClose" size={16} />
        </Button>
      </header>
      <div className={classNames.content}>
        <label className={classNames.field} htmlFor={`${id}-owner`}>
          {copy.ownerLabel}
          <input
            className={classNames.input}
            id={`${id}-owner`}
            type="text"
            value={repository.owner}
            readOnly
          />
        </label>
        <label className={classNames.field} htmlFor={`${id}-repository`}>
          {copy.repositoryLabel}
          <input
            className={classNames.input}
            id={`${id}-repository`}
            type="text"
            value={repository.name}
            readOnly
          />
        </label>
        <label className={classNames.field} htmlFor={`${id}-branch`}>
          {copy.branchLabel}
          <input
            className={classNames.input}
            id={`${id}-branch`}
            type="text"
            value={repository.branch}
            readOnly
          />
        </label>
        <label className={classNames.field} htmlFor={`${id}-token`}>
          {copy.tokenLabel}
          <input
            className={classNames.input}
            id={`${id}-token`}
            type="password"
            autoComplete="new-password"
            placeholder={
              connected && !token ? copy.connectedTokenPlaceholder : copy.tokenPlaceholder
            }
            value={token}
            onChange={handleTokenChange}
          />
        </label>
        <section className={classNames.results} aria-labelledby={`${id}-results-title`}>
          <h3 className={classNames.resultsTitle} id={`${id}-results-title`}>
            {copy.resultsTitle}
          </h3>
          <p className={classNames.resultsMessage} role="status" aria-live="polite">
            {resultMessage}
          </p>
        </section>
      </div>
      <footer className={classNames.footer}>
        <Button
          type="button"
          onClick={() => void testConnection()}
          disabled={isTesting || isSaving || (!connected && !token.trim())}
        >
          {isTesting ? 'Testing…' : copy.testLabel}
        </Button>
        <Button
          type="button"
          disabled={saveDisabled || !onSave || !token.trim() || isTesting || isSaving}
          onClick={() => void saveConnection()}
        >
          {isSaving ? 'Connecting…' : copy.saveLabel}
        </Button>
      </footer>
    </AnchoredDialog>
  );
}
