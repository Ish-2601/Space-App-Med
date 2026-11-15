// The address bar mirrors where you are: #/ (lobby), #/cmo/<page>, #/<crew id>/<page>.
// Refreshing keeps your screen and the browser back button works.
export function parseHash(hash = window.location.hash) {
  const [who = "", page = ""] = hash.replace(/^#\/?/, "").split("/");
  return { who, page };
}

export function setHash(who, page, replace = false) {
  const h = who ? `#/${who}${page ? "/" + page : ""}` : "#/";
  if (window.location.hash === h) return;
  if (replace) window.history.replaceState(null, "", h);
  else window.history.pushState(null, "", h);
  window.dispatchEvent(new Event("routechange")); // tell App the route changed
}
