import React from "react";
import { useStore } from "../../backend/store.js";
import { rowFor } from "../../backend/rules.js";
import { sandboxEnabled } from "../../backend/sandbox.js";
import { ThoughtWizard, SensoryLauncher } from "./MentalTools.jsx";
import {
  EyesTools,
  VestibularTools,
  HeartTools,
  RespiratoryTools,
} from "./SystemsA.jsx";
import {
  ImmuneTools,
  FoodAnalyzer,
  KidneyTools,
  MuscleTools,
  RadiationTools,
} from "./SystemsB.jsx";

export const SPECIALIZED_SYSTEMS = [
  "brain",
  "eyes",
  "vestibular",
  "heart",
  "lungs",
  "immune",
  "gut",
  "kidneys",
  "bones",
  "wholeBody",
];
export default function SpecializedTools({ person, partKey, go }) {
  const state = useStore(),
    pid = person.id,
    row = rowFor(state, pid);
  const props = { pid, row, go };
  return (
    <div
      className="specialized-tools"
      key={`${pid}-${partKey}-${sandboxEnabled(state)}`}
    >
      <div className="clinical-intro">
        <p className="eyebrow">Specialized mission tools</p>
        <p>
          {sandboxEnabled(state)
            ? "Private Sandbox: entries stay separate from crew scores, notifications and Earth reports unless you explicitly share a critical finding."
            : "Local prototype workflows · entries are saved per crew member. Models and demonstration readings are labeled in each tool."}
        </p>
      </div>
      {partKey === "brain" && (
        <>
          <ThoughtWizard pid={pid} />
          <SensoryLauncher pid={pid} />
        </>
      )}
      {partKey === "eyes" && <EyesTools {...props} />}
      {partKey === "vestibular" && <VestibularTools {...props} />}
      {partKey === "heart" && <HeartTools {...props} />}
      {partKey === "lungs" && <RespiratoryTools {...props} />}
      {partKey === "immune" && <ImmuneTools {...props} />}
      {partKey === "gut" && <FoodAnalyzer {...props} />}
      {partKey === "kidneys" && <KidneyTools {...props} />}
      {partKey === "bones" && <MuscleTools {...props} />}
      {partKey === "wholeBody" && <RadiationTools {...props} />}
    </div>
  );
}
