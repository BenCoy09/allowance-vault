"use strict";
/* ============ utilities, state, logo, background, router ============ */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KEY = "av.v1";
const S = {
  prefs: { density: "comfortable", motion: "system", bg: true, confirmRevoke: true, hideAmounts: false, labDetail: true },
  vaults: [], agents: [], log: [], session: null,
};
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (j) { Object.assign(S.prefs, j.prefs || {}); S.vaults = j.vaults || []; S.agents = j.agents || []; }
  } catch (e) { /* storage unavailable: run without it */ }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify({ prefs: S.prefs, vaults: S.vaults, agents: S.agents })); } catch (e) { /* ignore */ } }
function resetSession(params) { S.session = AV.newVault(Object.assign({ name: "Demo vault" }, params || {})); }
resetSession();

const sats = n => S.prefs.hideAmounts ? "•••• sats" : AV.fmtShort(n);
const satsFull = n => S.prefs.hideAmounts ? "•••• sats" : AV.fmt(n);
const pill = (kind, text) => '<span class="pill ' + kind + '">' + esc(text) + "</span>";
const STATUS = {
  implemented: () => pill("ok", "Implemented"), simulated: () => pill("info", "Simulated"),
  planned: () => pill("violet", "Planned"), unverified: () => pill("warn", "Unverified"),
};
const stamp = d => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ---------- icons ---------- */
const ICONS = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  vault: "M12 2l8 4.5v9L12 20l-8-4.5v-9z M12 9v4",
  plus: "M12 5v14M5 12h14",
  agent: "M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21a8 8 0 0 1 16 0",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h10",
  code: "M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14",
  faq: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 .8-1.5-1L15 4h-4l-.5 2.8-1.5 1L7 7l-2 4 2 1v2l-2 1 2 4 2-.8 1.5 1L11 22h4l.5-2.8 1.5-1 2 .8 2-4-2-1z",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  box: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  key: "M8 15a4 4 0 1 1 3.8-5H21v3h-2v2h-3v-2h-4.2A4 4 0 0 1 8 15z",
  hourglass: "M7 3h10M7 21h10M8 3c0 5 4 5 4 9s-4 4-4 9M16 3c0 5-4 5-4 9s4 4 4 9",
};
const icon = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICONS[n] || "") + '"/></svg>';

/* ---------- logo: original mark. A hexagonal vault with an open ring (the limit) around a coin core. ---------- */
let logoN = 0;
function logo(o) {
  o = o || {}; const id = "lg" + (++logoN); const stroke = o.mono ? "currentColor" : "url(#" + id + ")";
  const grad = o.mono ? "" : '<defs><linearGradient id="' + id + '" x1="4" y1="3" x2="36" y2="37"><stop offset="0" stop-color="#e8c777"/><stop offset="1" stop-color="#9fb7c4"/></linearGradient></defs>';
  const cls = o.animated ? ' class="logo-draw"' : "";
  const core = o.mono ? "currentColor" : "#9fb7c4";
  return '<svg viewBox="0 0 40 40" width="' + (o.size || 30) + '" height="' + (o.size || 30) + '"' + cls + ' role="img" aria-label="Allowance Vault logo" fill="none">' + grad +
    '<path class="d" d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5Z" stroke="' + stroke + '" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path class="d" d="M27 14.2A8.4 8.4 0 1 0 28.4 20" stroke="' + stroke + '" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle class="core" cx="20" cy="20" r="2.9" fill="' + core + '"/></svg>';
}
function setFavicon() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="9" fill="#101311"/><defs><linearGradient id="g" x1="4" y1="3" x2="36" y2="37"><stop offset="0" stop-color="#e8c777"/><stop offset="1" stop-color="#9fb7c4"/></linearGradient></defs><path d="M20 5L33 12.3V27.7L20 35L7 27.7V12.3Z" stroke="url(#g)" stroke-width="2.6" stroke-linejoin="round"/><path d="M26 15A7.4 7.4 0 1 0 27.4 20" stroke="url(#g)" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="20" r="2.6" fill="#9fb7c4"/></svg>';
  let l = document.querySelector('link[rel="icon"]');
  if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); }
  l.type = "image/svg+xml"; l.href = "data:image/svg+xml," + encodeURIComponent(svg);
}

/* ---------- motion + background ---------- */
function motionOn() {
  const m = S.prefs.motion;
  if (m === "reduce") return false;
  if (m === "full") return true;
  try { return !matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; }
}
function applyPrefs() {
  const r = document.documentElement;
  r.setAttribute("data-density", S.prefs.density === "compact" ? "compact" : "comfortable");
  r.setAttribute("data-motion", S.prefs.motion === "system" ? "system" : S.prefs.motion);
  startBg();
}
let bgRaf = 0, bgPts = null;
function startBg() {
  const c = $("#bg"); if (!c) return;
  cancelAnimationFrame(bgRaf);
  const ctx = c.getContext("2d");
  c.style.display = S.prefs.bg ? "block" : "none";
  if (!S.prefs.bg) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const W = c.width = Math.floor(innerWidth * dpr), H = c.height = Math.floor(innerHeight * dpr);
  const n = innerWidth < 700 ? 28 : 52;
  bgPts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22 * dpr, vy: (Math.random() - .5) * .22 * dpr }));
  const link = 150 * dpr;
  function frame(move) {
    ctx.clearRect(0, 0, W, H);
    for (const p of bgPts) {
      if (move) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
      ctx.fillStyle = "rgba(217,164,65,.55)"; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * dpr, 0, 6.283); ctx.fill();
    }
    for (let i = 0; i < bgPts.length; i++) for (let j = i + 1; j < bgPts.length; j++) {
      const a = bgPts[i], b = bgPts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < link) { ctx.strokeStyle = "rgba(159,183,196," + (0.16 * (1 - d / link)).toFixed(3) + ")"; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
  }
  if (!motionOn()) { frame(false); return; }
  (function loop() { if (!document.hidden) frame(true); bgRaf = requestAnimationFrame(loop); })();
}
let rz = 0; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(startBg, 250); });

/* ---------- toast + modal ---------- */
let toastT = 0;
function toast(msg) {
  const t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
}
let modalResolve = null, modalPrev = null;
function confirmBox(title, body, okLabel, danger) {
  return new Promise(res => {
    modalResolve = res; modalPrev = document.activeElement;
    const m = $("#modal");
    m.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">' + esc(title) + '</h3><p class="muted">' + esc(body) + '</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="modalNo">Cancel</button><button class="btn ' + (danger ? "danger" : "primary") + '" data-a="modalYes">' + esc(okLabel) + "</button></div></div>";
    m.classList.add("open"); const b = $('[data-a="modalNo"]', m); if (b) b.focus();
  });
}
function closeModal(v) {
  $("#modal").classList.remove("open"); $("#modal").innerHTML = "";
  const r = modalResolve; modalResolve = null; if (modalPrev && modalPrev.focus) { try { modalPrev.focus(); } catch (e) { /* gone */ } }
  if (r) r(v);
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modalResolve) closeModal(false);
  if (e.key === "Tab" && modalResolve) {
    const f = $$("button", $("#modal")); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- copy ---------- */
function copyText(text, ok) {
  const fallback = () => {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    let done = false; try { done = document.execCommand("copy"); } catch (e) { /* ignore */ } ta.remove(); toast(done ? (ok || "Copied") : "Select the text and copy it manually");
  };
  try { navigator.clipboard.writeText(text).then(() => toast(ok || "Copied"), fallback); } catch (e) { fallback(); }
}
function code(lang, text, label) {
  let h = esc(text).replace(/^(\s*)(\/\/.*|#.*)$/gm, '$1<span class="tk-c">$2</span>');
  return '<div class="codeblock"><div class="bar2"><span>' + esc(label || lang) + '</span><button class="btn small" data-a="copy" data-t="' + esc(text).replace(/\n/g, "&#10;") + '" aria-label="Copy code">Copy</button></div><pre><code>' + h + "</code></pre></div>";
}

/* ---------- router ---------- */
const ROUTES = {};
function reg(name, title, shell, render) { ROUTES[name] = { title, shell, render }; }
function curName() { let n = (location.hash || "").replace(/^#\/?/, "").replace(/\//g, "-"); return n || "home"; }
function rerender() { const y = scrollY; render(true); scrollTo(0, y); }
function go(n) { if (curName() === n) rerender(); else location.hash = n; }

const MKT_NAV = [["home", "Product"], ["app", "Dashboard"], ["app-security", "Security Lab"], ["developers", "Developers"], ["docs", "Docs"], ["faq", "FAQ"]];
const APP_NAV = [
  ["Workspace", [["app", "Overview", "home"], ["app-vaults", "Vaults", "vault"], ["app-vaults-new", "New vault", "plus"], ["app-agents", "Agents", "agent"], ["app-security", "Security Lab", "shield"], ["app-activity", "Activity", "activity"]]],
  ["Learn", [["docs", "Docs", "book"], ["developers", "Developers", "code"], ["faq", "FAQ", "faq"]]],
  ["Settings", [["preferences", "Preferences", "gear"], ["preferences-security", "Security", "lock"]]],
];
function sectionOf(n) { return n === "home" ? "home" : n.startsWith("docs") ? "docs" : n.startsWith("app-security") ? "app-security" : n; }

function marketingShell(name, inner) {
  const cur = sectionOf(name);
  const nav = MKT_NAV.map(([k, t]) => '<a href="#' + k + '"' + (cur === k ? ' aria-current="page"' : "") + ">" + t + "</a>").join("");
  return '<a class="skip" href="#main">Skip to content</a><header class="site-head"><div class="wrap"><a class="brand" href="#home" aria-label="Allowance Vault home">' + logo({ size: 30 }) + "<span>Allowance Vault</span></a>" +
    '<button class="btn small menu-btn" data-a="menu" aria-expanded="false" aria-controls="mnav">Menu</button><nav class="nav" id="mnav" aria-label="Primary">' + nav + '</nav><a class="btn primary small" href="#app-security">Try to break it</a></div></header>' +
    '<main id="main" tabindex="-1">' + inner + "</main>" + footer();
}
function footer() {
  return '<footer class="site-foot"><div class="wrap"><div class="cols"><div><a class="brand" href="#home">' + logo({ size: 26, mono: true }) + "<span>Allowance Vault</span></a>" +
    '<p class="muted" style="margin-top:10px">A Bitcoin Cash covenant that limits what an AI agent can spend. Built for BCH BLAZE 2026. The covenant is not deployed or audited yet.</p></div>' +
    '<div><h4>Product</h4><a href="#app">Dashboard</a><a href="#app-security">Security Lab</a><a href="#app-vaults-new">Create a vault</a></div>' +
    '<div><h4>Build</h4><a href="#developers">Developers</a><a href="#docs">Docs</a><a href="#docs-api">Contract draft</a></div>' +
    '<div><h4>Trust</h4><a href="#docs-security">Threat model</a><a href="#faq">FAQ</a><a href="#preferences-security">Security settings</a></div></div></div></footer>';
}
function appShell(name, crumbs, inner, head) {
  const side = APP_NAV.map(([g, items]) => '<div class="grp">' + g + "</div>" + items.map(([k, t, ic]) => '<a href="#' + k + '" title="' + t + '"' + (name === k ? ' aria-current="page"' : "") + ">" + icon(ic) + "<span>" + t + "</span></a>").join("")).join("");
  const cr = crumbs.map((c, i) => i === crumbs.length - 1 ? "<b>" + esc(c[1]) + "</b>" : '<a href="#' + c[0] + '">' + esc(c[1]) + "</a><span>/</span>").join("");
  return '<a class="skip" href="#main">Skip to content</a><div class="app"><aside class="side"><a class="brand" href="#home" aria-label="Allowance Vault home">' + logo({ size: 28 }) + "<span>Allowance Vault</span></a><nav aria-label=\"App\">" + side + "</nav></aside>" +
    '<div class="work"><div class="topbar"><div class="crumbs">' + cr + '</div><span class="pill warn" title="No vault is deployed on any network">Network: none (simulation)</span>' +
    '<button class="btn small" disabled aria-disabled="true" title="Wallet connection is planned, not built yet">Connect wallet (planned)</button></div>' +
    '<main class="main" id="main" tabindex="-1" style="padding:24px;display:grid;gap:20px">' +
    '<div class="sim-banner"><b>Simulation mode.</b> No vault is deployed and no funds are involved. Results come from the reference model of the planned covenant.</div>' + (head || "") + inner + "</main></div></div>";
}
function pageHead(h, p, right) {
  return '<header class="row" style="justify-content:space-between;align-items:flex-end"><div><h1 style="font-size:clamp(1.6rem,3.4vw,2.2rem)">' + h + "</h1>" + (p ? '<p class="muted" style="margin-top:6px">' + p + "</p>" : "") + "</div>" + (right || "") + "</header>";
}

function render(keep) {
  const name = curName(); const r = ROUTES[name] || ROUTES["404"];
  const root = $("#root"); const html = r.render(name);
  root.innerHTML = html; document.title = (r.title ? r.title + " | " : "") + "Allowance Vault";
  if (!keep) { scrollTo(0, 0); const m = $("#main"); if (m) { try { m.focus({ preventScroll: true }); } catch (e) { /* ok */ } } }
  if (r.after) r.after(name);
}
addEventListener("hashchange", () => render(false));

/* ---------- global events ---------- */
const actions = {
  copy: el => copyText(el.dataset.t, "Copied"),
  menu: el => { const n = $("#mnav"); const o = n.classList.toggle("open"); el.setAttribute("aria-expanded", String(o)); },
  modalYes: () => closeModal(true), modalNo: () => closeModal(false),
};
document.addEventListener("click", e => {
  const t = e.target.closest("[data-a]"); if (t && actions[t.dataset.a]) { if (t.tagName === "A") e.preventDefault(); actions[t.dataset.a](t, e); return; }
  if (e.target.id === "modal") closeModal(false);
  const a = e.target.closest(".nav a"); if (a) { const n = $("#mnav"); if (n) n.classList.remove("open"); }
});
