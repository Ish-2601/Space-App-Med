import React, { useState } from "react";
import CrewAvatar from "./CrewAvatar.jsx";
import { useStore, envOf, activeEvent, delayText } from "../backend/api.js";
import { Brand, Icon } from "./ConsoleUI.jsx";
import { GROUPS, activeGroup } from "./navigation.js";

export default function ConsoleShell({
  person,
  page,
  go,
  onSwitch,
  onOpenPerson,
  children,
}) {
  const state = useStore();
  const [menu, setMenu] = useState(false);
  const env = envOf(state);
  const ev = activeEvent(state);
  const unread = state.notifications.filter((n) => !n.read).length;
  const queued = state.reports.filter((r) => r.status === "queued").length;
  return (
    <div className="console-app">
      <header className="console-topbar">
        <button
          className="brand-button"
          onClick={() => go("today")}
          aria-label="NASA Med home"
        >
          <Brand />
        </button>
        <div className="console-telemetry">
          <span className="telemetry-chip">
            <Icon name="orbit" />
            {state.mission.name} · Day {state.mission.day}
          </span>
          <button className="telemetry-chip" onClick={() => go("earth")}>
            <i
              className={`signal-light ${state.link.online ? "" : "offline"}`}
            />
            {state.link.online ? "Link up" : "Offline"}
            {queued > 0 && ` · ${queued} queued`}
          </button>
          <span className="telemetry-chip delay-chip">
            <Icon name="clock" />
            Earth delay {delayText(env)}
          </span>
        </div>
        <div className="console-account">
          <button
            className="icon-button notification-button"
            onClick={() => go("crew")}
            aria-label={`Notifications, ${unread} unread`}
          >
            <Icon name="bell" />
            {unread > 0 && <span>{unread}</span>}
          </button>
          <div className="profile-menu">
            <button
              className="profile-toggle"
              aria-label={"Switch profile, current: " + person.name}
              aria-expanded={menu}
              aria-controls="profile-options"
              onClick={() => setMenu(!menu)}
            >
              <CrewAvatar person={person} compact />
              <span>
                <b>{person.name}</b>
                <small>{person.role}</small>
              </span>
              <Icon name="down" size={15} />
            </button>
            {menu && (
              <div className="profile-options" id="profile-options">
                {state.crew.map((p) => (
                  <button
                    key={p.id}
                    aria-current={p.id === person.id ? "true" : undefined}
                    onClick={() => {
                      setMenu(false);
                      onOpenPerson(p.id);
                    }}
                  >
                    {p.name}
                    <small>{p.role}</small>
                  </button>
                ))}
                <button onClick={onSwitch}>
                  Back to crew lobby <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {ev && (
        <div className="console-banner" role="alert">
          <Icon name="sun" />
          <span>
            <b>Solar storm.</b>{" "}
            {ev.sheltered[person.id]
              ? "You are sheltered. Stay until the all-clear."
              : "Go to the storm shelter now."}
          </span>
          <button className="btn" onClick={() => go("radiation")}>
            Open shelter checklist <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
      {state.habitat.fault && (
        <div className="console-banner" role="alert">
          <Icon name="air" />
          <span>CO₂ scrubber fault. Cabin CO₂ is above the limit.</span>
          <button className="btn" onClick={() => go("habitat")}>
            View habitat
          </button>
        </div>
      )}
      <main className={`console-main route-${page}`}>{children}</main>
      <footer className="console-footer">
        NASA Space Apps prototype <span>·</span> Simulated data <span>·</span>{" "}
        Not medical advice
      </footer>
      <nav className="console-dock" aria-label="Main navigation">
        <span className="dock-coordinate">
          ONBOARD SYSTEMS <i /> {state.mission.environment.toUpperCase()}
        </span>
        <div className="dock-pages">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              className={`dock-item ${activeGroup(page) === g.id ? "active" : ""}`}
              aria-current={activeGroup(page) === g.id ? "page" : undefined}
              onClick={() => {
                setMenu(false);
                go(g.id);
              }}
            >
              <Icon name={g.icon} />
              <span>{g.label}</span>
            </button>
          ))}
        </div>
        <button
          className={`dock-emergency ${page === "emergency" ? "active" : ""}`}
          aria-label="Emergency"
          onClick={() => go("emergency")}
        >
          <Icon name="emergency" />
          <span>Emergency</span>
        </button>
      </nav>
    </div>
  );
}
