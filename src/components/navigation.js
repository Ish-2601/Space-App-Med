export const GROUPS = [
  {
    id: "today",
    label: "Today",
    icon: "today",
    pages: ["today", "checkin", "log", "quests", "checks"],
  },
  {
    id: "body",
    label: "Body",
    icon: "body",
    pages: ["body", "trends", "radiation", "photos"],
  },
  {
    id: "medguide",
    label: "Help",
    icon: "help",
    pages: ["medguide", "medkit", "checklists"],
  },
  {
    id: "crewHub",
    label: "Crew",
    icon: "crew",
    pages: ["crewHub", "crew", "earth", "habitat", "mind"],
  },
  {
    id: "more",
    label: "More",
    icon: "more",
    pages: ["more", "mission", "learn"],
  },
];
export const activeGroup = (page) =>
  GROUPS.find((g) => g.pages.includes(page))?.id;
