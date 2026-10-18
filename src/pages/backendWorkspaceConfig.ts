import type { GitHubSyncCopy, IconName, ToolbarAction } from '../components';

export const backendWorkspaceCopy = {
  header: {
    ariaLabel: 'Backend header',
    title: 'Backend',
    backLabel: 'Back to home',
    deploymentsLabel: 'Deployments',
  },
  workspaceLabel: 'Backend workspace',
  panelLabels: {
    selection: 'Workspace panel 1',
    preview: 'Workspace panel 2',
  },
  panelIds: {
    explorer: 'backend-page-explorer',
    sync: 'backend-github-sync-panel',
  },
  selectionModeLabel: 'Selection mode',
  selectionModeText: 'Select Page, Nested Page, Container or Card',
  syncTriggerLabel: 'Github Sync',
  selectTriggerLabel: 'Select',
  livePreviewLabel: 'Live Preview',
  realtimeSyncLabel: 'Real-Time-Sync',
  cardEditorLabel: 'Card Editor',
  modelSummary: {
    title: 'Model Training',
    titleIcon: 'promptContinue' as IconName,
    updatedLabel: 'Last Updated',
    updatedAt: '2026-01-01',
    formattedDate: '01/01/2026',
    category: 'Machine Learning',
  },
  cardPreview: {
    ariaLabel: 'Card preview',
    contentLabel: 'Card content',
    title: 'Tensor Flow',
    category: 'Neural Networks',
    titleIcon: 'promptContinue' as IconName,
    toolbarLabel: 'Card actions',
    notesLabel: 'Card notes or commands',
    notesPlaceholder: 'Type notes or commands on a straight line...',
  },
  explorer: {
    ariaLabel: 'Page, sub page or card explorer',
    closeLabel: 'Close explorer',
  },
} as const;

export const gitHubSyncCopy: GitHubSyncCopy = {
  dialogLabel: 'GitHub Repository Sync Settings',
  title: 'GitHub Repository Sync Settings',
  closeLabel: 'Close GitHub sync',
  ownerLabel: 'GitHub Owner / Organization',
  repositoryLabel: 'Repository Name',
  branchLabel: 'Branch',
  tokenLabel: 'GitHub Personal Access Token (PAT)',
  tokenPlaceholder: 'Enter a personal access token',
  resultsTitle: 'Connection Test Results',
  resultsMessage: 'Connection status and branch details will appear here after a test.',
  testLabel: 'Connection Test',
  saveLabel: 'Save & Connect',
};

export const cardToolbarActions: readonly ToolbarAction[] = [
  { id: 'preview', icon: 'cardPreview', label: 'Preview card' },
  { id: 'files', icon: 'cardFiles', label: 'Card files' },
  { id: 'video', icon: 'cardVideo', label: 'Video preview' },
  { id: 'layout', icon: 'cardLayout', label: 'Card layout' },
  { id: 'terminal', icon: 'cardTerminal', label: 'Terminal' },
  { id: 'workflow', icon: 'cardWorkflow', label: 'Card workflow' },
  { id: 'bookmark', icon: 'cardBookmark', label: 'Bookmark card' },
  { id: 'duplicate', icon: 'cardDuplicate', label: 'Duplicate card' },
  { id: 'share', icon: 'cardShare', label: 'Share card' },
  { id: 'source', icon: 'cardCode', label: 'Card source' },
  { id: 'print', icon: 'cardPrint', label: 'Print card' },
  { id: 'settings', icon: 'cardSettings', label: 'Card settings' },
  { id: 'export', icon: 'publish', label: 'Export card' },
  { id: 'validate', icon: 'verified', label: 'Validate card' },
  { id: 'document', icon: 'attachPdf', label: 'Card document' },
];
