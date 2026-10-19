import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../components/Primitives';
import { Icon, IconButton } from '../components/Icon';
import { AnchoredDialog } from '../components/Workspace';
import type { Attachment } from '../lib/content';

type ExplorerPage = {
  id: string;
  kind: 'page' | 'subpage';
  title: string;
  parentId: string | null;
  order: number;
  summary: string;
  category: string;
};

type ExplorerContainer = {
  id: string;
  kind: 'container';
  title: string;
  parentId: string;
  order: number;
  summary: string;
  category: string;
};

type ExplorerCard = {
  id: string;
  kind: 'card';
  title: string;
  parentId: string;
  order: number;
  summary: string;
  category: string;
  tag?: string;
  keyRule?: string;
  code?: string;
  spec?: string;
  attachments?: Attachment[];
  parentTitle: string;
  parentCategory: string;
};

export type ExplorerRecord = ExplorerPage | ExplorerContainer | ExplorerCard;

type TreeChange = {
  id: string;
  title: string;
  status: 'Added' | 'Updated' | 'Removed';
};

export const INITIAL_EXPLORER_RECORD: ExplorerRecord = {
  id: 'card-tensor-flow',
  kind: 'card',
  title: 'Tensor Flow',
  parentId: 'container-model-training',
  order: 1,
  summary: 'A practical overview of tensors, model training, and neural-network workflows.',
  category: 'Neural Networks',
  tag: 'Foundations',
  parentTitle: 'Model Training',
  parentCategory: 'Machine Learning',
};

export const INITIAL_EXPLORER_RECORDS: ExplorerRecord[] = [
  {
    id: 'page-machine-learning',
    kind: 'page',
    title: 'Machine Learning',
    parentId: null,
    order: 0,
    summary: 'Concepts and practical notes for the machine-learning team.',
    category: 'Engineering',
  },
  {
    id: 'subpage-model-training',
    kind: 'subpage',
    title: 'Model Training',
    parentId: 'page-machine-learning',
    order: 0,
    summary: 'Training workflows, frameworks, and reproducible experiments.',
    category: 'Machine Learning',
  },
  {
    id: 'container-model-training',
    kind: 'container',
    title: 'Training Cards',
    parentId: 'subpage-model-training',
    order: 0,
    summary: 'Cards about model training workflows.',
    category: 'Machine Learning',
  },
  {
    ...INITIAL_EXPLORER_RECORD,
    parentId: 'container-model-training',
  },
  {
    id: 'card-model-training-basics',
    kind: 'card',
    title: 'Training Fundamentals',
    parentId: 'container-model-training',
    order: 0,
    summary: 'Core practices for repeatable model training and evaluation.',
    category: 'Machine Learning',
    tag: 'Training',
    parentTitle: 'Training Cards',
    parentCategory: 'Machine Learning',
  },
  {
    id: 'container-machine-learning',
    kind: 'container',
    title: 'Data Engineering',
    parentId: 'page-machine-learning',
    order: 1,
    summary: 'Cards about data and machine-learning infrastructure.',
    category: 'Engineering',
  },
  {
    id: 'card-data-pipelines',
    kind: 'card',
    title: 'Data Pipelines',
    parentId: 'container-machine-learning',
    order: 0,
    summary: 'How data moves from source datasets into validated training sets.',
    category: 'Data',
    parentTitle: 'Data Engineering',
    parentCategory: 'Engineering',
  },
  {
    id: 'subpage-neural-networks',
    kind: 'subpage',
    title: 'Neural Networks',
    parentId: 'page-machine-learning',
    order: 2,
    summary: 'Architecture notes and reference material for neural networks.',
    category: 'Machine Learning',
  },
  {
    id: 'page-platform',
    kind: 'page',
    title: 'Platform Guide',
    parentId: null,
    order: 1,
    summary: 'Shared tools, deployment procedures, and platform conventions.',
    category: 'Platform',
  },
  {
    id: 'container-platform',
    kind: 'container',
    title: 'Platform Cards',
    parentId: 'page-platform',
    order: 0,
    summary: 'Cards about shared platform tools and processes.',
    category: 'Platform',
  },
  {
    id: 'card-github-actions',
    kind: 'card',
    title: 'GitHub Actions',
    parentId: 'container-platform',
    order: 0,
    summary: 'Build and deployment automation maintained with the repository.',
    category: 'CI/CD',
    parentTitle: 'Platform Cards',
    parentCategory: 'Platform',
  },
  {
    id: 'container-platform-empty',
    kind: 'container',
    title: 'Empty Container',
    parentId: 'page-platform',
    order: 1,
    summary: 'An empty container for new cards.',
    category: 'Platform',
  },
];

function orderedChildren(records: readonly ExplorerRecord[], parentId: string | null) {
  return records
    .filter((record) => record.parentId === parentId)
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
}

function recordTypeLabel(record: ExplorerRecord): string {
  if (record.kind === 'subpage') return 'Subpage';
  if (record.kind === 'container') return 'Card Container';
  return record.kind === 'page' ? 'Page' : 'Card';
}

function siblingIds(records: readonly ExplorerRecord[], parentId: string | null): string[] {
  return orderedChildren(records, parentId).map((record) => record.id);
}

export function BackendTree({
  records,
  initialRecords,
  onRecordsChange,
  selectedRecord,
  onSelectionChange,
  onClose,
  closeLabel,
}: {
  records: ExplorerRecord[];
  initialRecords: ExplorerRecord[];
  onRecordsChange: (records: ExplorerRecord[]) => void;
  selectedRecord: ExplorerRecord | null;
  onSelectionChange: (record: ExplorerRecord | null) => void;
  onClose: () => void;
  closeLabel: string;
}) {
  const [selectedId, setSelectedId] = useState(selectedRecord?.id ?? '');
  const [expandedIds, setExpandedIds] = useState(() => new Set<string>());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showChangeReview, setShowChangeReview] = useState(false);
  const [nextId, setNextId] = useState(1);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const reviewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const initialSelectionId = useRef(selectedRecord?.id ?? '');

  useEffect(() => {
    setSelectedId(selectedRecord?.id ?? '');
  }, [selectedRecord?.id]);

  const selected = records.find((record) => record.id === selectedId) ?? records[0] ?? null;
  const pendingDelete = records.find((record) => record.id === pendingDeleteId) ?? null;
  const changes: TreeChange[] = [
    ...records.flatMap((record): TreeChange[] => {
      const initialRecord = initialRecords.find((item) => item.id === record.id);
      if (!initialRecord) return [{ id: record.id, title: record.title, status: 'Added' }];
      if (JSON.stringify(initialRecord) !== JSON.stringify(record)) {
        return [{ id: record.id, title: record.title, status: 'Updated' }];
      }
      return [];
    }),
    ...initialRecords
      .filter((record) => !records.some((item) => item.id === record.id))
      .map((record) => ({ id: record.id, title: record.title, status: 'Removed' as const })),
  ];

  function discardChanges() {
    const nextSelection =
      initialRecords.find((record) => record.id === initialSelectionId.current) ??
      initialRecords[0] ??
      null;
    onRecordsChange(initialRecords);
    setSelectedId(nextSelection?.id ?? '');
    if (nextSelection) onSelectionChange(nextSelection);
    else onSelectionChange(null);
    setExpandedIds(new Set());
    setEditingId(null);
    setPendingDeleteId(null);
    setConfirmDiscard(false);
    setShowChangeReview(false);
  }

  function selectRecord(record: ExplorerRecord) {
    setSelectedId(record.id);
    onSelectionChange(record);
    setPendingDeleteId(null);
  }

  function addRecord(kind: 'page' | 'subpage' | 'container' | 'card') {
    const canOwnPageChildren = selected?.kind === 'page' || selected?.kind === 'subpage';
    if (kind === 'subpage' && !canOwnPageChildren) return;
    if (kind === 'container' && !canOwnPageChildren) return;
    if (kind === 'card' && selected?.kind !== 'container') return;

    const parentId =
      kind === 'page'
        ? null
        : kind === 'subpage' || kind === 'container'
          ? (selected?.id ?? null)
          : (selected?.id ?? null);
    if (kind !== 'page' && parentId === null) return;
    const parentRecord = kind === 'page' ? null : selected;
    const pageRecord =
      kind === 'container'
        ? parentRecord
        : kind === 'card'
          ? records.find((record) => record.id === parentRecord?.parentId)
          : null;
    const order =
      Math.max(-1, ...orderedChildren(records, parentId).map((record) => record.order)) + 1;
    const newRecordId = `mock-${kind}-${nextId}`;
    const newRecord: ExplorerRecord =
      kind === 'card'
        ? {
            id: newRecordId,
            kind,
            title: 'New card',
            parentId: parentId!,
            order,
            summary: 'Add a short description for this card.',
            category: 'Uncategorized',
            parentTitle: parentRecord?.title ?? 'Cards',
            parentCategory: pageRecord?.category ?? 'Documentation',
          }
        : kind === 'container'
          ? {
              id: newRecordId,
              kind,
              title: 'New card container',
              parentId: parentId!,
              order,
              summary: 'Cards in this container can be previewed as a carousel.',
              category: parentRecord?.category ?? 'Documentation',
            }
          : {
              id: newRecordId,
              kind,
              title: kind === 'page' ? 'New page' : 'New nested page',
              parentId,
              order,
              summary: kind === 'page' ? 'A new documentation page.' : 'A new nested page.',
              category: kind === 'page' ? 'Documentation' : (parentRecord?.category ?? 'Page'),
            };
    const defaultContainer: ExplorerContainer | null =
      kind === 'page' || kind === 'subpage'
        ? {
            id: `mock-container-${nextId}`,
            kind: 'container',
            title: 'Cards',
            parentId: newRecord.id,
            order: 0,
            summary: 'Cards belonging to this page.',
            category: newRecord.category,
          }
        : null;

    setNextId((value) => value + 1);
    onRecordsChange([...records, newRecord, ...(defaultContainer ? [defaultContainer] : [])]);
    setSelectedId(newRecord.id);
    onSelectionChange(newRecord);
    setEditingId(newRecord.id);
    setEditingTitle(newRecord.title);
    setPendingDeleteId(null);
    if (parentId !== null || defaultContainer) {
      setExpandedIds((current) => {
        const next = new Set(current);
        let ancestorId: string | null = parentId;
        while (ancestorId !== null) {
          next.add(ancestorId);
          ancestorId = records.find((record) => record.id === ancestorId)?.parentId ?? null;
        }
        if (defaultContainer) next.add(newRecord.id);
        return next;
      });
    }
  }

  function saveRename(event: FormEvent<HTMLFormElement>, record: ExplorerRecord) {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!title) return;
    const updatedRecords = records.map((item) => {
      if (item.id === record.id) return { ...item, title };
      if (item.kind === 'card' && item.parentId === record.id) {
        return {
          ...item,
          parentTitle: title,
        };
      }
      return item;
    });
    onRecordsChange(updatedRecords);
    const nextSelection = updatedRecords.find((item) => item.id === selectedId);
    if (nextSelection) onSelectionChange(nextSelection);
    setEditingId(null);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveRecord(record: ExplorerRecord, direction: -1 | 1) {
    const siblings = siblingIds(records, record.parentId);
    const index = siblings.indexOf(record.id);
    const otherId = siblings[index + direction];
    if (!otherId) return;
    const reordered = [...siblings];
    [reordered[index], reordered[index + direction]] = [
      reordered[index + direction]!,
      reordered[index]!,
    ];
    const positions = new Map(reordered.map((id, order) => [id, order]));
    onRecordsChange(
      records.map((item) =>
        positions.has(item.id) ? { ...item, order: positions.get(item.id)! } : item,
      ),
    );
  }

  function confirmDelete(record: ExplorerRecord) {
    const removedIds = new Set<string>([record.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of records) {
        if (item.parentId !== null && removedIds.has(item.parentId) && !removedIds.has(item.id)) {
          removedIds.add(item.id);
          changed = true;
        }
      }
    }
    const remaining = records.filter((item) => !removedIds.has(item.id));
    onRecordsChange(remaining);
    setPendingDeleteId(null);
    if (removedIds.has(selectedId)) {
      const fallback =
        remaining.find((item) => item.id === record.parentId) ??
        orderedChildren(remaining, null)[0];
      if (fallback) {
        setSelectedId(fallback.id);
        onSelectionChange(fallback);
      } else {
        setSelectedId('');
        onSelectionChange(null);
      }
    }
  }

  function renderRecord(record: ExplorerRecord) {
    const children = orderedChildren(records, record.id);
    const isExpanded = expandedIds.has(record.id);
    const canContainChildren = record.kind !== 'card';
    const siblingList = siblingIds(records, record.parentId);
    const index = siblingList.indexOf(record.id);
    const isSelected = selectedId === record.id;
    const isEditing = editingId === record.id;
    return (
      <li className="backend-tree-node" key={record.id}>
        <div
          className={[
            'backend-tree-row',
            isSelected && 'is-selected',
            !canContainChildren && 'is-leaf',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {canContainChildren ? (
            <IconButton
              className={`backend-tree-disclosure ${isExpanded ? 'is-expanded' : ''}`}
              name="promptContinue"
              label={
                children.length === 0
                  ? `No children for ${record.title}`
                  : `${isExpanded ? 'Collapse' : 'Expand'} ${record.title}`
              }
              aria-expanded={isExpanded}
              disabled={children.length === 0}
              onClick={() => toggleExpanded(record.id)}
            />
          ) : (
            <span className="backend-tree-disclosure-spacer" aria-hidden="true" />
          )}
          {isEditing ? (
            <form className="backend-tree-rename" onSubmit={(event) => saveRename(event, record)}>
              <input
                aria-label={`Rename ${record.title}`}
                autoFocus
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setEditingId(null);
                }}
              />
              <Button
                type="button"
                aria-label={`Cancel rename ${record.title}`}
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!editingTitle.trim()}>
                Save
              </Button>
            </form>
          ) : (
            <button
              type="button"
              className="backend-tree-select"
              aria-label={`${record.title} ${recordTypeLabel(record)}`}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => selectRecord(record)}
            >
              <span className="backend-tree-title">{record.title}</span>
              <span className="backend-tree-kind">{recordTypeLabel(record)}</span>
            </button>
          )}
          <div className="backend-tree-actions" aria-label={`${record.title} actions`}>
            <IconButton
              name="moveUp"
              label={`Move ${record.title} up`}
              disabled={index === 0}
              onClick={() => moveRecord(record, -1)}
            />
            <IconButton
              name="moveDown"
              label={`Move ${record.title} down`}
              disabled={index === siblingList.length - 1}
              onClick={() => moveRecord(record, 1)}
            />
            <IconButton
              name="editRecord"
              label={`Rename ${record.title}`}
              onClick={() => {
                setEditingId(record.id);
                setEditingTitle(record.title);
              }}
            />
            <IconButton
              name="deleteRecord"
              label={`Delete ${record.title}`}
              onClick={() => setPendingDeleteId(record.id)}
            />
          </div>
        </div>
        {children.length > 0 && isExpanded && (
          <ul className="backend-tree-children">{children.map(renderRecord)}</ul>
        )}
      </li>
    );
  }

  return (
    <section className="backend-explorer-tree-panel" aria-label="Realtime Tree">
      <div className="backend-explorer-toolbar">
        <div className="backend-explorer-title-panel">
          <span className="backend-live-preview-dot" aria-hidden="true" />
          <h2>Realtime Tree</h2>
        </div>
        <div className="backend-explorer-create-actions">
          <IconButton name="createPage" label="New page" onClick={() => addRecord('page')} />
          <IconButton
            name="createChildPage"
            label="New nested page"
            onClick={() => addRecord('subpage')}
            disabled={selected?.kind !== 'page' && selected?.kind !== 'subpage'}
          />
          <IconButton
            name="createChildPage"
            label="New card container"
            onClick={() => addRecord('container')}
            disabled={selected?.kind !== 'page' && selected?.kind !== 'subpage'}
          />
          <IconButton
            name="attachPdf"
            label="New card"
            onClick={() => addRecord('card')}
            disabled={selected?.kind !== 'container'}
          />
          <IconButton
            className="backend-page-explorer-close"
            name="navigationClose"
            label={closeLabel}
            onClick={onClose}
          />
        </div>
      </div>
      <div className={`backend-explorer-tree-content${pendingDelete ? 'has-delete-confirm' : ''}`}>
        {pendingDelete && (
          <div className="backend-tree-delete-confirm" role="alert">
            <span>
              Delete <strong>{pendingDelete.title}</strong>
              {pendingDelete.kind !== 'card' ? ' and all nested items' : ''}?
            </span>
            <Button type="button" variant="danger" onClick={() => confirmDelete(pendingDelete)}>
              Delete
            </Button>
            <Button type="button" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
          </div>
        )}
        <nav className="backend-explorer-tree-scroll" aria-label="Pages, subpages, and cards">
          <ul className="backend-tree-root">{orderedChildren(records, null).map(renderRecord)}</ul>
        </nav>
      </div>
      <footer className="backend-explorer-footer" aria-label="Realtime Tree footer">
        <div className={`backend-explorer-footer-panel${confirmDiscard ? 'is-confirming' : ''}`}>
          <div className="backend-explorer-footer-status" aria-live="polite">
            <span className="backend-explorer-footer-local">
              <Icon name="cardWorkflow" size={14} />
              Repository snapshot
            </span>
            <span>
              {changes.length} {changes.length === 1 ? 'change' : 'changes'}
            </span>
            <span className="backend-explorer-footer-git-status">Read-only; edits stay local</span>
          </div>
          {confirmDiscard ? (
            <div
              className="backend-explorer-footer-confirm"
              role="group"
              aria-label="Confirm discard changes"
            >
              <span>Discard all local changes?</span>
              <Button type="button" variant="danger" onClick={discardChanges}>
                Discard
              </Button>
              <Button type="button" onClick={() => setConfirmDiscard(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="backend-explorer-footer-actions">
              <Button
                ref={reviewButtonRef}
                type="button"
                disabled={changes.length === 0}
                onClick={() => setShowChangeReview(true)}
              >
                Review changes
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={changes.length === 0}
                onClick={() => setConfirmDiscard(true)}
              >
                Discard
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled
                title="Repository writes are not available in this workspace yet."
                aria-label="Push and commit unavailable; Git is not connected to local preview data"
              >
                <Icon name="publish" size={14} />
                Push &amp; Commit
              </Button>
            </div>
          )}
        </div>
      </footer>
      {showChangeReview && (
        <AnchoredDialog
          className="backend-tree-changes-dialog"
          ariaLabel="Local tree changes"
          onClose={() => setShowChangeReview(false)}
          initialFocusRef={reviewCloseButtonRef}
          returnFocusRef={reviewButtonRef}
        >
          <header className="backend-tree-changes-header">
            <div>
              <h2>Local changes</h2>
              <p>
                These edits are not connected to GitHub and will be lost when this preview closes.
              </p>
            </div>
            <Button
              ref={reviewCloseButtonRef}
              type="button"
              aria-label="Close change review"
              onClick={() => setShowChangeReview(false)}
            >
              <Icon name="navigationClose" size={16} />
            </Button>
          </header>
          {changes.length > 0 ? (
            <ul className="backend-tree-changes-list">
              {changes.map((change) => (
                <li key={`${change.status}-${change.id}`}>
                  <span className={`backend-tree-change-status is-${change.status.toLowerCase()}`}>
                    {change.status}
                  </span>
                  <span>{change.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="backend-tree-no-changes">No local changes remain.</p>
          )}
        </AnchoredDialog>
      )}
    </section>
  );
}
