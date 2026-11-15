export const GROUPS = [
  {
    id: "today",
    label: "Home",
    icon: "home",
    pages: ["today", "checkin", "log", "quests", "checks"],
  },
  {
    id: "body",
    label: "Body",
    icon: "body",
    pages: ["body", "bodyReview", "trends", "radiation", "photos", "mind"],
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: "alert",
    pages: ["emergency"],
  },
  {
    id: "users",
    label: "Users",
    icon: "crew",
    pages: [],
  },
];
export const activeGroup = (page) =>
  page.startsWith("body-") || page.startsWith("review-")
    ? "body"
    : GROUPS.find((g) => g.pages.includes(page))?.id;
