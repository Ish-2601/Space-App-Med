import React from "react";
import { useStore, tasksFor, streak, points, badgesFor } from "../backend/api.js";

const QUEST_PAGE = { checkin: "checkin", exercise: "log", water: "log", meds: "log", checks: "checks", journal: "mind" };

export default function Quests({ person, go }) {
  const state = useStore();
  const pid = person.id;
  const tasks = tasksFor(state, pid);
  const done = tasks.filter((t) => t.done).length;
  const crewBoard = state.crew.map((p) => ({ p, pts: points(state, p.id) })).sort((a, b) => b.pts - a.pts);

  return (
    <div>
      <h2>Quests</h2>
      <p>Daily quests are NASA countermeasures. Doing them keeps your bones, heart, sleep and mind healthy.</p>
      <div className="grid3">
        <div className="card stat"><div className="muted small">Today</div><div className="big-ish">{done}/{tasks.length} done</div></div>
        <div className="card stat"><div className="muted small">Check-in streak</div><div className="big-ish">🔥 {streak(state, pid)} days</div></div>
        <div className="card stat"><div className="muted small">Points</div><div className="big-ish">⭐ {points(state, pid)}</div></div>
      </div>

      <h3>Today's quests</h3>
      <ul className="tasks">
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            {t.done ? "✅" : "⬜"} {t.label} <span className="muted small">+{t.points}</span>
            {!t.done && QUEST_PAGE[t.id] && <button className="btn small" onClick={() => go(QUEST_PAGE[t.id])}>Go</button>}
          </li>
        ))}
      </ul>
      <p className="muted small">Exercise, water and sleep also count minutes and drinks from your sensors.</p>

      <h3>Badges</h3>
      <div className="badges">
        {badgesFor(state, pid).map((b) => (
          <span key={b.id} className={"badge-item" + (b.earned ? " earned" : "")}>{b.earned ? "🏅" : "🔒"} {b.label}</span>
        ))}
      </div>

      <h3>Crew leaderboard</h3>
      <ol>{crewBoard.map(({ p, pts }) => <li key={p.id}>{p.name}: {pts} pts</li>)}</ol>
    </div>
  );
}
