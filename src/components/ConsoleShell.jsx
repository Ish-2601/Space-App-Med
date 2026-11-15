import React, { useState } from "react";
import CrewAvatar from "./CrewAvatar.jsx";
import {
  useStore,
  envOf,
  activeEvent,
  activeEmergencies,
  delayText,
} from "../backend/api.js";
import { Brand, Icon } from "./ConsoleUI.jsx";
import { GROUPS, activeGroup } from "./navigation.js";
import { getDisplay, setDisplay } from "../display.js";

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
  const [display, setDisp] = useState(getDisplay);
  const env = envOf(state);
  const ev = activeEvent(state);
  const emergencies = activeEmergencies(state);
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
            className="icon-button"
            onClick={() => go("more")}
            aria-label="All tools and settings"
            title="All tools and settings"
          >
            <Icon name="more" />
          </button>
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
                <div
                  className="display-toggles"
                  role="group"
                  aria-label="Display"
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={display.night}
                      onChange={(e) =>
                        setDisp(setDisplay({ night: e.target.checked }))
                      }
                    />
                    Night mode <small>Dim red light for sleep periods</small>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={display.large}
                      onChange={(e) =>
                        setDisp(setDisplay({ large: e.target.checked }))
                      }
                    />
                    Larger text{" "}
                    <small>Easier to read with vibration or tired eyes</small>
                  </label>
                </div>
                <button onClick={onSwitch}>
                  Back to crew lobby <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {emergencies.map((em) => (
        <div className="console-banner" role="alert" key={em.id}>
          <Icon name="alert" />
          <span>
            <b>
              {em.simulated ? "Emergency simulation" : "Emergency"}: {em.title}.
            </b>{" "}
            {state.crew.find((p) => p.id === em.pid)?.name} · Protocol active
          </span>
          <button
            className="btn"
            onClick={() => go("emergency", { emergencyId: em.id })}
          >
            Open protocol <Icon name="arrow" size={16} />
          </button>
        </div>
      ))}
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
                if (g.id === "users") onSwitch();
                else if (page !== g.id) go(g.id);
              }}
            >
              <Icon name={g.icon} />
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
