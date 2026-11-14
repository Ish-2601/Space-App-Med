// Near vision chart maths (tumbling E, logMAR scale).
// A letter at logMAR 0 ("20/20") is 5 arcminutes tall at the viewing distance.

export const NEAR_DISTANCE_MM = 400; // 40 cm
export const CARD_WIDTH_MM = 85.6; // standard ID / credit card width, used to calibrate the screen
export const DEFAULT_PX_PER_MM = 96 / 25.4; // CSS reference pixel if not calibrated
export const LINES = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0];
export const LETTERS_PER_LINE = 5;
export const PASS_CORRECT = 3; // a line passes with 3 of 5 correct
export const DIRECTIONS = ["right", "down", "left", "up"];

export function optotypeMm(logMAR, distanceMm = NEAR_DISTANCE_MM) {
  return distanceMm * Math.tan(((5 / 60) * Math.PI) / 180) * 10 ** logMAR;
}

export function optotypePx(logMAR, pxPerMm = DEFAULT_PX_PER_MM, distanceMm = NEAR_DISTANCE_MM) {
  return optotypeMm(logMAR, distanceMm) * pxPerMm;
}

// Snellen-style equivalent, e.g. logMAR 0.3 -> "20/40"
export function snellen(logMAR) {
  return `20/${Math.round(20 * 10 ** logMAR)}`;
}

// The smallest line we can draw reliably (at least 5 screen pixels tall)
export function smallestDrawableLine(pxPerMm, dpr = 1) {
  return LINES.filter((l) => optotypePx(l, pxPerMm) * dpr >= 5).pop() ?? LINES[0];
}
