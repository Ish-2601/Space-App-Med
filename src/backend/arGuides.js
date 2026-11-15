export const AR_GUIDES = {
  onsd: {
    title: "Ocular ONSD ultrasound probe guide",
    targetX: 50,
    targetY: 42,
    angle: 0,
    kind: "probe",
    note: "Training alignment only. Ocular ultrasound requires trained operators, an eye-safe preset and the mission's approved procedure. A camera cannot measure ONSD.",
  },
  bladder: {
    title: "Bladder self-ultrasound probe guide",
    targetX: 50,
    targetY: 68,
    angle: 15,
    kind: "probe",
    note: "Training alignment only. Locate the suprapubic scan plane with a trained operator and the approved ultrasound protocol. This overlay does not locate organs or measure bladder volume.",
  },
  iris: {
    title: "Pupillometry & nystagmus iris-tracking rings",
    targetX: 50,
    targetY: 42,
    angle: 0,
    kind: "eyes",
    note: "Manually align the rings. Pupil and eye-movement observations need calibrated equipment and clinical interpretation; this guide does not detect nystagmus or diagnose a neurological problem.",
  },
  pulse: {
    title: "Contactless rPPG forehead / cheek ROI",
    targetX: 50,
    targetY: 35,
    angle: 0,
    kind: "pulse",
    note: "Keep still in even light. These regions show where a camera pulse algorithm samples skin colour; alignment alone cannot confirm a usable pulse signal.",
  },
};

export function guideAlignment(id, values) {
  const guide = AR_GUIDES[id];
  if (!guide) throw new Error("Choose an available camera guide.");
  const { x, y, angle } = values;
  if (
    ![x, y, angle].every(Number.isFinite) ||
    x < 0 ||
    x > 100 ||
    y < 0 ||
    y > 100 ||
    angle < -45 ||
    angle > 45
  )
    throw new Error(
      "Alignment must use valid coordinates and an angle between −45° and 45°.",
    );
  const distance = Math.hypot(x - guide.targetX, y - guide.targetY);
  const angleError = Math.abs(angle - guide.angle);
  return {
    aligned: distance <= 6 && angleError <= 5,
    distance: Math.round(distance * 10) / 10,
    angleError,
  };
}
