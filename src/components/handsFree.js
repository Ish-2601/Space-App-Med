export const VOICE_COMMANDS = [
  "Next step",
  "Record vitals",
  "Start timer",
  "Read aloud",
  "Open Emergency",
];

export function normalizeVoiceCommand(text) {
  const cleaned = String(text)
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^please /, "");
  return (
    VOICE_COMMANDS.find((command) => command.toLowerCase() === cleaned) || null
  );
}

export function executeMissionCommand(
  command,
  { doc, navigate, speak, startTimer },
) {
  const main =
    doc.querySelector("main") || doc.querySelector(".crew-select") || doc;
  if (command === "Open Emergency") {
    navigate("emergency");
    return "Emergency catalog opened. Choose the patient and protocol.";
  }
  if (command === "Start timer") {
    startTimer();
    return "One-minute timer started. It continues while you change screens.";
  }
  if (command === "Read aloud") {
    const text = (main.innerText || main.textContent || "")
      .trim()
      .slice(0, 6000);
    return speak(text)
      ? "Reading this screen aloud."
      : "Speech output is unavailable. The same instructions remain on screen.";
  }
  if (command === "Record vitals") {
    const form = main.querySelector(
      ".protocol-vitals, .area-check-screen form",
    );
    if (form) {
      if (form.reportValidity()) {
        form.requestSubmit();
        return "Vitals submitted through the current form.";
      }
      form.querySelector("input:invalid, input")?.focus();
      return "Enter the missing vitals first. Say Record vitals again to save.";
    }
    navigate("review-heart");
    return "Heart and vital-sign review opened. Enter readings from your equipment.";
  }
  if (command === "Next step") {
    const checkbox = main.querySelector(
      '.protocol-steps input[type="checkbox"]:not(:checked):not(:disabled)',
    );
    if (checkbox) {
      checkbox.click();
      return "Current protocol step marked complete.";
    }
    const buttons = [...main.querySelectorAll("button")];
    const next = buttons.find(
      (button) =>
        !button.disabled &&
        !button.hidden &&
        (button.matches("[data-voice-next], .question-actions .btn.primary") ||
          /^(next\b|continue\b|done with .*eye)/i.test(
            button.textContent.trim(),
          )),
    );
    if (next) {
      next.click();
      return "Next step requested. Check the screen for any required answer.";
    }
    return "No available next step on this screen. Open a check-in or protocol first.";
  }
  return "Command not recognized. Choose one of the five command buttons.";
}
