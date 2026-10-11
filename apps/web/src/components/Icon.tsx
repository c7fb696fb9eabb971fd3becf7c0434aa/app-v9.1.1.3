import {
  ArrowDownUp,
  AudioLines,
  BadgeCheck,
  FilePlus2,
  FileText,
  FolderPlus,
  GitCompareArrows,
  Hexagon,
  ImagePlus,
  KeyRound,
  Menu,
  Move,
  Pen,
  Trash2,
  Upload,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';

const iconCatalog = {
  brand: Hexagon,
  navigationOpen: Menu,
  navigationClose: X,
  accessKey: KeyRound,
  createPage: FilePlus2,
  createChildPage: FolderPlus,
  editRecord: Pen,
  deleteRecord: Trash2,
  moveRecord: Move,
  reorderRecord: ArrowDownUp,
  attachImage: ImagePlus,
  attachAudio: AudioLines,
  attachVideo: Video,
  attachPdf: FileText,
  publish: Upload,
  conflict: GitCompareArrows,
  verified: BadgeCheck,
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
