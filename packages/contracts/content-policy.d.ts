export declare const CONTENT_LIMITS: Readonly<{
  titleCharacters: 160;
  tagCharacters: 80;
  descriptionCharacters: 2000;
  definitionCharacters: 10000;
  keyRuleCharacters: 5000;
  codeOrSpecCharacters: 20000;
  attachmentLabelCharacters: 160;
  orderValue: 1000000;
  attachmentsPerCard: 20;
  mutationsPerPublish: 500;
  assetBytes: 10485760;
  publishRequestBytes: 29360128;
}>;

export declare const SUPPORTED_ASSET_TYPES: Readonly<{
  image: readonly ['image/jpeg', 'image/png', 'image/webp'];
  audio: readonly ['audio/mpeg', 'audio/ogg', 'audio/wav'];
  video: readonly ['video/mp4', 'video/webm'];
  pdf: readonly ['application/pdf'];
}>;

export declare function assetExtensionForMimeType(mimeType: string): string | undefined;
export declare function normalizeSlug(title: string): string;
