import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComponentCard } from '../types';
import {
  getAllFlatPages,
  saveCustomCard,
  deleteCard,
  createDynamicPage,
} from '../lib/contentEngine';
import { ContentCard } from '../components/ContentCard';
import { HierarchyTree } from '../components/studio/HierarchyTree';
import { SelectIcon } from '../components/studio/SelectIcon';
import { DeploymentsIcon } from '../components/studio/DeploymentsIcon';
import { DiagnosticsIcon } from '../components/studio/DiagnosticsIcon';
import { AudioAttachmentIcon } from '../components/studio/AudioAttachmentIcon';
import { PdfAttachmentIcon } from '../components/studio/PdfAttachmentIcon';
import { VideoAttachmentIcon } from '../components/studio/VideoAttachmentIcon';
import { TreeFolderIcon, TreeCloseIcon } from '../components/studio/icons/TreeIcons';
import { GitHubSettingsModal } from '../components/studio/GitHubSettingsModal';
import {
  commitMarkdownToGitHub,
  serializeCardToMarkdown,
  serializePageToMarkdown,
  resolveRepositoryFilePath,
  getGitHubConfig,
  queueDeployment,
} from '../lib/githubSync';

export const SecretStudioPage: React.FC = () => {
  const navigate = useNavigate();

  // Registry data
  const [pagesList, setPagesList] = useState(() => getAllFlatPages());
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Destination / Page assignment
  const [selectedPagePath, setSelectedPagePath] = useState<string>(
    pagesList.length > 0 ? pagesList[0].urlPath : '/home/opencv/imageprocessing'
  );
  const [selectedPageTitle, setSelectedPageTitle] = useState<string>(
    pagesList.length > 0 ? pagesList[0].title : 'Image Processing'
  );

  // Card Content Fields
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Architecture');
  const [order, setOrder] = useState<number>(1);
  const [definition, setDefinition] = useState('');
  const [keyRule, setKeyRule] = useState('');
  const [tsInterface, setTsInterface] = useState('interface ComponentConfig {\n  id: string;\n  status: "active";\n}');

  // Media Attachments
  const [audioUrl, setAudioUrl] = useState('');
  const [audioDuration, setAudioDuration] = useState('');
  const [audioTitle, setAudioTitle] = useState('');
  const [audioFileName, setAudioFileName] = useState('');

  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');

  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoFileName, setVideoFileName] = useState('');

  // Drag-and-drop state
  const [isAudioDragging, setIsAudioDragging] = useState(false);
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const [isVideoDragging, setIsVideoDragging] = useState(false);

  // Hidden file inputs
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageInputTitle, setNewPageInputTitle] = useState('');
  const [newPageCategory, setNewPageCategory] = useState('Documentation');
  const [newPageParentPath, setNewPageParentPath] = useState<string | undefined>(undefined);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [isPublishingToGitHub, setIsPublishingToGitHub] = useState(false);
  const [githubCommitStatus, setGithubCommitStatus] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    commitUrl?: string;
    commitSha?: string;
  } | null>(null);

  const handleTriggerSync = () => {
    setIsSyncActive(true);
    setTimeout(() => setIsSyncActive(false), 1200);
  };

  // Sync pages list
  const refreshRegistry = () => {
    setPagesList(getAllFlatPages());
  };

  useEffect(() => {
    window.addEventListener('greendocs:cards-updated', refreshRegistry);
    return () => window.removeEventListener('greendocs:cards-updated', refreshRegistry);
  }, []);

  // When clicking "+ Create Card" or "+ Card" on a folder
  const handleStartCreateCard = (folderPath?: string, folderTitle?: string, initialTitle?: string) => {
    setSelectedCardId(`card-${Date.now()}`);
    setTitle(initialTitle || '');
    setTag('General Spec');
    setOrder(1);
    setDefinition('');
    setKeyRule('');
    setTsInterface('interface ComponentConfig {\n  id: string;\n  status: "active";\n}');
    setAudioUrl('');
    setAudioDuration('');
    setAudioTitle('');
    setAudioFileName('');
    setPdfUrl('');
    setPdfTitle('');
    setPdfFileName('');
    setVideoUrl('');
    setVideoTitle('');
    setVideoFileName('');

    if (folderPath) {
      setSelectedPagePath(folderPath);
      setSelectedPageTitle(folderTitle || folderPath);
    }
    setActiveTab('editor');
  };

  // When user clicks a card in the HierarchyTree
  const handleSelectCardFromTree = (card: ComponentCard, pagePath: string) => {
    setSelectedCardId(card.id);
    setTitle(card.title || '');
    setTag(card.tag || 'Architecture');
    setOrder(card.order || 1);
    setDefinition(card.definition || '');
    setKeyRule(card.keyRule || '');
    setTsInterface(card.deepDive?.typescriptInterface || '');
    setSelectedPagePath(pagePath);

    const matchingPage = pagesList.find((p) => p.urlPath.toLowerCase() === pagePath.toLowerCase());
    setSelectedPageTitle(matchingPage ? matchingPage.title : pagePath);

    const m = card.media;
    setAudioUrl(m?.audioUrl || '');
    setAudioDuration(m?.audioDuration || '');
    setAudioTitle(m?.audioTitle || '');
    setAudioFileName(m?.audioUrl ? 'Attached Audio File' : '');

    setPdfUrl(m?.pdfUrl || '');
    setPdfTitle(m?.pdfTitle || '');
    setPdfFileName(m?.pdfUrl ? 'Attached PDF File' : '');

    setVideoUrl(m?.videoUrl || '');
    setVideoTitle(m?.videoTitle || '');
    setVideoFileName(m?.videoUrl ? 'Attached Video File' : '');

    setActiveTab('editor');
  };

  // Convert uploaded local file to Base64 data URI
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // File Handlers
  const handleAudioFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAudioUrl(dataUrl);
      setAudioFileName(file.name);
      setAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
      setAudioDuration('Audio Track');
    } catch (err) {
      console.error('Error reading audio file', err);
    }
  };

  const handlePdfFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPdfUrl(dataUrl);
      setPdfFileName(file.name);
      setPdfTitle(file.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      console.error('Error reading PDF file', err);
    }
  };

  const handleVideoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setVideoUrl(dataUrl);
      setVideoFileName(file.name);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      console.error('Error reading video file', err);
    }
  };

  // Dynamic preview card object
  const previewCard: ComponentCard = useMemo(() => {
    return {
      id: selectedCardId || 'card-new-preview',
      title: title || 'Untitled Component Card',
      tag: tag || 'Architecture',
      definition: definition || 'Component definition and architectural concept.',
      keyRule: keyRule || 'Ensure strict invariant safety.',
      order: Number(order) || 1,
      deepDive: {
        typescriptInterface:
          tsInterface || 'interface ComponentConfig {\n  status: "verified";\n}',
      },
      media: {
        audioUrl: audioUrl.trim() || undefined,
        audioDuration: audioDuration.trim() || undefined,
        audioTitle: audioTitle.trim() || undefined,
        pdfUrl: pdfUrl.trim() || undefined,
        pdfTitle: pdfTitle.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        videoTitle: videoTitle.trim() || undefined,
      },
      pagePath: selectedPagePath,
    };
  }, [
    selectedCardId,
    title,
    tag,
    order,
    definition,
    keyRule,
    tsInterface,
    audioUrl,
    audioDuration,
    audioTitle,
    pdfUrl,
    pdfTitle,
    videoUrl,
    videoTitle,
    selectedPagePath,
  ]);

  // Commit and Push Directly to GitHub Repository
  const handleSaveAndDeploy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const targetPath = selectedPagePath;
    const cardId = selectedCardId || `card-${Date.now()}`;

    const cardToSave: ComponentCard = {
      ...previewCard,
      id: cardId,
      pagePath: targetPath,
    };

    setIsPublishingToGitHub(true);
    setGithubCommitStatus({
      type: 'info',
      text: `Committing "${title.trim()}" directly to GitHub repository...`,
    });

    // 1. Save locally for immediate runtime preview
    saveCustomCard(cardToSave, targetPath, '01-hnc');

    // 2. Commit directly to GitHub repository source (src/content/...)
    const filePath = resolveRepositoryFilePath(targetPath, title, Number(order) || 1);
    const markdownContent = serializeCardToMarkdown(cardToSave);

    const githubResult = await commitMarkdownToGitHub(
      filePath,
      markdownContent,
      `docs(studio): commit card "${title.trim()}" to ${targetPath}`
    );

    setIsPublishingToGitHub(false);

    if (githubResult.success) {
      setGithubCommitStatus({
        type: 'success',
        text: `Committed "${title.trim()}" to GitHub main!`,
        commitUrl: githubResult.commitUrl,
        commitSha: githubResult.commitSha,
      });

      // Clear from pending queue if present
      try {
        const raw = localStorage.getItem('greendocs_pending_deployments_v1');
        const existing = raw ? JSON.parse(raw) : [];
        const filtered = existing.filter((item: any) => item.id !== cardId);
        localStorage.setItem('greendocs_pending_deployments_v1', JSON.stringify(filtered));
      } catch (err) {
        // ignore
      }

      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    } else {
      setGithubCommitStatus({
        type: 'error',
        text: `GitHub Push Failed: ${githubResult.error || 'Check repository access token'}`,
      });
    }
  };

  // Queue to Deployments review board without immediate push
  const handleQueueInDeployments = () => {
    if (!title.trim()) return;
    const targetPath = selectedPagePath;
    const cardId = selectedCardId || `card-${Date.now()}`;
    const filePath =
      previewCard.filePath ||
      resolveRepositoryFilePath(targetPath, title.trim(), Number(order) || 1);

    const cardToSave: ComponentCard = {
      ...previewCard,
      id: cardId,
      pagePath: targetPath,
      filePath,
    };

    saveCustomCard(cardToSave, targetPath, '01-hnc');

    queueDeployment({
      id: cardId,
      title: title.trim(),
      targetPath,
      actionType: selectedCardId ? 'update' : 'create',
      filePath,
      cardData: cardToSave,
      submittedAt: 'Just now',
    });

    setGithubCommitStatus({
      type: 'info',
      text: `Card "${title.trim()}" queued in Deployments. You can review and publish to GitHub anytime.`,
    });
  };

  const handleDeleteCurrentCard = () => {
    if (!selectedCardId) return;
    const cardTitle = title || 'Current Card';
    const filePath =
      previewCard.filePath ||
      resolveRepositoryFilePath(selectedPagePath, cardTitle, Number(order) || 1);

    deleteCard(selectedCardId);

    queueDeployment({
      id: `del-card-${selectedCardId}-${Date.now()}`,
      title: cardTitle,
      targetPath: selectedPagePath,
      actionType: 'delete',
      filePath,
      cardData: previewCard,
      submittedAt: 'Just now',
    });

    setGithubCommitStatus({
      type: 'info',
      text: `Card "${cardTitle}" removed locally & queued for GitHub deletion in Deployments.`,
    });
    handleStartCreateCard(selectedPagePath, selectedPageTitle);
  };

  const handleCreateNewPageModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageInputTitle.trim()) return;

    const pageTitle = newPageInputTitle.trim();
    const created = createDynamicPage(pageTitle, newPageCategory, newPageParentPath);
    setShowNewPageModal(false);
    setNewPageInputTitle('');

    // Auto-select the newly created page
    setSelectedPagePath(created.urlPath);
    setSelectedPageTitle(created.title);

    // Queue new page in Deployments
    const cleanPath = created.urlPath.replace(/^\/home\/?/, '');
    const filePath = `src/content/${cleanPath}/01-index.md`;
    queueDeployment({
      id: `page-${created.slug}-${Date.now()}`,
      title: created.title,
      targetPath: created.urlPath,
      actionType: 'create',
      filePath,
      contentPayload: serializePageToMarkdown(
        created.title,
        created.category || 'Documentation',
        created.order || 1
      ),
      submittedAt: 'Just now',
    });

    setGithubCommitStatus({
      type: 'info',
      text: `Page "${created.title}" created & queued in Deployments for GitHub push.`,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 text-left text-slate-200 animate-fadeIn">
      <div className="w-full rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="h-10 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            title="Return to /home workspace"
          >
            <span className="text-emerald-400 group-hover:text-emerald-300 transition-colors">&larr;</span>
            <span>Go to /home</span>
          </button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            GUI Management Portal
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGitHubModal(true)}
            className="h-10 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            title="Configure GitHub Repository & PAT Token"
          >
            <span className="text-emerald-400">⚡</span>
            <span className="tracking-wide">GitHub Sync</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/deployments')}
            className="h-10 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            title="View Active Deployments Portal"
          >
            <span className="flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <DeploymentsIcon size={15} />
            </span>
            <span className="tracking-wide">Deployments</span>
          </button>
        </div>
      </div>

      {/* Main Two-Grid Studio Layout: Destination Grid on the Left & Live Preview on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
        {/* Left Grid: Destination Page / Folder & Card Form Editor */}
        <div className="flex flex-col w-full">
          <form
            onSubmit={handleSaveAndDeploy}
            className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col justify-between h-full shadow-2xl"
          >
            {githubCommitStatus && (
              <div
                className={`mb-4 p-3 rounded-lg border font-mono text-xs flex items-center justify-between gap-3 animate-fadeIn ${
                  githubCommitStatus.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : githubCommitStatus.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">
                    {githubCommitStatus.type === 'success' ? '✓' : githubCommitStatus.type === 'error' ? '✕' : '⚡'}
                  </span>
                  <span className="truncate">{githubCommitStatus.text}</span>
                </div>
                {githubCommitStatus.commitUrl && (
                  <a
                    href={githubCommitStatus.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-emerald-200 hover:text-white shrink-0 text-[11px] font-semibold"
                  >
                    View Commit &rarr;
                  </a>
                )}
              </div>
            )}

            {/* Section 1: DESTINATION PAGE / FOLDER */}
            <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-200 font-semibold flex items-center gap-2">
                  <span>1. DESTINATION PAGE / FOLDER</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 relative overflow-x-auto scrollbar-none rounded-md border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-all">
                  <input
                    type="text"
                    readOnly
                    value={`${selectedPageTitle} (${selectedPagePath})`}
                    onClick={() => setShowTreeModal(true)}
                    className="w-full h-10 bg-transparent border-none px-3 text-xs text-emerald-300 font-mono cursor-pointer whitespace-nowrap outline-none select-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    title="Click to open Tree pop-up and change destination"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowTreeModal(true)}
                  className="h-10 px-4 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 shadow-sm transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  title="Select destination folder"
                >
                  <span className="flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <SelectIcon size={15} />
                  </span>
                  <span>Select</span>
                </button>
              </div>
            </div>

              {/* Section 2: Card Core Identity */}
              <div className="flex flex-col gap-3 py-4 border-b border-white/[0.06]">
                <label className="text-xs font-mono text-slate-300 font-semibold">
                  2. CARD IDENTITY & METADATA
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Card Title */}
                  <div className="sm:col-span-6 flex flex-col gap-1">
                    <span className="text-[11px] font-mono text-slate-400">Card Title *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. cv::morphologyEx or Spatial Blur"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>

                  {/* Tag / Category */}
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <span className="text-[11px] font-mono text-slate-400">Tag / Badge</span>
                    <input
                      type="text"
                      placeholder="e.g. Architecture"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>

                  {/* Sequence Order */}
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <span className="text-[11px] font-mono text-slate-400">Sequence Order #</span>
                    <input
                      type="number"
                      min={1}
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value) || 1)}
                      className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Definition & Architectural Guidelines */}
              <div className="flex flex-col gap-3 py-4 border-b border-white/[0.06]">
                <label className="text-xs font-mono text-slate-300 font-semibold">
                  3. CARD CONTENT & SPECIFICATION
                </label>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-slate-400">Definition / Overview</span>
                  <textarea
                    rows={2}
                    placeholder="Clear, authoritative explanation of this component or function..."
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 font-sans resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-slate-400">Execution Rule / Invariant</span>
                  <textarea
                    rows={2}
                    placeholder="Key architectural invariant or algorithmic rule..."
                    value={keyRule}
                    onChange={(e) => setKeyRule(e.target.value)}
                    className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 font-sans resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-slate-400">TypeScript Interface Spec</span>
                  <textarea
                    rows={4}
                    placeholder="interface MorphParams { ... }"
                    value={tsInterface}
                    onChange={(e) => setTsInterface(e.target.value)}
                    className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-emerald-400 placeholder-slate-600 outline-none focus:border-emerald-500/50 font-mono resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Section 4: Multi-Asset Attachments (Audio, PDF, Video) */}
              <div className="flex flex-col gap-3 py-4 border-b border-white/[0.06]">
                <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                  <span>4. MULTI-FORMAT MEDIA ATTACHMENTS</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Direct Upload, Drag & Drop, or URL
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Asset A: Audio */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsAudioDragging(true);
                    }}
                    onDragLeave={() => setIsAudioDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsAudioDragging(false);
                      handleAudioFiles(e.dataTransfer.files);
                    }}
                    className={`rounded-lg border p-3 flex flex-col gap-2 transition-all ${
                      isAudioDragging
                        ? 'border-white/40 bg-white/5'
                        : audioUrl
                        ? 'border-white/20 bg-white/[0.02]'
                        : 'border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white flex items-center gap-1.5">
                        <span className="flex items-center justify-center text-white">
                          <AudioAttachmentIcon size={14} />
                        </span>
                        <span>Audio File</span>
                      </span>
                      {audioUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAudioUrl('');
                            setAudioFileName('');
                          }}
                          className="text-[10px] font-mono text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleAudioFiles(e.target.files)}
                    />

                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full py-2 border border-white/[0.08] hover:border-emerald-500/40 bg-[#070a0e]/90 hover:bg-[#0c121a]/95 backdrop-blur-md rounded-md text-center text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {audioFileName || (audioUrl ? 'Audio Attached' : '+ Upload MP3 / Audio')}
                    </button>

                    <input
                      type="text"
                      placeholder="Or paste audio URL..."
                      value={audioUrl.startsWith('data:') ? '' : audioUrl}
                      onChange={(e) => {
                        setAudioUrl(e.target.value);
                        setAudioFileName(e.target.value ? 'External Audio URL' : '');
                      }}
                      className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 outline-none font-mono"
                    />
                  </div>

                  {/* Asset B: PDF */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsPdfDragging(true);
                    }}
                    onDragLeave={() => setIsPdfDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsPdfDragging(false);
                      handlePdfFiles(e.dataTransfer.files);
                    }}
                    className={`rounded-lg border p-3 flex flex-col gap-2 transition-all ${
                      isPdfDragging
                        ? 'border-white/40 bg-white/5'
                        : pdfUrl
                        ? 'border-white/20 bg-white/[0.02]'
                        : 'border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white flex items-center gap-1.5">
                        <span className="flex items-center justify-center text-white">
                          <PdfAttachmentIcon size={14} />
                        </span>
                        <span>PDF Reference</span>
                      </span>
                      {pdfUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPdfUrl('');
                            setPdfFileName('');
                          }}
                          className="text-[10px] font-mono text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handlePdfFiles(e.target.files)}
                    />

                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full py-2 border border-white/[0.08] hover:border-emerald-500/40 bg-[#070a0e]/90 hover:bg-[#0c121a]/95 backdrop-blur-md rounded-md text-center text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {pdfFileName || (pdfUrl ? 'PDF Attached' : '+ Upload PDF Document')}
                    </button>

                    <input
                      type="text"
                      placeholder="Or paste PDF URL..."
                      value={pdfUrl.startsWith('data:') ? '' : pdfUrl}
                      onChange={(e) => {
                        setPdfUrl(e.target.value);
                        setPdfFileName(e.target.value ? 'External PDF URL' : '');
                      }}
                      className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 outline-none font-mono"
                    />
                  </div>

                  {/* Asset C: Video */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsVideoDragging(true);
                    }}
                    onDragLeave={() => setIsVideoDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsVideoDragging(false);
                      handleVideoFiles(e.dataTransfer.files);
                    }}
                    className={`rounded-lg border p-3 flex flex-col gap-2 transition-all ${
                      isVideoDragging
                        ? 'border-white/40 bg-white/5'
                        : videoUrl
                        ? 'border-white/20 bg-white/[0.02]'
                        : 'border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white flex items-center gap-1.5">
                        <span className="flex items-center justify-center text-white">
                          <VideoAttachmentIcon size={14} />
                        </span>
                        <span>Walkthrough Video</span>
                      </span>
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setVideoUrl('');
                            setVideoFileName('');
                          }}
                          className="text-[10px] font-mono text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleVideoFiles(e.target.files)}
                    />

                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-2 border border-white/[0.08] hover:border-emerald-500/40 bg-[#070a0e]/90 hover:bg-[#0c121a]/95 backdrop-blur-md rounded-md text-center text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {videoFileName || (videoUrl ? 'Video Attached' : '+ Upload MP4 / Video')}
                    </button>

                    <input
                      type="text"
                      placeholder="Or paste YouTube / MP4 URL..."
                      value={videoUrl.startsWith('data:') ? '' : videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setVideoFileName(e.target.value ? 'External Video URL' : '');
                      }}
                      className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons (Dual actions: Direct GitHub Commit & Staging Queue) */}
              <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
                <button
                  type="button"
                  onClick={handleQueueInDeployments}
                  className="h-11 px-4 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-amber-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-amber-300 hover:text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Stage card in Deployments Portal review queue"
                >
                  <span>📥 Queue in Deployments</span>
                </button>

                <button
                  type="submit"
                  disabled={isPublishingToGitHub}
                  className="h-11 px-6 rounded-md border border-emerald-500/40 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-50"
                  title="Commit and push markdown file directly to GitHub repository (main branch)"
                >
                  {isPublishingToGitHub ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Committing to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">⚡</span>
                      <span>Commit &amp; Push to GitHub</span>
                    </>
                  )}
                </button>
              </div>
          </form>
        </div>

        {/* Right Grid: Live Interactive Preview & Extensible Future Deck */}
        <div className="flex flex-col w-full sticky top-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col justify-between h-full shadow-2xl">
            {/* Live Preview Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  LIVE PREVIEW
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  className="h-8 px-3 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-emerald-400 hover:text-emerald-300 font-mono text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  title="Real-Time Sync Active"
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 transition-transform ${isSyncActive ? 'animate-ping' : 'group-hover:scale-125'}`} />
                  <span>{isSyncActive ? 'Synced ✓' : 'Real-Time Sync'}</span>
                </button>
              </div>
            </div>

            {/* Render Full Content Card with Productivity Action Grid */}
            <div
              className="w-full flex justify-center py-6 px-3 sm:px-4 rounded-lg border border-white/[0.06] relative overflow-hidden my-3 shadow-inner"
              style={{
                backgroundColor: '#070a0e',
                backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.38) 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px',
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/5 blur-2xl pointer-events-none" />
              <div className="w-full max-w-lg relative z-10">
                <ContentCard card={previewCard} />
              </div>
            </div>

            {/* Live Preview Functional Deck & Future Expansion Tools */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="flex items-center justify-center text-amber-400">
                    <DiagnosticsIcon size={14} />
                  </span>
                  <span>Live Card Diagnostics & Tools</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Extensible Preview Deck
                </span>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div
                  className={`p-2 rounded-md border flex flex-col gap-0.5 ${
                    audioUrl
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/[0.06] bg-black/30 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] text-slate-400">Audio Track</span>
                  <span className="font-semibold truncate">{audioUrl ? 'Attached ✓' : 'None'}</span>
                </div>

                <div
                  className={`p-2 rounded-md border flex flex-col gap-0.5 ${
                    pdfUrl
                      ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                      : 'border-white/[0.06] bg-black/30 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] text-slate-400">PDF Reader</span>
                  <span className="font-semibold truncate">{pdfUrl ? 'Attached ✓' : 'None'}</span>
                </div>

                <div
                  className={`p-2 rounded-md border flex flex-col gap-0.5 ${
                    videoUrl
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                      : 'border-white/[0.06] bg-black/30 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] text-slate-400">Walkthrough</span>
                  <span className="font-semibold truncate">{videoUrl ? 'Attached ✓' : 'None'}</span>
                </div>

                <div
                  className={`p-2 rounded-md border flex flex-col gap-0.5 ${
                    tsInterface
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-white/[0.06] bg-black/30 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] text-slate-400">TS Schema</span>
                  <span className="font-semibold truncate">{tsInterface ? 'Configured ✓' : 'None'}</span>
                </div>
              </div>

              {/* Action Jump to Real Consumer Card */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/30 border border-white/[0.06]">
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  Consumer Hash: <span className="text-emerald-400">#{previewCard.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`${selectedPagePath}#${previewCard.id}`)}
                  className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 font-mono text-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Test in /home</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Modal: Page & Card Tree Explorer */}
      {showTreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl h-[85vh] max-h-[820px] rounded-2xl border border-white/[0.08] bg-[#070a0e]/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header (CSS Selector 1) */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#070a0e]/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {/* CSS Selector 2 & 3: Header Icon container and glyph */}
                <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-[#070a0e]/90 flex items-center justify-center text-white">
                  <SelectIcon size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>Page & Card Hierarchy Explorer</span>
                    <span className="text-[10px] font-normal text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                      Pop-up Mode
                    </span>
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    Reorder cards & pages, create sub-pages, or click any folder or card to bind directly
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTreeModal(false)}
                className="w-8 h-8 rounded-lg border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-sm"
                title="Close tree pop-up"
              >
                <TreeCloseIcon size={12} />
              </button>
            </div>

            {/* Modal Body: Embedded HierarchyTree */}
            <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
              <HierarchyTree
                selectedCardId={selectedCardId}
                selectedPagePath={selectedPagePath}
                onSelectCard={(card, path) => {
                  handleSelectCardFromTree(card, path);
                  setShowTreeModal(false);
                }}
                onCreateCardForFolder={(path, title) => {
                  handleStartCreateCard(path, title);
                  setShowTreeModal(false);
                }}
                onCreateNewPage={(parentPath) => {
                  setNewPageParentPath(parentPath);
                  setShowNewPageModal(true);
                }}
                className="h-full flex-1 flex flex-col"
              />
            </div>

            {/* Modal Footer (CSS Selector 4 & 5) */}
            <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Active Target:</span>
                <span className="text-white font-semibold">{selectedPageTitle}</span>
                <span className="text-slate-500 text-[11px]">({selectedPagePath})</span>
              </div>

              {/* CSS Selector 5: Done / Close button */}
              <button
                type="button"
                onClick={() => setShowTreeModal(false)}
                className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-200 hover:text-white font-mono text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Root Page or Sub-Page */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#070a0e]/95 backdrop-blur-md p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <TreeFolderIcon size={16} className="text-white" />
                <span className="font-mono text-sm font-semibold text-white">
                  {newPageParentPath ? 'Create Sub-Page' : 'Create New Page'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="w-7 h-7 rounded border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-md shadow-sm"
              >
                <TreeCloseIcon size={11} />
              </button>
            </div>

            <form onSubmit={handleCreateNewPageModalSubmit} className="flex flex-col gap-3">
              {newPageParentPath && (
                <div className="text-[11px] font-mono text-slate-400">
                  Parent: <span className="text-white font-medium">{newPageParentPath}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300">Page Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Learning, Object Tracking, or Algorithms"
                  value={newPageInputTitle}
                  onChange={(e) => setNewPageInputTitle(e.target.value)}
                  autoFocus
                  className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300">Category</label>
                <input
                  type="text"
                  value={newPageCategory}
                  onChange={(e) => setNewPageCategory(e.target.value)}
                  className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:bg-[#0c121a]/95 text-xs font-mono text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-200 hover:text-white font-semibold text-xs font-mono transition-colors cursor-pointer shadow-sm"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: GitHub Settings & PAT Configuration */}
      <GitHubSettingsModal isOpen={showGitHubModal} onClose={() => setShowGitHubModal(false)} />
    </div>
  );
};
