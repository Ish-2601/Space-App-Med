// Scoring for the reaction self-test (psychomotor vigilance test, 3-minute "PVT-B" style).
// Lapse threshold 355 ms is the one used for the 3-minute PVT-B; responses under 100 ms are false starts.

export const PVT_DURATION_SEC = 180;
export const LAPSE_MS = 355;
export const FALSE_START_MS = 100;
export const ISI_MIN_MS = 2000;
export const ISI_MAX_MS = 5000;

// responses: [{ rt: ms }] where a press before the stimulus is recorded as { falseStart: true }
export function scorePvt(responses) {
  const valid = responses.filter((r) => !r.falseStart && r.rt >= FALSE_START_MS);
  const falseStarts = responses.filter((r) => r.falseStart || r.rt < FALSE_START_MS).length;
  if (valid.length === 0) return { trials: 0, meanRt: null, medianRt: null, speed: null, lapses: 0, falseStarts };
  const rts = valid.map((r) => r.rt).sort((a, b) => a - b);
  const meanRt = rts.reduce((a, b) => a + b, 0) / rts.length;
  const medianRt = rts[Math.floor(rts.length / 2)];
  // response speed = mean of 1000/RT: the measure most sensitive to sleep loss
  const speed = rts.reduce((a, rt) => a + 1000 / rt, 0) / rts.length;
  const lapses = rts.filter((rt) => rt > LAPSE_MS).length;
  return {
    trials: valid.length,
    meanRt: Math.round(meanRt),
    medianRt: Math.round(medianRt),
    speed: Math.round(speed * 100) / 100,
    lapses,
    falseStarts,
  };
}

export function randomIsi(rand = Math.random) {
  return ISI_MIN_MS + rand() * (ISI_MAX_MS - ISI_MIN_MS);
}
