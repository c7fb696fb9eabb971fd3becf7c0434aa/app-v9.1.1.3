import { PageNode, ComponentCard, CardHolder } from '../types';

/**
 * Raw imported Markdown file map powered by Vite's eager static glob.
 * Bundles all markdown files under src/content/ at compile time.
 */
const rawMarkdownFiles = import.meta.glob('/src/content/**/*.{md,markdown}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/**
 * Raw bundle manifests (manifest.json) bundled at compile time.
 */
const rawManifestFiles = import.meta.glob('/src/content/**/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, any>;

/**
 * Metadata extracted from frontmatter or top-level key-value headers.
 */
export interface PageMetadata {
  title?: string;
  version?: string;
  category?: string;
  summary?: string;
  order?: number;
}

/**
 * Resilient, forgiving frontmatter and header parser.
 * Supports:
 * 1. Standard YAML frontmatter wrapped in `---`
 * 2. Plain `key: value` lines at the very top of the file without any `---` fences
 */
export function parseForgivingHeaders(rawContent: string): { data: Record<string, any>; body: string } {
  const content = rawContent.trimStart();
  const data: Record<string, any> = {};

  // Case 1: Standard YAML frontmatter between `---` fences
  const fencedRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const fencedMatch = fencedRegex.exec(content);

  let headerBlock = '';
  let body = content;

  if (fencedMatch) {
    headerBlock = fencedMatch[1];
    body = fencedMatch[2].trim();
  } else {
    // Case 2: Unfenced key-value lines at top of file
    const lines = content.split(/\r?\n/);
    const headerLines: string[] = [];
    let splitIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Stop header collection on empty line, markdown header '#', code block '```', or Key Rule
      if (!line) {
        splitIdx = i + 1;
        break;
      }
      if (
        line.startsWith('#') ||
        line.startsWith('```') ||
        line.startsWith('>') ||
        /^(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?$/i.test(line)
      ) {
        splitIdx = i;
        break;
      }
      if (line.includes(':')) {
        headerLines.push(line);
      } else {
        splitIdx = i;
        break;
      }
    }

    if (headerLines.length > 0) {
      headerBlock = headerLines.join('\n');
      body = lines.slice(splitIdx).join('\n').trim();
    }
  }

  // Parse headerBlock into key-value pairs
  if (headerBlock) {
    const lines = headerBlock.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value: any = trimmed.slice(colonIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        } else if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        } else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        }

        data[key] = value;
      }
    }
  }

  return { data, body };
}

/**
 * Humanizes a slug (e.g., 'opencv' -> 'OpenCV', 'simd' -> 'SIMD', 'linear-algebra' -> 'Linear Algebra')
 */
export function humanizeSlug(slug: string): string {
  const acronyms: Record<string, string> = {
    opencv: 'OpenCV',
    simd: 'SIMD',
    dnn: 'DNN',
    gc: 'GC',
    jit: 'JIT',
    vm: 'VM',
    jvm: 'JVM',
    api: 'API',
    ai: 'AI',
    nn: 'NN',
    hnp: 'HNP',
    hnc: 'HNC',
    cuda: 'CUDA',
    jax: 'JAX',
    onnx: 'ONNX',
  };

  const lower = slug.toLowerCase();
  if (acronyms[lower]) return acronyms[lower];

  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Parses a swipable card markdown file (e.g. 01-hnc-sweappable.md or 01-sweappable.md).
 */
export function parseSwipableSlide(
  slideId: string,
  rawContent: string,
  deckPrefix = 'card',
  defaultTitle?: string,
  cardOrder?: number
): ComponentCard | null {
  const { data, body } = parseForgivingHeaders(rawContent);

  if (!body && Object.keys(data).length === 0) {
    return null;
  }

  // Strip prefixes like "01-hnc-", "hnc-", "01-"
  const cleanId = slideId
    .replace(/^(?:(\d+)[-_])?hnc[-_]/i, '')
    .replace(/^[0-9]+[-_]/, '');

  const title =
    data.title ||
    defaultTitle ||
    cleanId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const tag = data.tag || 'Architecture';

  // Extract Key Rule with or without markdown hashes
  let keyRule = data.keyRule || '';
  const keyRuleRegex = /(?:^|\r?\n)(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?\s*?\r?\n([\s\S]*?)(?=(?:\r?\n#{1,6}\s)|(?:\r?\n```)|$)/i;
  const keyRuleMatch = keyRuleRegex.exec(body);
  if (keyRuleMatch) {
    keyRule = keyRuleMatch[1].trim();
  }

  // Extract TypeScript code block
  let typescriptInterface = '';
  const codeBlockMatch = /```(?:typescript|ts)\r?\n([\s\S]*?)\r?\n```/i.exec(body);
  if (codeBlockMatch) {
    typescriptInterface = codeBlockMatch[1].trim();
  }

  // Extract Definition (first paragraph of prose before headers, code blocks, or Key Rule marker)
  let definition = data.definition || '';
  if (!definition) {
    const lines = body.split(/\r?\n/);
    const defLines: string[] = [];
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed) continue;
      if (
        trimmed.startsWith('#') ||
        trimmed.startsWith('```') ||
        /^(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?$/i.test(trimmed)
      ) {
        break;
      }
      defLines.push(trimmed);
    }
    definition = defLines.join(' ');
  }

  if (!definition) {
    definition = 'Modular runtime component documentation.';
  }

  // Extract media attachments (audio, PDF, video, images, extended notes)
  let media = data.media;
  if (!media && (data.audio || data.audioUrl || data.voice || data.pdf || data.pdfUrl || data.video || data.videoUrl || data.images || data.image || data.extendedNotes)) {
    media = {
      audioUrl: data.audioUrl || data.audio || data.voice,
      audioDuration: data.audioDuration,
      audioTitle: data.audioTitle || (data.audio ? `${title} Audio Overview` : undefined),
      pdfUrl: data.pdfUrl || data.pdf,
      pdfTitle: data.pdfTitle || (data.pdf ? `${title} Reference Sheet` : undefined),
      videoUrl: data.videoUrl || data.video,
      videoTitle: data.videoTitle || (data.video ? `${title} Video Walkthrough` : undefined),
      images: Array.isArray(data.images) ? data.images : data.image ? [data.image] : undefined,
      extendedNotes: data.extendedNotes,
    };
  }

  const generatedId = `${deckPrefix.toLowerCase()}-${cleanId.toLowerCase()}`;

  return {
    id: data.id || generatedId,
    title,
    tag,
    definition,
    keyRule,
    order: cardOrder ?? (data.order !== undefined ? Number(data.order) : undefined),
    deepDive: {
      typescriptInterface,
    },
    media,
  };
}

/**
 * Represents a parsed folder segment in a path.
 */
export interface ParsedFolderSegment {
  raw: string;
  isHnp: boolean;
  order?: number;
  slug: string;
  displayTitle: string;
}

/**
 * Parses an individual directory segment, detecting HNP markers and numeric prefixes:
 * - "01-hnp-opencv" -> isHnp: true, order: 1, slug: "opencv"
 * - "01-hnp-imageprocessing" -> isHnp: true, order: 1, slug: "imageprocessing"
 * - "01-opencv" -> isHnp: false, order: 1, slug: "opencv"
 * - "opencv" -> isHnp: false, order: undefined, slug: "opencv"
 */
export function parseFolderSegment(segment: string): ParsedFolderSegment {
  // Check for HNP pattern: [XX-]hnp-[slug]
  const hnpMatch = segment.match(/^(?:(\d+)[-_])?hnp[-_](.+)$/i);
  if (hnpMatch) {
    const order = hnpMatch[1] ? parseInt(hnpMatch[1], 10) : undefined;
    const rawSlug = hnpMatch[2].trim();
    const slug = rawSlug.toLowerCase();
    const displayTitle = humanizeSlug(rawSlug);
    return { raw: segment, isHnp: true, order, slug, displayTitle };
  }

  // Check for numbered generic folder: [XX]-[slug]
  const numMatch = segment.match(/^(\d+)[-_](.+)$/);
  if (numMatch) {
    const order = parseInt(numMatch[1], 10);
    const rawSlug = numMatch[2].trim();
    const slug = rawSlug.toLowerCase();
    const displayTitle = humanizeSlug(rawSlug);
    return { raw: segment, isHnp: false, order, slug, displayTitle };
  }

  // Plain folder
  const slug = segment.toLowerCase().trim();
  return {
    raw: segment,
    isHnp: false,
    order: undefined,
    slug,
    displayTitle: humanizeSlug(segment),
  };
}

/**
 * Internal accumulator node used during file-system tree synthesis.
 */
interface NodeAccumulator {
  canonicalKey: string;
  slug: string;
  displayTitle: string;
  order?: number;
  slugSegments: string[];
  meta: PageMetadata;
  content?: string;
  cardHolderMap: Map<string, { id: string; order: number; cards: ComponentCard[] }>;
  cards: ComponentCard[];
  childKeys: Set<string>;
}

/**
 * Consistent sorting comparator: orders primarily by ascending `order` property,
 * falling back to natural alphanumeric sort by title.
 */
export function comparePageNodes(a: PageNode, b: PageNode): number {
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

export function compareCards(a: ComponentCard, b: ComponentCard): number {
  const folderA = a.folderOrder ?? 1;
  const folderB = b.folderOrder ?? 1;
  if (folderA !== folderB) {
    return folderA - folderB;
  }
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

/**
 * Builds the complete recursive PageNode tree from all files in src/content/.
 */
function buildTreeFromFileSystem(): PageNode[] {
  const nodeMap = new Map<string, NodeAccumulator>();

  const getOrCreateNode = (
    slugSegments: string[],
    preferredTitle?: string,
    defaultOrder?: number
  ): NodeAccumulator => {
    const canonicalKey = slugSegments.join('/');
    if (!nodeMap.has(canonicalKey)) {
      const lastSlug = slugSegments[slugSegments.length - 1] || 'root';
      const displayTitle = preferredTitle || humanizeSlug(lastSlug);

      nodeMap.set(canonicalKey, {
        canonicalKey,
        slug: lastSlug,
        displayTitle,
        order: defaultOrder,
        slugSegments: [...slugSegments],
        meta: {},
        cardHolderMap: new Map(),
        cards: [],
        childKeys: new Set(),
      });
    } else {
      const existing = nodeMap.get(canonicalKey)!;
      if (preferredTitle && !existing.meta.title) {
        existing.displayTitle = preferredTitle;
      }
      if (defaultOrder !== undefined && existing.order === undefined) {
        existing.order = defaultOrder;
      }
    }
    return nodeMap.get(canonicalKey)!;
  };

  const registerHierarchy = (
    parsedSegments: ParsedFolderSegment[]
  ): NodeAccumulator | null => {
    if (parsedSegments.length === 0) return null;

    let parentKey = '';
    const currentSlugSegments: string[] = [];

    for (let i = 0; i < parsedSegments.length; i++) {
      const seg = parsedSegments[i];
      currentSlugSegments.push(seg.slug);
      const currentKey = currentSlugSegments.join('/');

      const node = getOrCreateNode(currentSlugSegments, seg.displayTitle, seg.order);

      if (parentKey && nodeMap.has(parentKey)) {
        nodeMap.get(parentKey)!.childKeys.add(currentKey);
      }
      parentKey = currentKey;
    }

    return nodeMap.get(parentKey) || null;
  };

  // 1. Process all raw markdown files from Vite's static glob
  for (const [fullPath, rawContent] of Object.entries(rawMarkdownFiles)) {
    const relative = fullPath.replace(/^\/src\/content\//, '');
    const parts = relative.split('/');
    const filename = parts.pop()!;
    const cleanFilename = filename.replace(/\.(md|markdown)$/i, '');
    const rawFolderParts = [...parts];

    // Check if the immediate parent folder is "root" (e.g. "01-hnp-opencv/root/index.md")
    const isRootMetadataFolder =
      rawFolderParts.length > 0 &&
      rawFolderParts[rawFolderParts.length - 1].toLowerCase() === 'root';

    const effectivePageFolders = isRootMetadataFolder
      ? rawFolderParts.slice(0, rawFolderParts.length - 1)
      : rawFolderParts;

    // Check if inside a dedicated card folder (e.g. "01-hnc", "02-hnc", "01-card", "card")
    const lastEffectiveFolder =
      effectivePageFolders.length > 0
        ? effectivePageFolders[effectivePageFolders.length - 1]
        : '';
    const isInsideCardFolder =
      !isRootMetadataFolder &&
      (/^[0-9]+[-_]hnc$/i.test(lastEffectiveFolder) ||
        /^[0-9]+[-_]hnc[-_]/i.test(lastEffectiveFolder) ||
        lastEffectiveFolder.toLowerCase() === 'hnc' ||
        lastEffectiveFolder.toLowerCase().endsWith('-hnc') ||
        /^[0-9]+[-_]card$/i.test(lastEffectiveFolder) ||
        lastEffectiveFolder.toLowerCase() === 'card' ||
        lastEffectiveFolder.toLowerCase().endsWith('-card'));

    const targetPageFolders = isInsideCardFolder
      ? effectivePageFolders.slice(0, effectivePageFolders.length - 1)
      : effectivePageFolders;

    const parsedPageSegments = targetPageFolders.map(parseFolderSegment);
    const targetNode =
      parsedPageSegments.length > 0 ? registerHierarchy(parsedPageSegments) : null;

    // Extract card folder order if inside card folder (e.g. "01-hnc" -> 1, "02-hnc" -> 2)
    const folderOrderMatch = isInsideCardFolder
      ? lastEffectiveFolder.match(/^(\d+)[-_]/)
      : null;
    const folderOrder = folderOrderMatch ? parseInt(folderOrderMatch[1], 10) : 1;
    const holderKey = isInsideCardFolder ? lastEffectiveFolder.toLowerCase() : 'default';

    const getOrCreateCardHolder = (holderId: string, order: number) => {
      if (!targetNode!.cardHolderMap.has(holderKey)) {
        targetNode!.cardHolderMap.set(holderKey, {
          id: holderId,
          order,
          cards: [],
        });
      }
      return targetNode!.cardHolderMap.get(holderKey)!;
    };

    // A. Check for Horizontal Nested Card (HNC): e.g. "01-hnc-sweappable.md", "02-hnc-filters.md"
    const hncMatch = cleanFilename.match(/^(?:(\d+)[-_])?hnc[-_](.+)$/i);
    if (hncMatch && targetNode) {
      const fileOrder = hncMatch[1] ? parseInt(hncMatch[1], 10) : undefined;
      const cardSlug = hncMatch[2];
      const card = parseSwipableSlide(
        cardSlug,
        rawContent,
        targetNode.slug,
        undefined,
        fileOrder
      );
      if (card) {
        card.folderOrder = isInsideCardFolder ? folderOrder : 1;
        const holder = getOrCreateCardHolder(isInsideCardFolder ? lastEffectiveFolder : '01-hnc', folderOrder);
        holder.cards.push(card);
        targetNode.cards.push(card);
      }
      continue;
    }

    // B. Check for Slide inside a dedicated card folder (e.g. "01-card/01-sweappable.md" or "01-hnc/01-sweappable.md")
    if (isInsideCardFolder && targetNode) {
      const cardOrderMatch = cleanFilename.match(/^(\d+)[-_]/);
      const fileOrder = cardOrderMatch ? parseInt(cardOrderMatch[1], 10) : undefined;
      const card = parseSwipableSlide(
        cleanFilename,
        rawContent,
        lastEffectiveFolder,
        undefined,
        fileOrder
      );
      if (card) {
        card.folderOrder = folderOrder;
        const holder = getOrCreateCardHolder(lastEffectiveFolder, folderOrder);
        holder.cards.push(card);
        targetNode.cards.push(card);
      }
      continue;
    }

    // C. Check if this file is a page metadata index file:
    // e.g. "root/index.md", "index.md", "01-index.md", or cleanFilename matches parent directory name
    const indexMatch = cleanFilename.match(/^(?:(\d+)[-_])?index$/i);
    const isNamedAfterParent =
      targetPageFolders.length > 0 &&
      cleanFilename.toLowerCase() ===
        targetPageFolders[targetPageFolders.length - 1].toLowerCase();

    if ((indexMatch || isRootMetadataFolder || isNamedAfterParent) && targetNode) {
      const { data, body } = parseForgivingHeaders(rawContent);
      targetNode.meta = { ...targetNode.meta, ...data };
      targetNode.content = body;

      // Extract first paragraph for summary if not explicitly defined
      if (!targetNode.meta.summary && body) {
        const firstPara = body
          .split(/\r?\n\r?\n/)[0]
          ?.replace(/^#+\s.*$/gm, '')
          ?.trim();
        if (firstPara && !firstPara.startsWith('```')) {
          targetNode.meta.summary = firstPara;
        }
      }

      if (indexMatch && indexMatch[1]) {
        targetNode.order = parseInt(indexMatch[1], 10);
      } else if (data.order !== undefined) {
        targetNode.order = Number(data.order);
      }
      continue;
    }

    // D. Check for flat numbered card file inside page folder (e.g. "01-cyclic-gc.md")
    const flatCardMatch = cleanFilename.match(/^(\d+)[-_](.+)$/);
    if (flatCardMatch && targetNode) {
      const cardOrder = parseInt(flatCardMatch[1], 10);
      const card = parseSwipableSlide(
        cleanFilename,
        rawContent,
        targetNode.slug,
        undefined,
        cardOrder
      );
      if (card) {
        const holder = getOrCreateCardHolder('01-hnc', 1);
        holder.cards.push(card);
        targetNode.cards.push(card);
      }
      continue;
    }

    // E. Sub-page defined as a standalone markdown file (legacy backwards-compatibility)
    const subPageSeg = parseFolderSegment(cleanFilename);
    const fullSubPageSegments = [...parsedPageSegments, subPageSeg];
    const subPageNode = registerHierarchy(fullSubPageSegments);
    if (subPageNode) {
      const { data, body } = parseForgivingHeaders(rawContent);
      subPageNode.meta = { ...subPageNode.meta, ...data };
      subPageNode.content = body;
      if (data.order !== undefined) {
        subPageNode.order = Number(data.order);
      }
    }
  }

  // 1.5. Process all raw bundle manifests (manifest.json)
  for (const [fullPath, manifestData] of Object.entries(rawManifestFiles)) {
    if (!manifestData || typeof manifestData !== 'object') continue;
    const relative = fullPath.replace(/^\/src\/content\//, '');
    const parts = relative.split('/');
    parts.pop(); // remove manifest.json
    const lastFolder = parts.length > 0 ? parts[parts.length - 1] : '';
    const isInsideCardFolder =
      /^[0-9]+[-_]hnc$/i.test(lastFolder) ||
      /^[0-9]+[-_]card$/i.test(lastFolder) ||
      lastFolder.toLowerCase() === 'hnc';
    const effectivePageFolders = isInsideCardFolder ? parts.slice(0, parts.length - 1) : parts;
    const parsedSegments = effectivePageFolders.map(parseFolderSegment);
    const targetNode = parsedSegments.length > 0 ? registerHierarchy(parsedSegments) : null;
    if (targetNode && Array.isArray((manifestData as any).cards)) {
      const holderId = (manifestData as any).holderId || (isInsideCardFolder ? lastFolder : '01-hnc');
      const folderOrderMatch = holderId.match(/^(\d+)[-_]/);
      const folderOrder = folderOrderMatch ? parseInt(folderOrderMatch[1], 10) : 1;
      if (!targetNode.cardHolderMap.has(holderId.toLowerCase())) {
        targetNode.cardHolderMap.set(holderId.toLowerCase(), {
          id: holderId,
          order: folderOrder,
          cards: [],
        });
      }
      const holder = targetNode.cardHolderMap.get(holderId.toLowerCase())!;
      for (const card of (manifestData as any).cards) {
        if (!holder.cards.some((c) => c.id === card.id)) {
          holder.cards.push(card);
          targetNode.cards.push(card);
        }
      }
    }
  }

  // 2. Recursively assemble the final PageNode tree
  const buildSubTree = (canonicalKey: string): PageNode => {
    const nodeAcc = nodeMap.get(canonicalKey)!;
    const slug = nodeAcc.slug;
    const meta = nodeAcc.meta;
    const urlPath = `/home/${nodeAcc.slugSegments.join('/')}`;

    // Assemble card holders sorted by their folder order (01-hnc, 02-hnc, etc.)
    const cardHolders: CardHolder[] = Array.from(nodeAcc.cardHolderMap.values())
      .map((holder) => ({
        id: holder.id,
        order: holder.order,
        cards: [...holder.cards].sort(compareCards),
      }))
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, undefined, { numeric: true }));

    const sortedCards = cardHolders.flatMap((h) => h.cards);

    // Recursively build child nodes and sort them deterministically
    const children: PageNode[] = Array.from(nodeAcc.childKeys)
      .map(buildSubTree)
      .sort(comparePageNodes);

    return {
      id: canonicalKey,
      slug,
      urlPath,
      title: meta.title || humanizeSlug(nodeAcc.displayTitle || slug),
      order: nodeAcc.order ?? meta.order,
      version: meta.version,
      category: meta.category,
      summary: meta.summary,
      content: nodeAcc.content,
      cardHolders,
      cards: sortedCards,
      children,
    };
  };

  // Find root-level nodes (slugSegments.length === 1)
  const rootKeys = Array.from(nodeMap.keys()).filter((key) => {
    const acc = nodeMap.get(key)!;
    return acc.slugSegments.length === 1;
  });

  const rootNodes = rootKeys.map(buildSubTree).sort(comparePageNodes);
  return rootNodes;
}

// Generate tree statically at bundle time
export const FILE_SYSTEM_TREE: PageNode[] = buildTreeFromFileSystem();

// Initialize cross-tab and cross-window synchronization channel
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('greendocs_')) {
      window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
    }
  });
}

const CUSTOM_CARDS_STORAGE_KEY = 'greendocs_custom_cards_v2';
const DYNAMIC_PAGES_STORAGE_KEY = 'greendocs_dynamic_pages_v2';
const DELETED_CARDS_STORAGE_KEY = 'greendocs_deleted_cards_v2';
const CARD_ORDER_MAP_KEY = 'greendocs_card_orders_v2';
const PAGE_ORDER_MAP_KEY = 'greendocs_page_orders_v2';
const PAGE_TITLE_MAP_KEY = 'greendocs_page_titles_v2';
const DELETED_PAGES_STORAGE_KEY = 'greendocs_deleted_pages_v2';

export interface DynamicCustomPage {
  id: string;
  title: string;
  slug: string;
  urlPath: string;
  parentUrlPath?: string;
  category?: string;
  order?: number;
  summary?: string;
}

/**
 * Retrieve user-created dynamic pages from storage
 */
export function getDynamicPages(): DynamicCustomPage[] {
  try {
    const raw = localStorage.getItem(DYNAMIC_PAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getDeletedCardIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_CARDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getDeletedPagePaths(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getCardOrderMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CARD_ORDER_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function getPageOrderMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PAGE_ORDER_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function getPageTitleMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PAGE_TITLE_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Dynamically creates a new page or sub-page on the fly with automatic slug and route computation
 */
export function createDynamicPage(
  title: string,
  category = 'Documentation',
  parentUrlPath?: string
): DynamicCustomPage {
  const cleanTitle = title.trim();
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'new-module';
  const effectiveParent = parentUrlPath && parentUrlPath !== '/home' ? parentUrlPath.replace(/\/+$/, '') : '';
  const urlPath = effectiveParent ? `${effectiveParent}/${slug}` : `/home/${slug}`;

  const existing = getDynamicPages();
  const found = existing.find((p) => p.slug === slug || p.urlPath.toLowerCase() === urlPath.toLowerCase());
  if (found) {
    return found;
  }

  // Undelete if previously deleted
  const deleted = getDeletedPagePaths().filter((p) => p.toLowerCase() !== urlPath.toLowerCase());
  localStorage.setItem(DELETED_PAGES_STORAGE_KEY, JSON.stringify(deleted));

  const newPage: DynamicCustomPage = {
    id: `dyn-${slug}-${Date.now()}`,
    title: cleanTitle,
    slug,
    urlPath,
    parentUrlPath: effectiveParent || undefined,
    category,
    order: existing.length + 20,
    summary: `Interactive module for ${cleanTitle}.`,
  };
  existing.push(newPage);
  localStorage.setItem(DYNAMIC_PAGES_STORAGE_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
  return newPage;
}

/**
 * Rename any page in the hierarchy (dynamic or built-in override)
 */
export function renamePage(urlPath: string, newTitle: string): void {
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) return;

  // Check dynamic pages first
  const dynPages = getDynamicPages();
  const dynIdx = dynPages.findIndex((p) => p.urlPath.toLowerCase() === urlPath.toLowerCase());
  if (dynIdx !== -1) {
    dynPages[dynIdx].title = cleanTitle;
    localStorage.setItem(DYNAMIC_PAGES_STORAGE_KEY, JSON.stringify(dynPages));
  } else {
    // Persist as title override for built-in page
    const titleMap = getPageTitleMap();
    titleMap[urlPath.toLowerCase()] = cleanTitle;
    localStorage.setItem(PAGE_TITLE_MAP_KEY, JSON.stringify(titleMap));
  }
  window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
}

/**
 * Delete a page from the hierarchy
 */
export function deletePage(urlPath: string): void {
  const lowerPath = urlPath.toLowerCase();

  // Remove from dynamic pages if exists
  const dynPages = getDynamicPages().filter((p) => p.urlPath.toLowerCase() !== lowerPath);
  localStorage.setItem(DYNAMIC_PAGES_STORAGE_KEY, JSON.stringify(dynPages));

  // Add to deleted pages set
  const deletedPages = getDeletedPagePaths();
  if (!deletedPages.includes(lowerPath)) {
    deletedPages.push(lowerPath);
    localStorage.setItem(DELETED_PAGES_STORAGE_KEY, JSON.stringify(deletedPages));
  }

  // Also remove custom cards belonging to this page
  const customCards = getCustomCards().filter((c) => c.pagePath?.toLowerCase() !== lowerPath);
  localStorage.setItem(CUSTOM_CARDS_STORAGE_KEY, JSON.stringify(customCards));

  window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
}

/**
 * Move a page Up or Down among its siblings
 */
export function reorderPage(urlPath: string, direction: 'up' | 'down'): void {
  const tree = getContentRegistry();
  const lowerPath = urlPath.toLowerCase();

  // Find the page and its siblings
  let siblings: PageNode[] = [];
  const findSiblings = (nodes: PageNode[], parent?: PageNode): boolean => {
    for (const node of nodes) {
      const nodePath = (node.urlPath || `/home/${node.slug}`).toLowerCase();
      if (nodePath === lowerPath) {
        siblings = parent ? (parent.children || []) : nodes;
        return true;
      }
      if (node.children && findSiblings(node.children, node)) {
        return true;
      }
    }
    return false;
  };
  findSiblings(tree);

  if (siblings.length <= 1) return;

  const currentIndex = siblings.findIndex((s) => (s.urlPath || `/home/${s.slug}`).toLowerCase() === lowerPath);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return;

  const currentItem = siblings[currentIndex];
  const targetItem = siblings[targetIndex];

  const pageOrderMap = getPageOrderMap();
  const currentOrder = currentItem.order ?? currentIndex + 1;
  const targetOrder = targetItem.order ?? targetIndex + 1;

  const currentPath = (currentItem.urlPath || `/home/${currentItem.slug}`).toLowerCase();
  const targetPath = (targetItem.urlPath || `/home/${targetItem.slug}`).toLowerCase();

  // Swap orders
  pageOrderMap[currentPath] = targetOrder;
  pageOrderMap[targetPath] = currentOrder;

  localStorage.setItem(PAGE_ORDER_MAP_KEY, JSON.stringify(pageOrderMap));
  window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
}

/**
 * Retrieve user-created or edited cards from local storage
 */
export function getCustomCards(): ComponentCard[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CARDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save or update a custom card, automatically ensuring target page is wired
 */
export function saveCustomCard(
  card: ComponentCard,
  pagePath = '/home/opencv/imageprocessing',
  holderId = '01-hnc'
): void {
  try {
    const current = getCustomCards();
    const existingIdx = current.findIndex((c) => c.id === card.id);
    const effectivePagePath = pagePath.startsWith('/home') ? pagePath : `/home/${pagePath.replace(/^\/+/, '')}`;
    const enrichedCard: ComponentCard = {
      ...card,
      holderId: holderId || '01-hnc',
      pagePath: effectivePagePath,
    };

    if (existingIdx !== -1) {
      current[existingIdx] = enrichedCard;
    } else {
      current.push(enrichedCard);
    }
    localStorage.setItem(CUSTOM_CARDS_STORAGE_KEY, JSON.stringify(current));

    // Undelete if it was previously marked as deleted
    const deletedCards = getDeletedCardIds().filter((id) => id !== card.id);
    localStorage.setItem(DELETED_CARDS_STORAGE_KEY, JSON.stringify(deletedCards));

    // Automatically ensure page hierarchy exists in registry so it is immediately visible
    try {
      const cleanSegments = effectivePagePath.replace(/^\/home\/?/, '').split('/').filter(Boolean);
      let currentPath = '/home';
      for (let i = 0; i < cleanSegments.length; i++) {
        const seg = cleanSegments[i];
        const parentPath = currentPath === '/home' ? undefined : currentPath;
        currentPath = `${currentPath}/${seg}`;
        createDynamicPage(humanizeSlug(seg), 'Documentation', parentPath);
      }
    } catch {
      // ignore
    }

    window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
  } catch (e) {
    console.error('Failed to save custom card', e);
  }
}

/**
 * Delete a card (custom or built-in)
 */
export function deleteCard(cardId: string): void {
  try {
    // Remove from custom cards
    const current = getCustomCards();
    const filtered = current.filter((c) => c.id !== cardId);
    localStorage.setItem(CUSTOM_CARDS_STORAGE_KEY, JSON.stringify(filtered));

    // Mark as deleted so built-in card is hidden
    const deleted = getDeletedCardIds();
    if (!deleted.includes(cardId)) {
      deleted.push(cardId);
      localStorage.setItem(DELETED_CARDS_STORAGE_KEY, JSON.stringify(deleted));
    }

    window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
  } catch (e) {
    console.error('Failed to delete card', e);
  }
}

export const deleteCustomCard = deleteCard;

/**
 * Move a card Up or Down within its page
 */
export function reorderCard(cardId: string, pagePath: string, direction: 'up' | 'down'): void {
  const tree = getContentRegistry();
  const lowerPath = pagePath.toLowerCase();

  const findNode = (nodes: PageNode[]): PageNode | null => {
    for (const node of nodes) {
      const nodePath = (node.urlPath || `/home/${node.slug}`).toLowerCase();
      if (nodePath === lowerPath) {
        return node;
      }
      if (node.children) {
        const found = findNode(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  const targetNode = findNode(tree);

  if (!targetNode || !targetNode.cards || targetNode.cards.length <= 1) return;

  const cards = [...targetNode.cards];
  const currentIndex = cards.findIndex((c) => c.id === cardId);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= cards.length) return;

  const currentCard = cards[currentIndex];
  const targetCard = cards[targetIndex];

  const currentOrder = currentCard.order ?? currentIndex + 1;
  const targetOrder = targetCard.order ?? targetIndex + 1;

  const orderMap = getCardOrderMap();
  orderMap[currentCard.id] = targetOrder;
  orderMap[targetCard.id] = currentOrder;
  localStorage.setItem(CARD_ORDER_MAP_KEY, JSON.stringify(orderMap));

  // Also update custom cards order if either is custom
  const customCards = getCustomCards();
  let customChanged = false;
  for (const c of customCards) {
    if (c.id === currentCard.id) {
      c.order = targetOrder;
      customChanged = true;
    } else if (c.id === targetCard.id) {
      c.order = currentOrder;
      customChanged = true;
    }
  }
  if (customChanged) {
    localStorage.setItem(CUSTOM_CARDS_STORAGE_KEY, JSON.stringify(customCards));
  }

  window.dispatchEvent(new CustomEvent('greendocs:cards-updated'));
}

/**
 * Generate a standard CardBundleManifest JSON string
 */
export function exportCardManifest(holderId: string, cards: ComponentCard[]): string {
  const manifest = {
    version: '1.0.0',
    holderId,
    updatedAt: new Date().toISOString(),
    cards: cards.map((c) => ({
      id: c.id,
      title: c.title,
      tag: c.tag,
      definition: c.definition,
      keyRule: c.keyRule,
      order: c.order,
      deepDive: c.deepDive,
      media: c.media,
    })),
  };
  return JSON.stringify(manifest, null, 2);
}

/**
 * Returns the fully hydrated and synchronized page hierarchy tree.
 * Integrates:
 * - Built-in file system pages
 * - User created dynamic pages (root or nested)
 * - Page title and ordering overrides
 * - Page deletion filters
 * - Card deletion filters
 * - Custom cards and card order overrides
 */
export function getContentRegistry(): PageNode[] {
  const deletedPagePaths = new Set(getDeletedPagePaths().map((p) => p.toLowerCase()));
  const deletedCardIds = new Set(getDeletedCardIds());
  const pageTitleMap = getPageTitleMap();
  const pageOrderMap = getPageOrderMap();
  const cardOrderMap = getCardOrderMap();
  const customCards = getCustomCards();

  // Helper to clone and hydrate a node
  const cloneAndHydrateNode = (node: PageNode): PageNode | null => {
    const effectivePath = (node.urlPath || `/home/${node.slug}`).toLowerCase();
    if (deletedPagePaths.has(effectivePath)) {
      return null;
    }

    const title = pageTitleMap[effectivePath] || node.title;
    const order = pageOrderMap[effectivePath] ?? node.order ?? 999;

    // Filter built-in cards
    const initialCards = (node.cards || []).filter((c) => !deletedCardIds.has(c.id));

    // Gather matching custom cards for this page
    const matchingCustom = customCards.filter(
      (c) =>
        (c.pagePath?.toLowerCase() === effectivePath || (!c.pagePath && effectivePath.includes('imageprocessing'))) &&
        !deletedCardIds.has(c.id)
    );

    // Merge cards by ID
    const mergedCardsMap = new Map<string, ComponentCard>();
    for (const c of initialCards) {
      mergedCardsMap.set(c.id, { ...c });
    }
    for (const c of matchingCustom) {
      mergedCardsMap.set(c.id, { ...c });
    }

    // Apply card order overrides and sort
    const finalCards = Array.from(mergedCardsMap.values()).map((card) => {
      const overriddenOrder = cardOrderMap[card.id];
      return overriddenOrder !== undefined ? { ...card, order: overriddenOrder } : card;
    });

    finalCards.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Hydrate children
    const childNodes: PageNode[] = [];
    if (node.children) {
      for (const ch of node.children) {
        const hydratedChild = cloneAndHydrateNode(ch);
        if (hydratedChild) childNodes.push(hydratedChild);
      }
    }

    childNodes.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Construct holder
    const cardHolders = [
      {
        id: '01-hnc',
        order: 1,
        cards: finalCards,
      },
    ];

    return {
      ...node,
      title,
      order,
      cards: finalCards,
      cardHolders,
      children: childNodes,
    };
  };

  // Base tree from filesystem
  const rootNodes: PageNode[] = [];
  for (const root of FILE_SYSTEM_TREE) {
    const hydrated = cloneAndHydrateNode(root);
    if (hydrated) rootNodes.push(hydrated);
  }

  // Inject dynamic pages
  const dynPages = getDynamicPages();
  for (const dp of dynPages) {
    const effectivePath = dp.urlPath.toLowerCase();
    if (deletedPagePaths.has(effectivePath)) continue;

    const title = pageTitleMap[effectivePath] || dp.title;
    const order = pageOrderMap[effectivePath] ?? dp.order ?? 999;

    // Check if matching custom cards exist for this dynamic page
    const matchingCustom = customCards
      .filter((c) => c.pagePath?.toLowerCase() === effectivePath && !deletedCardIds.has(c.id))
      .map((c) => {
        const ovOrder = cardOrderMap[c.id];
        return ovOrder !== undefined ? { ...c, order: ovOrder } : c;
      })
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const dynNode: PageNode = {
      id: dp.id,
      slug: dp.slug,
      title,
      urlPath: dp.urlPath,
      category: dp.category || 'Documentation',
      order,
      summary: dp.summary,
      cards: matchingCustom,
      cardHolders: [
        {
          id: '01-hnc',
          order: 1,
          cards: matchingCustom,
        },
      ],
      children: [],
    };

    // If it has a parentUrlPath, attach as child under that parent
    if (dp.parentUrlPath && dp.parentUrlPath !== '/home') {
      const parentLower = dp.parentUrlPath.toLowerCase();
      let attached = false;
      const attachToParent = (nodes: PageNode[]) => {
        for (const n of nodes) {
          const nPath = (n.urlPath || `/home/${n.slug}`).toLowerCase();
          if (nPath === parentLower) {
            n.children = n.children || [];
            if (!n.children.some((c) => (c.urlPath || `/home/${c.slug}`).toLowerCase() === effectivePath)) {
              n.children.push(dynNode);
              n.children.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            }
            attached = true;
            return;
          }
          if (n.children) attachToParent(n.children);
          if (attached) return;
        }
      };
      attachToParent(rootNodes);
      if (!attached) {
        // If parent not found, attach at root
        if (!rootNodes.some((n) => (n.urlPath || `/home/${n.slug}`).toLowerCase() === effectivePath)) {
          rootNodes.push(dynNode);
        }
      }
    } else {
      // Root level dynamic page
      if (!rootNodes.some((n) => (n.urlPath || `/home/${n.slug}`).toLowerCase() === effectivePath)) {
        rootNodes.push(dynNode);
      }
    }
  }

  rootNodes.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return rootNodes;
}

/**
 * Alias for getContentRegistry for API symmetry with documentation.
 */
export const getRootPages = getContentRegistry;

/**
 * Returns a flat array of all pages in the hierarchy, including dynamic pages
 */
export function getAllFlatPages(): { title: string; urlPath: string; slug: string; level: number }[] {
  const list: { title: string; urlPath: string; slug: string; level: number }[] = [];
  const nodes = getContentRegistry();

  const walk = (items: PageNode[], level = 0) => {
    for (const item of items) {
      const path = item.urlPath || `/home/${item.slug}`;
      if (!list.some((p) => p.urlPath.toLowerCase() === path.toLowerCase())) {
        list.push({
          title: item.title,
          urlPath: path,
          slug: item.slug,
          level,
        });
      }
      if (item.children && item.children.length > 0) {
        walk(item.children, level + 1);
      }
    }
  };
  walk(nodes, 0);
  return list;
}

/**
 * Returns a flat array of all cards across the system
 */
export function getAllFlatCards(): {
  card: ComponentCard;
  pageTitle: string;
  pagePath: string;
  holderId: string;
}[] {
  const result: {
    card: ComponentCard;
    pageTitle: string;
    pagePath: string;
    holderId: string;
  }[] = [];

  const walk = (nodes: PageNode[]) => {
    for (const node of nodes) {
      if (node.cards) {
        for (const card of node.cards) {
          result.push({
            card,
            pageTitle: node.title,
            pagePath: node.urlPath || `/home/${node.slug}`,
            holderId: card.holderId || '01-hnc',
          });
        }
      }
      if (node.children) {
        walk(node.children);
      }
    }
  };
  walk(getContentRegistry());
  return result;
}

/**
 * Result structure when resolving a path against the file-system page tree.
 */
export interface ResolvedPathResult {
  node: PageNode;
  breadcrumbs: { label: string; path: string }[];
  currentPath: string;
}

/**
 * Recursively resolves URL path segments against the complete page tree.
 * Fully case-insensitive segment resolution with custom card injection.
 */
export function resolvePathNode(
  pathSegments: string[],
  nodes?: PageNode[],
  parentPath = '/home',
  parentCrumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/home' }]
): ResolvedPathResult | null {
  const activeNodes = nodes || getContentRegistry();
  let sanitizedSegments = pathSegments.filter((seg) => Boolean(seg && seg.trim()));

  // Strip leading 'home' or 'dashboard' segment if passed in from URL
  if (
    sanitizedSegments.length > 0 &&
    (sanitizedSegments[0].toLowerCase() === 'home' || sanitizedSegments[0].toLowerCase() === 'dashboard')
  ) {
    sanitizedSegments = sanitizedSegments.slice(1);
  }

  if (sanitizedSegments.length === 0) {
    return null;
  }

  const [currentSegment, ...remainingSegments] = sanitizedSegments;
  const currentLower = currentSegment.toLowerCase().trim();
  const matchedNode = activeNodes.find((n) => n.slug.toLowerCase() === currentLower);

  if (!matchedNode) {
    return null;
  }

  const currentPath = `${parentPath}/${matchedNode.slug}`;
  const effectivePath = matchedNode.urlPath || currentPath;
  const breadcrumbs = [...parentCrumbs, { label: matchedNode.title, path: effectivePath }];

  if (remainingSegments.length === 0) {
    return {
      node: matchedNode,
      breadcrumbs,
      currentPath: effectivePath,
    };
  }

  if (matchedNode.children && matchedNode.children.length > 0) {
    return resolvePathNode(remainingSegments, matchedNode.children, effectivePath, breadcrumbs);
  }

  return null;
}

/**
 * Convenience method to resolve any full URL pathname directly in O(1) time.
 * @param path - URL pathname (e.g. "/opencv/imageprocessing")
 */
export function getPageByPath(path: string): ResolvedPathResult | null {
  const segments = path.split('/').filter(Boolean);
  return resolvePathNode(segments);
}
