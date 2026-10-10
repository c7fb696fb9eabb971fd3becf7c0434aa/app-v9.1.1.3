/**
 * Application-wide pagination and windowing constants.
 * Enforces strict memory and rendering boundaries.
 */

/** Maximum items rendered per view page */
export const ITEMS_PER_PAGE = 10;

/** Default padding digits for sequential step numbering (e.g. 01, 02) */
export const DEFAULT_PADDING_DIGITS = 2;

/**
 * Formats a 1-based numerical index into a zero-padded string representation.
 * @param index - The 1-based index (e.g. 1 -> "01", 12 -> "12")
 * @param digits - Minimum digits padding (defaults to 2)
 */
export function formatStepNumber(index: number, digits: number = DEFAULT_PADDING_DIGITS): string {
  return String(index).padStart(digits, '0');
}
