/**
 * Interaction and Gesture Constants
 * Single source of truth for UI thresholds, dampening factors, and limits.
 */

/** Default minimum pixel travel required to register a horizontal swipe navigation gesture */
export const DEFAULT_SWIPE_THRESHOLD = 55;

/** Default dampening factor applied to touch/mouse drag inertia resistance */
export const DEFAULT_DRAG_RESISTANCE = 0.45;

/** Maximum character length allowed for single-line note terminal inputs */
export const MAX_NOTE_INPUT_LENGTH = 300;

/** Default prompt glyph character displayed in terminal inputs */
export const DEFAULT_PROMPT_GLYPH = '>';
