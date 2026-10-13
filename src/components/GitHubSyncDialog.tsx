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
  resultsTitle: string;
  resultsMessage: string;
  testLabel: string;
  saveLabel: string;
};

export function GitHubSyncDialog({
  id,
  repository,
  copy,
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
  onClose: () => void;
  onTest: (token: string) => void;
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

  function handleTokenChange(event: ChangeEvent<HTMLInputElement>) {
    setToken(event.currentTarget.value);
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
            placeholder={copy.tokenPlaceholder}
            value={token}
            onChange={handleTokenChange}
          />
        </label>
        <section className={classNames.results} aria-labelledby={`${id}-results-title`}>
          <h3 className={classNames.resultsTitle} id={`${id}-results-title`}>
            {copy.resultsTitle}
          </h3>
          <p className={classNames.resultsMessage}>{copy.resultsMessage}</p>
        </section>
      </div>
      <footer className={classNames.footer}>
        <Button type="button" onClick={() => onTest(token)}>
          {copy.testLabel}
        </Button>
        <Button type="button" disabled={saveDisabled || !onSave} onClick={() => onSave?.(token)}>
          {copy.saveLabel}
        </Button>
      </footer>
    </AnchoredDialog>
  );
}
