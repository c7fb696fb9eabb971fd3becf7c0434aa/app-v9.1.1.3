export const CONTENT_LIMITS = Object.freeze({
  titleCharacters: 160,
  tagCharacters: 80,
  descriptionCharacters: 2_000,
  definitionCharacters: 10_000,
  keyRuleCharacters: 5_000,
  codeOrSpecCharacters: 20_000,
  attachmentLabelCharacters: 160,
  orderValue: 1_000_000,
  attachmentsPerCard: 20,
  mutationsPerPublish: 500,
  assetBytes: 10 * 1024 * 1024,
  publishRequestBytes: 28 * 1024 * 1024,
});

export const SUPPORTED_ASSET_TYPES = Object.freeze({
  image: Object.freeze(['image/jpeg', 'image/png', 'image/webp']),
  audio: Object.freeze(['audio/mpeg', 'audio/ogg', 'audio/wav']),
  video: Object.freeze(['video/mp4', 'video/webm']),
  pdf: Object.freeze(['application/pdf']),
});

const assetExtensions = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
});

export function assetExtensionForMimeType(mimeType) {
  return assetExtensions[mimeType];
}

export function normalizeSlug(title) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}
