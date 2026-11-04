// Reconstitution de l'appli Flutter « SpaceX Launches » (github.com/aurelien2247/space_x).
// Même interface que la vraie (thème sombre, polices, tailles en dp, icônes Material, textes),
// mais en HTML : l'API publique de SpaceX ne répond plus, les lancements viennent d'une archive.

import "../../styles/demos/spacex.css";
import { esc } from "./html";
import launches from "./spacex-launches.json";

type Launch = {
  name: string;
  flight: number;
  date: string;
  upcoming: boolean;
  success: boolean | null;
  rocket: string;
  pad: string;
  staticFire?: string;
  patch?: string;
  photos?: string[];
  details?: string;
  youtube?: string;
  article?: string;
  wikipedia?: string;
  cores?: [string, boolean | null][];
};

const ALL = launches as Launch[];
const UPCOMING = ALL.filter((l) => l.upcoming);
// Comme l'appli : les lancements passés du plus récent au plus ancien (dates ISO, comparables en texte)
const PAST = ALL.filter((l) => !l.upcoming).sort((a, b) => b.date.localeCompare(a.date));

// Écussons (Wikimedia Commons) et photos (Flickr de SpaceX), compressés en webp
const IMAGES = import.meta.glob<{ default: ImageMetadata }>("../../assets/spacex/*.webp", {
  eager: true,
});
const img = (slug: string) => IMAGES[`../../assets/spacex/${slug}.webp`].default.src;

// Les icônes Material utilisées par l'appli
const PATHS = {
  rocket_launch: `<path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.26zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17zm6.48-2.19c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81l-.26-1.33zM9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12A2.996 2.996 0 0 1 9 18zm4-9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>`,
  favorite: `<path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`,
  favorite_border: `<path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>`,
  grid_view: `<path fill-rule="evenodd" d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>`,
  view_list: `<path d="M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5 5h13v-4H8v4zm0 5h13v-4H8v4zM8 5v4h13V5H8z"/>`,
  filter_alt: `<path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z"/>`,
  check_circle: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>`,
  cancel: `<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>`,
  tag: `<path d="M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4h4zm-6 4h-4v-4h4v4z"/>`,
  rocket: `<path d="M12 2.5s4.5 2.04 4.5 10.5c0 2.49-1.04 5.57-1.6 7H9.1c-.56-1.43-1.6-4.51-1.6-7C7.5 4.54 12 2.5 12 2.5zm2 8.5c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-6.31 9.52c-.48-1.23-1.52-4.17-1.67-6.87l-1.13.75c-.56.38-.89 1-.89 1.67V22l3.69-1.48zM20 22v-5.93c0-.67-.33-1.29-.89-1.66l-1.13-.75c-.15 2.69-1.2 5.64-1.67 6.87L20 22z"/>`,
  location_on: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>`,
  update: `<path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79s7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58s9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"/>`,
  local_fire_department: `<path d="m12 12.9-2.13 2.09c-.56.56-.87 1.29-.87 2.07C9 18.68 10.35 20 12 20s3-1.32 3-2.94c0-.78-.31-1.52-.87-2.07L12 12.9z"/><path d="m16 6-.44.55C14.38 8.02 12 7.19 12 5.3V2S4 6 4 13c0 2.92 1.56 5.47 3.89 6.86-.56-.79-.89-1.76-.89-2.8 0-1.32.52-2.56 1.47-3.5L12 10.1l3.53 3.47c.95.93 1.47 2.17 1.47 3.5 0 1.02-.31 1.96-.85 2.75 1.89-1.15 3.29-3.06 3.71-5.3.66-3.55-1.07-6.9-3.86-8.52z"/>`,
  link: `<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>`,
  description: `<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>`,
  play_circle_filled: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>`,
  article: `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>`,
  book: `<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>`,
  settings_input_composite: `<path d="M5 2c0-.55-.45-1-1-1s-1 .45-1 1v4H1v6h6V6H5V2zm4 14c0 1.3.84 2.4 2 2.82V23h2v-4.18c1.16-.41 2-1.51 2-2.82v-2H9v2zm-8 0c0 1.3.84 2.4 2 2.82V23h2v-4.18C6.16 18.4 7 17.3 7 16v-2H1v2zM21 6V2c0-.55-.45-1-1-1s-1 .45-1 1v4h-2v6h6V6h-2zm-8-4c0-.55-.45-1-1-1s-1 .45-1 1v4H9v6h6V6h-2V2zm4 14c0 1.3.84 2.4 2 2.82V23h2v-4.18c1.16-.41 2-1.51 2-2.82v-2h-6v2z"/>`,
  download_done: `<path d="M20.13 5.41 18.72 4l-9.19 9.19-4.25-4.24-1.41 1.41 5.66 5.66zM5 18h14v2H5z"/>`,
  error_outline: `<path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>`,
  help_outline: `<path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>`,
  check_circle_outline: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>`,
  arrow_back: `<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>`,
};
const icon = (name: keyof typeof PATHS, cls = "") =>
  `<svg class="mi ${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`;

// Les formats de date de l'appli (intl, en anglais) : « Nov 11, 2021 03:03 », à l'heure locale
const day = (iso: string, month: "short" | "long" = "short") =>
  new Date(iso).toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });
const hm = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateTime = (iso: string, month: "short" | "long" = "short") =>
  `${day(iso, month)} ${hm(iso)}`;

// Le fond de l'appli (SpaceBackground) : dégradé, 140 étoiles fixes, nébuleuses, planète à anneau.
// Écran logique de 360 × 760 dp, comme un téléphone Android.
function background() {
  const W = 360;
  const H = 760;
  let seed = 42;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let stars = "";
  for (let i = 0; i < 140; i++) {
    const x = (rand() * W).toFixed(1);
    const y = (rand() * H).toFixed(1);
    const r = rand() * 1.6 + 0.4;
    const a = 0.25 + rand() * 0.75;
    stars += `<circle cx="${x}" cy="${y}" r="${(r * 2.2).toFixed(2)}" class="halo" opacity="${(a * 0.22).toFixed(2)}"/><circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" class="star" opacity="${a.toFixed(2)}"/>`;
  }
  const m = Math.min(W, H);
  const pr = m * 0.11;
  return `<svg class="spx-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="spx-base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="base-a"/><stop offset="1" class="base-b"/></linearGradient>
      <radialGradient id="spx-n1"><stop offset="0" class="n1-a"/><stop offset=".4" class="n1-b"/><stop offset="1" class="n1-c"/></radialGradient>
      <radialGradient id="spx-n2"><stop offset="0" class="clear"/><stop offset=".4" class="n2-b"/><stop offset="1" class="clear"/></radialGradient>
      <radialGradient id="spx-n3"><stop offset="0" class="clear"/><stop offset=".4" class="n3-b"/><stop offset="1" class="clear"/></radialGradient>
      <radialGradient id="spx-planet"><stop offset="0" class="planet-a"/><stop offset="1" class="planet-b"/></radialGradient>
      <linearGradient id="spx-shade"><stop offset="0" class="shade"/><stop offset="1" class="clear"/></linearGradient>
      <linearGradient id="spx-ring" x1="1" y1=".5" x2="0" y2="0"><stop offset="0" class="ring"/><stop offset="1" class="clear"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#spx-base)"/>
    ${stars}
    <circle cx="${W * 0.22}" cy="${H * 0.28}" r="${m * 0.35}" fill="url(#spx-n1)"/>
    <circle cx="${W * 0.65}" cy="${H * 0.45}" r="${m * 0.28}" fill="url(#spx-n2)"/>
    <circle cx="${W * 0.38}" cy="${H * 0.7}" r="${m * 0.22}" fill="url(#spx-n3)"/>
    <circle cx="${W * 0.8}" cy="${H * 0.22}" r="${pr}" fill="url(#spx-planet)"/>
    <circle cx="${W * 0.8}" cy="${H * 0.22}" r="${pr}" fill="url(#spx-shade)"/>
    <circle cx="${W * 0.8}" cy="${H * 0.22}" r="${pr * 1.6}" fill="none" stroke="url(#spx-ring)" stroke-width="${pr * 0.18}" class="ring-blur"/>
  </svg>`;
}

// La bibliothèque google_fonts de l'appli charge Rajdhani et Roboto Condensed : on fait pareil,
// seulement quand la démo s'ouvre.
function loadFonts() {
  if (document.getElementById("spx-fonts")) return;
  const link = document.createElement("link");
  link.id = "spx-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Roboto+Condensed:wght@400;500;700&display=swap";
  document.head.append(link);
}

/* ---------- Les écrans ---------- */

const ONBOARDING = [
  {
    tab: "Launches",
    tabIcon: "rocket_launch",
    icon: "rocket_launch",
    title: "Explore SpaceX Launches",
    message: "Browse upcoming and past launches with rich details and media.",
  },
  {
    tab: "Favorites",
    tabIcon: "favorite",
    icon: "favorite",
    title: "Save Your Favorites",
    message: "Tap the heart to add launches to your favorites and filter them.",
  },
  {
    tab: "Views",
    tabIcon: "filter_alt",
    icon: "grid_view",
    title: "Switch Views",
    message: "Toggle between grid and list layouts to suit your preference.",
  },
] as const;

function onboarding(step: number) {
  const s = ONBOARDING[step];
  const last = step === ONBOARDING.length - 1;
  return `<header class="spx-bar is-tabs">
      <h1>Getting Started</h1>
      <nav class="spx-tabs">${ONBOARDING.map(
        (t, i) =>
          `<button type="button" data-step="${i}" aria-current="${i === step}">${icon(t.tabIcon)}<span>${t.tab}</span></button>`,
      ).join("")}</nav>
    </header>
    <div class="spx-slide">
      ${icon(s.icon, "big")}
      <h2>${s.title}</h2>
      <p>${s.message}</p>
    </div>
    <footer class="spx-onboard-actions">
      <button type="button" class="spx-outlined" data-done>Skip</button>
      <button type="button" class="spx-filled" ${last ? "data-done" : `data-step="${step + 1}"`}>${last ? "Done" : "Next"}</button>
    </footer>`;
}

const status = (l: Launch, cls = "") =>
  l.success === null
    ? ""
    : icon(l.success ? "check_circle" : "cancel", `${l.success ? "ok" : "ko"} ${cls}`);

const heart = (fav: boolean, cls = "") =>
  icon(fav ? "favorite" : "favorite_border", `${fav ? "fav" : ""} ${cls}`);

type State = { grid: boolean; favOnly: boolean; favs: Set<string> };

function home(st: State) {
  const visible = st.favOnly ? PAST.filter((l) => st.favs.has(l.name)) : PAST;
  const carousel = UPCOMING.map(
    (l) => `<button type="button" class="spx-up" data-open="${esc(l.name)}">
        <span class="spx-up-media">${l.patch ? `<img src="${img(l.patch)}" alt="">` : icon("rocket_launch")}</span>
        <span class="spx-up-text"><b>${esc(l.name)}</b><small>${dateTime(l.date)}</small></span>
      </button>`,
  ).join("");
  const dots = UPCOMING.map((_, i) => `<i aria-current="${i === 0}"></i>`).join("");

  const items = visible
    .map((l) => {
      const fav = st.favs.has(l.name);
      const toggle = `data-fav="${esc(l.name)}" aria-label="${fav ? "Remove from favorites" : "Add to favorites"}"`;
      if (st.grid)
        return `<div class="spx-card spx-cell">
          <button type="button" class="spx-cell-main" data-open="${esc(l.name)}">
            <span class="spx-cell-media">${l.patch ? `<img src="${img(l.patch)}" alt="">` : icon("rocket_launch")}</span>
            <span class="spx-cell-text">
              <span class="spx-cell-title"><b>${esc(l.name)}</b>${status(l, "small")}</span>
              <small>${day(l.date)}</small>
              ${l.details ? `<small class="spx-clamp">${esc(l.details)}</small>` : ""}
            </span>
          </button>
          <button type="button" class="spx-cell-fav" ${toggle}>${heart(fav)}</button>
        </div>`;
      return `<div class="spx-tile">
          <button type="button" class="spx-tile-main" data-open="${esc(l.name)}">
            <span class="spx-tile-lead">${l.patch ? `<img src="${img(l.patch)}" alt="">` : icon("rocket_launch")}</span>
            <span class="spx-tile-text"><b>${esc(l.name)}</b><small>${dateTime(l.date)}</small></span>
          </button>
          ${status(l)}
          <button type="button" class="spx-icon-btn" ${toggle}>${heart(fav)}</button>
        </div>`;
    })
    .join("");

  return `<header class="spx-bar"><span class="spx-logo">SPACE<b> X</b></span></header>
    <div class="spx-scroll">
      <h2 class="spx-h">Upcoming Launches</h2>
      <div class="spx-carousel" data-carousel>${carousel}</div>
      <div class="spx-dots" data-dots>${dots}</div>
      <div class="spx-row">
        <h2 class="spx-h">Past Launches</h2>
        <button type="button" class="spx-icon-btn" data-favonly aria-label="${st.favOnly ? "Show all launches" : "Show favorites only"}">${heart(st.favOnly)}</button>
        <button type="button" class="spx-icon-btn" data-grid aria-label="${st.grid ? "Switch to list view" : "Switch to grid view"}">${icon(st.grid ? "view_list" : "grid_view")}</button>
      </div>
      <div class="${st.grid ? "spx-grid" : "spx-list"}">${items}</div>
    </div>
    <button type="button" class="spx-fab" data-favonly aria-label="${st.favOnly ? "Show all launches" : "Show favorites"}">${heart(st.favOnly)}</button>`;
}

const infoRow = (name: keyof typeof PATHS, label: string, value: string, tone = "") =>
  `<div class="spx-info ${tone}">${icon(name)}<div><small>${label}</small><span>${esc(value)}</span></div></div>`;

const cardTitle = (name: keyof typeof PATHS, title: string) =>
  `<div class="spx-card-title">${icon(name)}<h3>${title}</h3></div>`;

function detail(l: Launch) {
  const photos = l.photos ?? [];
  const media = photos.length
    ? `<div class="spx-media">
        <div class="spx-photos" data-photos>${photos.map((p) => `<img src="${img(p)}" alt="">`).join("")}</div>
        <span class="spx-media-fade"></span>
        <div class="spx-dots on-photo" data-dots>${photos.map((_, i) => `<i aria-current="${i === 0}"></i>`).join("")}</div>
        <span class="spx-count" data-count>1/${photos.length}</span>
      </div>`
    : l.patch
      ? `<div class="spx-media is-patch"><span><img src="${img(l.patch)}" alt=""></span></div>`
      : "";

  const s = l.success;
  const statusLine = `<div class="spx-status">
      ${icon(s === null ? "help_outline" : s ? "check_circle_outline" : "cancel", s === null ? "unknown" : s ? "ok" : "ko")}
      <span>${s === null ? "Status unknown" : s ? "Successful launch" : "Launch failed"}</span>
      <small>${dateTime(l.date, "long")}</small>
    </div>`;

  const overview = `<section class="spx-card">
      <h3>Mission Overview</h3>
      ${infoRow("tag", "Flight", `#${l.flight}`)}
      ${infoRow("rocket", "Rocket", l.rocket)}
      ${infoRow("location_on", "Launchpad", l.pad)}
      ${infoRow("update", "Status", l.upcoming ? "Upcoming" : "Completed", l.upcoming ? "orange" : "green")}
      ${l.staticFire ? infoRow("local_fire_department", "Static fire test", dateTime(l.staticFire)) : ""}
    </section>`;

  const boosters = l.cores?.length
    ? `<section class="spx-card">${cardTitle("settings_input_composite", "Boosters")}${l.cores
        .map(([id, landed]) => {
          const [ic, tone, text] =
            landed === null
              ? (["help_outline", "unknown", "Landing status unknown"] as const)
              : landed
                ? (["download_done", "ok", "Successful landing"] as const)
                : (["error_outline", "ko", "Landing failed"] as const);
          return `<div class="spx-sub"><span class="spx-sub-icon">${icon("rocket")}</span><div><b>Booster #${id}</b><span class="spx-landing ${tone}">${icon(ic)}${text}</span></div></div>`;
        })
        .join("")}</section>`
    : "";

  const link = (href: string, ic: keyof typeof PATHS, label: string, tone: string) =>
    `<a class="spx-link ${tone}" href="${esc(href)}" target="_blank" rel="noopener">${icon(ic)}${label}</a>`;
  const links = `<section class="spx-card">${cardTitle("link", "Related Links")}<div class="spx-links">
      ${l.youtube ? link(`https://www.youtube.com/watch?v=${l.youtube}`, "play_circle_filled", "Watch Launch", "red") : ""}
      ${l.article ? link(l.article, "article", "Read Article", "blue") : ""}
      ${l.wikipedia ? link(l.wikipedia, "book", "Wikipedia", "grey") : ""}
    </div></section>`;

  const details = l.details
    ? `<section class="spx-card">${cardTitle("description", "Mission Details")}<p class="spx-sub">${esc(l.details)}</p></section>`
    : "";

  return `<header class="spx-bar"><button type="button" class="spx-icon-btn" data-back aria-label="Back">${icon("arrow_back")}</button><h1>${esc(l.name)}</h1></header>
    <div class="spx-scroll">
      ${media}
      <div class="spx-pad">
        <h2 class="spx-title">${esc(l.name)}</h2>
        ${statusLine}
        ${overview}
        ${boosters}
        ${links}
        ${details}
      </div>
    </div>`;
}

// Un carrousel en scroll-snap met à jour ses points (et son compteur) pendant qu'on fait défiler.
function syncDots(scroller: HTMLElement | null, root: ParentNode) {
  if (!scroller) return;
  const dots = [...root.querySelectorAll("[data-dots] i")];
  const count = root.querySelector("[data-count]");
  scroller.addEventListener(
    "scroll",
    () => {
      const first = scroller.children[0] as HTMLElement | undefined;
      if (!first) return;
      const i = Math.round(scroller.scrollLeft / first.offsetWidth);
      dots.forEach((d, j) => d.setAttribute("aria-current", String(i === j)));
      if (count) count.textContent = `${i + 1}/${dots.length}`;
    },
    { passive: true },
  );
}

/** Monte la réplique de l'appli SpaceX dans `root` : écran d'accueil, liste ou grille, favoris, fiches. */
export function mountSpacex(root: HTMLElement) {
  loadFonts();
  root.insertAdjacentHTML(
    "beforeend",
    `<div class="spx">
      <div class="spx-phone">
        <div class="spx-screen">
          ${background()}
          <div class="spx-route" data-route></div>
          <span class="spx-cam" aria-hidden="true"></span>
        </div>
      </div>
    </div>`,
  );
  const route = root.querySelector<HTMLElement>("[data-route]")!;
  const st: State = { grid: false, favOnly: false, favs: new Set() };
  let current: Launch | null = null;
  let step = 0;
  let onboarded = false;
  let homeScroll = 0;

  function show(enter = false) {
    if (!onboarded) route.innerHTML = onboarding(step);
    else if (current) route.innerHTML = detail(current);
    else route.innerHTML = home(st);
    // Une nouvelle page arrive par-dessus, comme une MaterialPageRoute
    route.classList.remove("is-entering");
    if (enter) {
      void route.offsetWidth; // relance l'animation
      route.classList.add("is-entering");
    }
    syncDots(route.querySelector("[data-carousel]"), route);
    syncDots(route.querySelector("[data-photos]"), route);
  }

  root.addEventListener("click", (e) => {
    const t = (e.target as Element).closest<HTMLElement>("button");
    if (!t || !route.contains(t)) return;
    const d = t.dataset;
    if (d.step) step = Number(d.step);
    else if ("done" in d) onboarded = true;
    else if (d.open) current = ALL.find((l) => l.name === d.open) ?? null;
    else if ("back" in d) current = null;
    else if ("grid" in d) st.grid = !st.grid;
    else if ("favonly" in d) st.favOnly = !st.favOnly;
    else if (d.fav) {
      if (!st.favs.delete(d.fav)) st.favs.add(d.fav);
    } else return;
    // La liste garde sa position : quand on coche un favori, et au retour d'une fiche
    const scroller = route.querySelector(".spx-scroll");
    if (d.open) homeScroll = scroller?.scrollTop ?? 0;
    const keep = "back" in d ? homeScroll : d.open || "done" in d ? 0 : (scroller?.scrollTop ?? 0);
    show(!!d.open || "done" in d);
    const next = route.querySelector(".spx-scroll");
    if (next) next.scrollTop = keep;
  });

  show();
}
