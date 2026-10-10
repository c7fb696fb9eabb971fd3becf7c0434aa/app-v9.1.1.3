/**
 * Multi-format media attachments and resources for a card.
 */
export interface CardMediaAssets {
  /** Optional audio voiceover, pronunciation, or podcast commentary (URL, path, or data URI) */
  audioUrl?: string;
  /** Formatted duration (e.g. '01:42') */
  audioDuration?: string;
  /** Title or narrator info for audio */
  audioTitle?: string;
  /** Optional PDF documentation, cheat sheet, or paper link */
  pdfUrl?: string;
  /** Document title for the PDF */
  pdfTitle?: string;
  /** Optional walkthrough or demo video URL (MP4, YouTube, Vimeo, Loom) */
  videoUrl?: string;
  /** Title or topic for the video */
  videoTitle?: string;
  /** Optional diagram or visual illustration image URLs */
  images?: string[];
  /** Optional extended technical notes or full-text specifications */
  extendedNotes?: string;
}

/**
 * Represents a documentation component card or slide within the system.
 */
export interface ComponentCard {
  /** Unique identifier for the component card / slide */
  id: string;
  /** Primary display title */
  title: string;
  /** Category or technology tag (e.g., 'Tensor Kernel') */
  tag: string;
  /** High-level definition or conceptual summary */
  definition: string;
  /** Core architectural or accessibility rule */
  keyRule: string;
  /** Numeric sequence order (e.g. 1 from "01-hnc-") */
  order?: number;
  /** Directory sequence order (e.g. 1 from "01-hnc") */
  folderOrder?: number;
  /** Detailed technical specifications and TypeScript signatures */
  deepDive: {
    typescriptInterface: string;
  };
  /** Multi-format media attachments (Audio, PDF, Video, Images, Extended Notes) */
  media?: CardMediaAssets;
  /** Parent folder/holder id e.g. 01-hnc */
  holderId?: string;
  /** Parent page path e.g. /home/opencv/imageprocessing */
  pagePath?: string;
  /** GitHub repository file path e.g. src/content/... */
  filePath?: string;
}

/**
 * Manifest representation for bundling cards and media assets within a folder.
 */
export interface CardBundleManifest {
  version: string;
  holderId: string;
  cards: ComponentCard[];
  updatedAt?: string;
}

/**
 * Common configuration options for swipable cards.
 */
export interface SwipeableCardDeckProps {
  /** Array of component card data */
  cards: ComponentCard[];
  /** Zero-based index of the currently active card */
  currentIndex: number;
  /** Callback fired when the active index changes via swipe or keyboard navigation */
  onIndexChange: (index: number) => void;
  /** Optional custom class name applied to the outer container */
  className?: string;
}

/**
 * Represents a Card Holder (e.g. 01-hnc, 02-hnc) containing swipable card slides.
 */
export interface CardHolder {
  /** Unique identifier for the card holder directory (e.g. '01-hnc') */
  id: string;
  /** Sequence order for this card holder (e.g. 1 from '01-hnc') */
  order: number;
  /** Swipable card slides held within this card holder */
  cards: ComponentCard[];
}

/**
 * Represents a node in the hierarchical page tree.
 * A page can have card holders, nested child sub-pages, or both.
 */
export interface PageNode {
  /** Unique canonical identifier for the page node (e.g. 'opencv/imageprocessing') */
  id: string;
  /** URL path slug segment (e.g. 'opencv', 'imageprocessing') */
  slug: string;
  /** Full computed URL route path (e.g. '/opencv/imageprocessing') */
  urlPath?: string;
  /** Display title for breadcrumbs and lists */
  title: string;
  /** Optional sequence order index (e.g. 1 from '01-hnp-') */
  order?: number;
  /** Optional runtime version string (e.g. 'v4.10.0') */
  version?: string;
  /** Optional category or domain subtitle */
  category?: string;
  /** Optional summary or overview prose */
  summary?: string;
  /** Full markdown content body if present */
  content?: string;
  /** Discrete card holders hosted on this page (e.g. 01-hnc, 02-hnc) */
  cardHolders?: CardHolder[];
  /** Documentation cards hosted on this page */
  cards?: ComponentCard[];
  /** Optional nested child pages (arbitrary depth) */
  children?: PageNode[];
}
