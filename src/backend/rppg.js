// Camera heart rate (remote photoplethysmography).
// Each heartbeat pushes blood into the skin, which changes its colour very slightly.
// We average a colour channel over a region of each video frame, then find the strongest
// rhythm between 42 and 210 beats per minute.

const FS = 30; // resample rate (Hz)
export const MIN_FPS = 8; // below this, a 1-3.5 Hz pulse can alias to a wrong rate

function resample(samples) {
  const t0 = samples[0].t;
  const dur = (samples[samples.length - 1].t - t0) / 1000;
  const n = Math.floor(dur * FS);
  const y = new Float64Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + (i * 1000) / FS;
    while (j < samples.length - 2 && samples[j + 1].t < t) j++;
    const a = samples[j];
    const b = samples[j + 1];
    const f = b.t === a.t ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    y[i] = a.v + (b.v - a.v) * f;
  }
  return y;
}

function detrend(y) {
  const n = y.length;
  const half = FS / 2;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let k = Math.max(0, i - half); k < Math.min(n, i + half); k++) {
      s += y[k];
      c++;
    }
    out[i] = y[i] - s / c;
  }
  return out;
}

// samples: [{ t: milliseconds, v: mean channel value }]
// returns { bpm, quality (0-1), label } or null if there isn't enough data
export function estimateBpm(samples, { minHz = 0.7, maxHz = 3.5 } = {}) {
  if (!samples || samples.length < 2) return null;
  const durationSec = (samples[samples.length - 1].t - samples[0].t) / 1000;
  if (durationSec < 5) return null;
  // Real camera frames: count how often the value actually changes (repeated values = same frame drawn twice)
  let changes = 0;
  for (let i = 1; i < samples.length; i++) if (samples[i].v !== samples[i - 1].v) changes++;
  const fps = changes / durationSec;
  if (fps < MIN_FPS) return { bpm: null, quality: 0, label: "poor", fps, reason: `Camera only delivered ${Math.round(fps)} frames per second (need ${MIN_FPS}+). Close other apps and try again.` };
  const d = detrend(resample(samples));
  const n = d.length;
  const spectrum = [];
  let total = 0;
  for (let f = minHz; f <= maxHz + 1e-9; f += 0.01) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); // Hann window
      const a = (2 * Math.PI * f * i) / FS;
      re += d[i] * w * Math.cos(a);
      im -= d[i] * w * Math.sin(a);
    }
    const p = re * re + im * im;
    spectrum.push({ f, p });
    total += p;
  }
  if (total === 0) return { bpm: null, quality: 0, label: "no signal" };
  const peak = spectrum.reduce((m, s) => (s.p > m.p ? s : m));
  const near = spectrum.filter((s) => Math.abs(s.f - peak.f) <= 0.1).reduce((a, s) => a + s.p, 0);
  const quality = near / total;
  return { bpm: Math.round(peak.f * 60), quality, label: qualityLabel(quality), fps };
}

export function qualityLabel(q) {
  if (q >= 0.4) return "good";
  if (q >= 0.2) return "fair";
  return "poor";
}

// Average of one colour channel inside a region of an ImageData-like object
// region = { x0, y0, x1, y1 } as fractions of width/height; channel 0=red 1=green 2=blue
export function regionMean(img, region, channel) {
  const { width, height, data } = img;
  const xs = Math.floor(region.x0 * width);
  const xe = Math.ceil(region.x1 * width);
  const ys = Math.floor(region.y0 * height);
  const ye = Math.ceil(region.y1 * height);
  let sum = 0;
  let count = 0;
  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      sum += data[(y * width + x) * 4 + channel];
      count++;
    }
  }
  return count ? sum / count : 0;
}
