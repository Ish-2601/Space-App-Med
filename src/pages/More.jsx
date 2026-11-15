import React from "react";
import { PageTitle, Panel, Icon } from "../components/ConsoleUI.jsx";
const links = [
  [
    "summary",
    "journal",
    "Health summary",
    "One page for the flight surgeon: print, save as PDF or send",
  ],
  [
    "trends",
    "star",
    "Trends and patterns",
    "Your readings over time and patterns in your own data",
  ],
  ["learn", "book", "Learn", "NASA's hazards, risks and research"],
  [
    "mission",
    "more",
    "Demo controls",
    "Environment, events and the Earth link",
  ],
  [
    "crew",
    "medical",
    "Crew medical officer view",
    "Whole-crew health and notifications",
  ],
  [
    "checks",
    "medical",
    "All medical checks",
    "Camera, vision, balance and reaction tests",
  ],
  ["log", "exercise", "Log activity", "Workouts, water and supplements"],
  [
    "quests",
    "star",
    "Streaks and quests",
    "Your progress and the crew leaderboard",
  ],
  ["photos", "camera", "Photo log", "Capture, compare and share health photos"],
];
export default function More({ go, onSwitch }) {
  return (
    <>
      <PageTitle
        eyebrow="More"
        title="Your mission, at a glance"
        description="Everything you need. Even when Earth is far away."
      />
      <Panel title="More" className="directory-grid">
        {links.map(([page, icon, title, sub]) => (
          <button
            key={page}
            className="directory-item"
            onClick={() => go(page)}
          >
            <span className="icon-tile">
              <Icon name={icon} />
            </span>
            <span>
              <b>{title}</b>
              <small>{sub}</small>
            </span>
            <Icon name="arrow" size={18} />
          </button>
        ))}
        <button className="directory-item" onClick={onSwitch}>
          <span className="icon-tile">
            <Icon name="crew" />
          </span>
          <span>
            <b>Switch crew member</b>
            <small>Back to the crew lobby</small>
          </span>
          <Icon name="arrow" size={18} />
        </button>
      </Panel>
    </>
  );
}
