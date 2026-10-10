import React, { useState } from 'react';
import { PageNode, ComponentCard } from '../../types';
import {
  getContentRegistry,
  createDynamicPage,
  renamePage,
  deletePage,
  reorderPage,
  deleteCard,
  reorderCard,
} from '../../lib/contentEngine';
import {
  TreeFolderIcon,
  TreeChevronIcon,
  TreeCardIcon,
  TreeAddCardIcon,
  TreeAddSubIcon,
  TreeArrowUpIcon,
  TreeArrowDownIcon,
  TreeEditIcon,
  TreeTrashIcon,
  TreePlusIcon,
  TreeCloseIcon,
  TreeNodeBulletIcon,
} from './icons/TreeIcons';

interface HierarchyTreeProps {
  /** Currently selected card ID if any */
  selectedCardId?: string;
  /** Currently active page folder path */
  selectedPagePath?: string;
  /** Callback when user selects a card to edit */
  onSelectCard: (card: ComponentCard, pagePath: string) => void;
  /** Callback when user clicks "+ Card" on a folder */
  onCreateCardForFolder: (pagePath: string, pageTitle: string) => void;
  /** Callback when user clicks "+ New Page" */
  onCreateNewPage?: (parentPagePath?: string) => void;
  className?: string;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  selectedCardId,
  selectedPagePath,
  onSelectCard,
  onCreateCardForFolder,
  onCreateNewPage,
  className = '',
}) => {
  const [tree, setTree] = useState<PageNode[]>(() => getContentRegistry());
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  
  // Inline rename state
  const [editingPagePath, setEditingPagePath] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Inline sub-page creator state
  const [addingSubPageToPath, setAddingSubPageToPath] = useState<string | null>(null);
  const [subPageTitle, setSubPageTitle] = useState('');

  // Inline card creator modal / inline state for folder
  const [addingCardToPath, setAddingCardToPath] = useState<string | null>(null);
  const [addingCardTitle, setAddingCardTitle] = useState('');

  // Custom in-app confirmation modal state (replaces window.confirm which is blocked in iframes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Reload tree on registry updates
  const refreshTree = () => {
    setTree(getContentRegistry());
  };

  React.useEffect(() => {
    window.addEventListener('greendocs:cards-updated', refreshTree);
    return () => window.removeEventListener('greendocs:cards-updated', refreshTree);
  }, []);

  const getNodePath = (n: PageNode): string => n.urlPath || `/home/${n.slug}`;

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartRename = (node: PageNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPagePath(getNodePath(node));
    setEditingTitle(node.title);
  };

  const handleSaveRename = (urlPath: string) => {
    if (editingTitle.trim()) {
      renamePage(urlPath, editingTitle.trim());
    }
    setEditingPagePath(null);
  };

  const handleDeletePage = (node: PageNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const cardCount = node.cards?.length || 0;
    const confirmMsg = cardCount > 0
      ? `Delete page "${node.title}" and its ${cardCount} card(s)? This action cannot be undone.`
      : `Delete page "${node.title}"?`;

    setConfirmModal({
      isOpen: true,
      title: `Delete Page: ${node.title}`,
      message: confirmMsg,
      onConfirm: () => {
        deletePage(getNodePath(node));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleMovePage = (urlPath: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    reorderPage(urlPath, direction);
  };

  const handleMoveCard = (cardId: string, pagePath: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    reorderCard(cardId, pagePath, direction);
  };

  const handleDeleteCard = (cardId: string, cardTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: `Delete Card: ${cardTitle}`,
      message: `Are you sure you want to delete card "${cardTitle}"?`,
      onConfirm: () => {
        deleteCard(cardId);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleStartAddSubPage = (node: PageNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingSubPageToPath(getNodePath(node));
    setSubPageTitle('');
    setCollapsedNodes((prev) => ({ ...prev, [node.id]: false }));
  };

  const handleSaveSubPage = (parentUrlPath: string) => {
    if (subPageTitle.trim()) {
      createDynamicPage(subPageTitle.trim(), 'Documentation', parentUrlPath);
    }
    setAddingSubPageToPath(null);
    setSubPageTitle('');
  };

  const handleStartAddCard = (nodePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingCardToPath(nodePath);
    setAddingCardTitle('');
  };

  const handleSaveCardForFolder = (nodePath: string, folderTitle: string) => {
    if (addingCardTitle.trim()) {
      // Trigger creation without closing explorer
      onCreateCardForFolder(nodePath, folderTitle);
      // Pre-fill title in parent if needed or let user edit
    }
    setAddingCardToPath(null);
    setAddingCardTitle('');
  };

  // Check if a node or its children match search query
  const matchesSearch = (node: PageNode, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (node.title.toLowerCase().includes(q)) return true;
    if (node.cards?.some((c) => c.title.toLowerCase().includes(q) || c.tag?.toLowerCase().includes(q))) return true;
    return node.children?.some((ch) => matchesSearch(ch, query)) || false;
  };

  // Render a single node in the hierarchy
  const renderNode = (node: PageNode, level = 0) => {
    if (searchQuery && !matchesSearch(node, searchQuery)) {
      return null;
    }

    const nodePath = getNodePath(node);
    const isCollapsed = Boolean(collapsedNodes[node.id]);
    const isSelectedPage = selectedPagePath?.toLowerCase() === nodePath.toLowerCase();
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const cards = node.cards || [];
    const hasCards = cards.length > 0;
    const hasSubItems = hasChildren || hasCards;

    return (
      <div key={node.id} className="flex flex-col select-none text-xs relative">
        {/* Node Header Row */}
        <div
          onClick={() => {
            if (cards.length > 0) {
              onSelectCard(cards[0], nodePath);
            } else {
              onSelectCard({ 
                id: `card-default-${node.id}`, 
                title: node.title, 
                tag: 'Navigation', 
                definition: `Overview of ${node.title}.`, 
                keyRule: 'Follow documentation standards.', 
                order: 1,
                deepDive: { typescriptInterface: 'interface ModuleConfig {\n  id: string;\n}' }
              }, nodePath);
            }
          }}
          className={`group flex items-center justify-between py-1.5 px-2 rounded-md transition-all cursor-pointer border ${
            isSelectedPage
              ? 'bg-white/[0.06] border-emerald-500/40 text-white font-medium shadow-sm'
              : 'hover:bg-[#0c121a]/60 border-transparent text-slate-300 hover:text-white'
          }`}
          style={{ paddingLeft: `${Math.max(8, level * 16 + 8)}px` }}
        >
          {/* Left: Expand Caret + Folder Glyph + Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            {hasSubItems ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
              >
                <TreeChevronIcon size={11} isExpanded={!isCollapsed} />
              </button>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center text-slate-600">
                <TreeNodeBulletIcon size={5} className="text-slate-600" />
              </span>
            )}

            {/* Folder Icon */}
            <span className="shrink-0 flex items-center justify-center">
              <TreeFolderIcon
                size={14}
                isOpen={!isCollapsed}
                className={isSelectedPage ? 'text-emerald-400' : 'text-slate-300 group-hover:text-white'}
              />
            </span>

            {/* Title / Inline Rename Form */}
            {editingPagePath === nodePath ? (
              <div
                className="flex items-center gap-1.5 flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(nodePath);
                    if (e.key === 'Escape') setEditingPagePath(null);
                  }}
                  autoFocus
                  className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded px-2 py-0.5 text-xs text-white font-mono outline-none w-full max-w-[160px] focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRename(nodePath)}
                  className="text-white hover:text-emerald-300 px-2 py-0.5 text-[10px] font-mono bg-[#070a0e]/90 hover:bg-[#0c121a]/95 backdrop-blur-md border border-white/[0.08] hover:border-emerald-500/40 rounded transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPagePath(null)}
                  className="text-slate-400 hover:text-white px-1.5 py-0.5 text-[10px] font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs truncate text-white">
                  {node.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06] shrink-0">
                  {cards.length}
                </span>
              </div>
            )}
          </div>

          {/* Right: Quick Action Buttons on Hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
            {/* 1. Create Card for this folder (Inline without closing explorer) */}
            <button
              type="button"
              onClick={(e) => handleStartAddCard(nodePath, e)}
              title={`Add new card to ${node.title}`}
              className="px-2 h-6 text-[10px] font-mono rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <TreeAddCardIcon size={12} className="text-emerald-400" />
              <span>Card</span>
            </button>

            {/* 2. Create Sub-page under this folder */}
            <button
              type="button"
              onClick={(e) => handleStartAddSubPage(node, e)}
              title={`Add sub-page inside ${node.title}`}
              className="px-2 h-6 text-[10px] font-mono rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <TreeAddSubIcon size={12} className="text-sky-400" />
              <span>Sub</span>
            </button>

            {/* 3. Move Up */}
            <button
              type="button"
              onClick={(e) => handleMovePage(nodePath, 'up', e)}
              title="Move folder up"
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <TreeArrowUpIcon size={11} />
            </button>

            {/* 4. Move Down */}
            <button
              type="button"
              onClick={(e) => handleMovePage(nodePath, 'down', e)}
              title="Move folder down"
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <TreeArrowDownIcon size={11} />
            </button>

            {/* 5. Rename */}
            <button
              type="button"
              onClick={(e) => handleStartRename(node, e)}
              title="Rename folder"
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <TreeEditIcon size={11} />
            </button>

            {/* 6. Delete */}
            <button
              type="button"
              onClick={(e) => handleDeletePage(node, e)}
              title="Delete folder and cards"
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-rose-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-400 hover:text-rose-300 transition-all cursor-pointer shadow-sm"
            >
              <TreeTrashIcon size={11} />
            </button>
          </div>
        </div>

        {/* Inline Card Creator (Stays inside explorer without closing) */}
        {addingCardToPath === nodePath && (
          <div
            className="flex items-center gap-2 py-1.5 px-2.5 my-1 rounded-md bg-[#070a0e]/95 border border-emerald-500/40 backdrop-blur-md shadow-lg"
            style={{ marginLeft: `${(level + 1) * 16 + 8}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <TreeAddCardIcon size={14} className="text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="New card title..."
              value={addingCardTitle}
              onChange={(e) => setAddingCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addingCardTitle.trim()) {
                  onCreateCardForFolder(nodePath, node.title);
                  setAddingCardToPath(null);
                  setAddingCardTitle('');
                }
                if (e.key === 'Escape') setAddingCardToPath(null);
              }}
              autoFocus
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => {
                if (addingCardTitle.trim()) {
                  onCreateCardForFolder(nodePath, node.title);
                  setAddingCardToPath(null);
                  setAddingCardTitle('');
                }
              }}
              className="px-2 h-6 text-[10px] font-mono rounded border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-all cursor-pointer"
            >
              Create Card
            </button>
            <button
              type="button"
              onClick={() => setAddingCardToPath(null)}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <TreeCloseIcon size={11} />
            </button>
          </div>
        )}

        {/* Inline Sub-page Creator */}
        {addingSubPageToPath === nodePath && (
          <div
            className="flex items-center gap-2 py-1.5 px-2.5 my-1 rounded-md bg-[#070a0e]/95 border border-sky-500/40 backdrop-blur-md shadow-lg"
            style={{ marginLeft: `${(level + 1) * 16 + 8}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <TreeFolderIcon size={14} className="text-sky-400 shrink-0" />
            <input
              type="text"
              placeholder="Subpage title..."
              value={subPageTitle}
              onChange={(e) => setSubPageTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSubPage(nodePath);
                if (e.key === 'Escape') setAddingSubPageToPath(null);
              }}
              autoFocus
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => handleSaveSubPage(nodePath)}
              className="px-2 h-6 text-[10px] font-mono rounded border border-sky-500/40 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition-all cursor-pointer"
            >
              Create Subpage
            </button>
            <button
              type="button"
              onClick={() => setAddingSubPageToPath(null)}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <TreeCloseIcon size={11} />
            </button>
          </div>
        )}

        {/* Child Cards and Nested Sub-Pages */}
        {!isCollapsed && (
          <div className="flex flex-col border-l border-white/[0.06] ml-3 sm:ml-4">
            {/* 1. Cards in this page */}
            {cards.map((card, cardIdx) => {
              const isSelectedCard = selectedCardId === card.id;
              const hasAudio = Boolean(card.media?.audioUrl);
              const hasPdf = Boolean(card.media?.pdfUrl);
              const hasVideo = Boolean(card.media?.videoUrl);

              if (
                searchQuery &&
                !card.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !card.tag?.toLowerCase().includes(searchQuery.toLowerCase())
              ) {
                return null;
              }

              return (
                <div
                  key={card.id}
                  onClick={() => onSelectCard(card, nodePath)}
                  className={`group flex items-center justify-between py-1 px-2 rounded-md transition-all cursor-pointer border ml-2 my-0.5 ${
                    isSelectedCard
                      ? 'bg-white/[0.06] border-emerald-500/40 text-white font-medium shadow-sm'
                      : 'hover:bg-[#0c121a]/60 border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  {/* Card Title & Order */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {String(cardIdx + 1).padStart(2, '0')}.
                    </span>
                    <TreeCardIcon size={12} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] truncate font-mono text-white">
                      {card.title}
                    </span>

                    {/* Tag Badge */}
                    {card.tag && (
                      <span className="text-[9px] font-mono text-slate-400 bg-white/[0.04] px-1 rounded border border-white/[0.06] shrink-0 hidden sm:inline">
                        {card.tag}
                      </span>
                    )}

                    {/* Media Badges */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {hasAudio && (
                        <span className="text-[9px] font-mono text-white bg-white/[0.06] px-1 rounded border border-white/[0.08]" title="Audio attached">
                          AUD
                        </span>
                      )}
                      {hasPdf && (
                        <span className="text-[9px] font-mono text-white bg-white/[0.06] px-1 rounded border border-white/[0.08]" title="PDF attached">
                          PDF
                        </span>
                      )}
                      {hasVideo && (
                        <span className="text-[9px] font-mono text-white bg-white/[0.06] px-1 rounded border border-white/[0.08]" title="Video attached">
                          VID
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Quick Actions on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleMoveCard(card.id, nodePath, 'up', e)}
                      title="Move card up"
                      className="w-5 h-5 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      <TreeArrowUpIcon size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMoveCard(card.id, nodePath, 'down', e)}
                      title="Move card down"
                      className="w-5 h-5 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      <TreeArrowDownIcon size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCard(card.id, card.title, e)}
                      title="Delete card"
                      className="w-5 h-5 flex items-center justify-center rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-rose-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-400 hover:text-rose-300 transition-all cursor-pointer shadow-sm"
                    >
                      <TreeTrashIcon size={10} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State for page with no cards */}
            {cards.length === 0 && !hasChildren && (
              <div
                onClick={(e) => handleStartAddCard(nodePath, e)}
                className="py-1.5 px-3 text-[11px] text-slate-400 italic hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <TreePlusIcon size={10} className="text-emerald-400" />
                <span>Click to create first card in this folder</span>
              </div>
            )}

            {/* 2. Sub-Pages */}
            {node.children && node.children.map((child) =>
              renderNode(child, level + 1)
            )}
          </div>
        )}

        {/* In-app Confirmation Modal Dialog */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#070a0e]/95 backdrop-blur-md p-5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="font-mono text-sm font-semibold text-white">
                  {confirmModal.title}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-6 h-6 rounded border border-white/[0.08] bg-[#070a0e]/90 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <TreeCloseIcon size={10} />
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:bg-[#0c121a]/95 text-xs font-mono text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-1.5 rounded-md border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs font-mono transition-colors cursor-pointer shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-[#070a0e]/90 backdrop-blur-md rounded-lg border border-white/[0.08] overflow-hidden ${className}`}>
      {/* Top Header & Search Bar */}
      <div className="p-3 border-b border-white/[0.08] flex flex-col gap-2 shrink-0 bg-[#070a0e]/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-white tracking-wider">
              PAGE & CARD TREE
            </span>
            <span className="text-[10px] font-mono text-slate-300 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
              Live
            </span>
          </div>

          {/* "+ New Root Page" Button */}
          {onCreateNewPage && (
            <button
              type="button"
              onClick={() => onCreateNewPage()}
              className="h-7 px-2.5 text-[11px] font-mono rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Create a new root-level documentation page"
            >
              <TreePlusIcon size={11} className="text-white" />
              <span>New Page</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search pages, cards, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 flex items-center justify-center cursor-pointer transition-colors"
            >
              <TreeCloseIcon size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {tree.map((rootNode) => renderNode(rootNode, 0))}

        {tree.length === 0 && (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            No pages found in documentation hierarchy.
          </div>
        )}
      </div>

      {/* Tree Footer stats */}
      <div className="p-2 border-t border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md text-[10px] font-mono text-slate-400 flex items-center justify-between shrink-0">
        <span>Click folder to bind · Click card to edit</span>
        <button
          type="button"
          onClick={() => {
            const allCollapsed = Object.keys(collapsedNodes).length > 0;
            if (allCollapsed) {
              setCollapsedNodes({});
            } else {
              const newMap: Record<string, boolean> = {};
              const walk = (nodes: PageNode[]) => {
                for (const n of nodes) {
                  newMap[n.id] = true;
                  if (n.children) walk(n.children);
                }
              };
              walk(tree);
              setCollapsedNodes(newMap);
            }
          }}
          className="px-2 py-0.5 rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
        >
          {Object.keys(collapsedNodes).length > 0 ? 'Expand All' : 'Collapse All'}
        </button>
      </div>
    </div>
  );
};
