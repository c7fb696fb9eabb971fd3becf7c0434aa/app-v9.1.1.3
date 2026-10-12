import {
  ArrowLeft,
  ArrowDownUp,
  Bookmark,
  AudioLines,
  BadgeCheck,
  ChevronRight,
  Clapperboard,
  Code2,
  Copy,
  FilePlus2,
  FileText,
  Files,
  FolderPlus,
  GitBranch,
  GitCompareArrows,
  Hexagon,
  ImagePlus,
  KeyRound,
  Menu,
  Move,
  MousePointer2,
  PanelTop,
  Pen,
  Play,
  Printer,
  Settings,
  Share2,
  Terminal,
  Trash2,
  Upload,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';

const iconCatalog = {
  brand: Hexagon,
  navigationBack: ArrowLeft,
  navigationOpen: Menu,
  navigationClose: X,
  promptContinue: ChevronRight,
  accessKey: KeyRound,
  createPage: FilePlus2,
  createChildPage: FolderPlus,
  editRecord: Pen,
  deleteRecord: Trash2,
  moveRecord: Move,
  selectTool: MousePointer2,
  reorderRecord: ArrowDownUp,
  attachImage: ImagePlus,
  attachAudio: AudioLines,
  attachVideo: Video,
  attachPdf: FileText,
  publish: Upload,
  conflict: GitCompareArrows,
  verified: BadgeCheck,
  cardPreview: Play,
  cardFiles: Files,
  cardVideo: Clapperboard,
  cardLayout: PanelTop,
  cardTerminal: Terminal,
  cardWorkflow: GitBranch,
  cardBookmark: Bookmark,
  cardDuplicate: Copy,
  cardShare: Share2,
  cardCode: Code2,
  cardPrint: Printer,
  cardSettings: Settings,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconCatalog;
export const ICON_NAMES = Object.freeze(Object.keys(iconCatalog) as IconName[]);
export const ICON_CATALOG_IS_UNIQUE =
  new Set(Object.values(iconCatalog)).size === Object.keys(iconCatalog).length;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const Component = iconCatalog[name];
  return <Component aria-hidden="true" focusable="false" size={size} strokeWidth={1.8} />;
}

export function IconButton({
  name,
  label,
  disabled = false,
  onClick,
}: {
  name: IconName;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="icon-button"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={name} />
    </button>
  );
}
