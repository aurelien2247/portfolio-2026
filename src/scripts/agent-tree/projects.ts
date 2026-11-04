// La fiche projet en grand : un écran à gauche (émulation ou captures), la fiche à droite
// (contexte, description, stack), et « précédent / suivant » pour passer d'un projet à l'autre.
// C'est un <dialog> natif : Échap ferme, le focus reste dedans, le reste de la page est inerte.

import { stackIcons, type SubAgent } from "../../data/agents";
import { techName } from "../../data/tech-names";
import { pageLang, strings } from "../../i18n";

const $ = <T extends Element>(sel: string, root: ParentNode) => root.querySelector<T>(sel)!;

// Une techno : son logo seul (son nom en alt et en bulle au survol) si elle en a un, sinon une étiquette.
// Sert aussi à la réponse « Ma stack ».
export function techTag(t: string, withIcons = true) {
  const s = document.createElement("span");
  const name = techName(t, pageLang());
  const icon = withIcons ? stackIcons[t] : undefined;
  if (icon) {
    s.className = "tech";
    s.dataset.name = name; // affiché en bulle au survol (voir .tech::after)
    s.tabIndex = 0;
    const img = document.createElement("img");
    img.src = icon.src;
    img.alt = name;
    s.append(img);
  } else {
    s.className = "chip-tag";
    s.textContent = name;
  }
  return s;
}

export function createProjectModal(dialog: HTMLDialogElement) {
  const ui = strings();
  const screen = $<HTMLElement>("[data-screen]", dialog);
  const tab = $<HTMLElement>(".tab", dialog);
  const title = $<HTMLElement>("h2", dialog);
  const context = $<HTMLElement>(".context", dialog);
  const text = $<HTMLElement>(".text", dialog);
  const stack = $<HTMLElement>("[data-stack]", dialog);
  const skills = $<HTMLElement>("[data-skills]", dialog);
  const repo = $<HTMLAnchorElement>("[data-repo]", dialog);
  const prev = $<HTMLButtonElement>("[data-prev]", dialog);
  const next = $<HTMLButtonElement>("[data-next]", dialog);

  let list: SubAgent[] = [];
  let index = 0;

  // Les émulations jouables, par projet, chargées seulement quand leur fiche s'ouvre (avec leur CSS).
  // Une démo peut rendre une fonction de nettoyage (Sextant éteint sa machine), appelée quand
  // elle quitte l'écran.
  type Mount = (root: HTMLElement) => void | (() => void);
  const DEMOS: Record<NonNullable<SubAgent["demo"]>, () => Promise<Mount>> = {
    smash: () => import("./demo-sextant").then((m) => m.mountSextant),
    spacex: () => import("./demo-spacex").then((m) => m.mountSpacex),
    recettes: () => import("./demo-recettes").then((m) => m.mountRecettes),
  };
  let unmount: (() => void) | void;
  let shown = 0; // numéro de ce qui est à l'écran : une démo qui arrive trop tard ne s'affiche pas
  const clearDemo = () => {
    shown++;
    unmount?.();
    unmount = undefined;
  };

  type Shot = NonNullable<SubAgent["shots"]>[number];
  type Slide = { demo: () => Promise<Mount> } | { shot: Shot };

  // Ce que montre l'écran, une « diapo » à la fois : l'émulation d'abord s'il y en a une, puis les captures.
  // Les contrôles sont ceux d'une visionneuse (flèches sur les côtés, points et compteur en bas) :
  // neutres, ils ne reprennent pas le style dessiné de la popup.
  function showSlides(slides: Slide[]) {
    // Le conteneur est en display: contents, ses enfants se placent comme s'ils étaient dans l'écran
    const slot = document.createElement("div");
    slot.className = "slot";
    screen.append(slot);

    const render = (s: Slide) => {
      clearDemo();
      slot.replaceChildren();
      if ("demo" in s) {
        screen.dataset.kind = "demo";
        screen.classList.remove("on-black");
        const me = shown;
        s.demo().then((mount) => {
          if (me === shown) unmount = mount(slot);
        });
        return;
      }
      screen.dataset.kind = "shots";
      screen.classList.toggle("on-black", !!s.shot.onBlack);
      // Un clic sur la capture l'ouvre en taille réelle dans un nouvel onglet.
      const link = document.createElement("a");
      link.target = "_blank";
      link.rel = "noopener";
      link.href = s.shot.src.src;
      const img = document.createElement("img");
      img.className = "shot";
      img.src = s.shot.src.src;
      img.alt = s.shot.alt;
      link.append(img);
      slot.append(link);
    };
    if (slides.length < 2) return render(slides[0]);

    const pager = document.createElement("div");
    pager.className = "pager";
    const count = document.createElement("span");
    count.className = "count";
    const arrow = (cls: string, label: string, d: string) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `shot-arrow ${cls}`;
      b.setAttribute("aria-label", label);
      b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
      return b;
    };
    const left = arrow("left", ui.prevView, "M15 5l-7 7 7 7");
    const right = arrow("right", ui.nextView, "M9 5l7 7-7 7");

    let current = 0;
    const show = (i: number) => {
      current = (i + slides.length) % slides.length;
      render(slides[current]);
      count.textContent = `${current + 1} / ${slides.length}`;
      pager
        .querySelectorAll(".dot")
        .forEach((d, j) => d.setAttribute("aria-current", String(current === j)));
    };
    slides.forEach((s, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "dot";
      d.setAttribute("aria-label", "demo" in s ? ui.demo : ui.shot(s.shot.alt));
      d.addEventListener("click", () => show(i));
      pager.append(d);
    });
    pager.append(count);
    left.addEventListener("click", () => show(current - 1));
    right.addEventListener("click", () => show(current + 1));
    screen.append(left, right, pager);
    show(0);
  }

  // Une rangée d'étiquettes, masquée si le projet n'en a pas.
  function fillTags(group: HTMLElement, items: string[] = [], withIcons = false) {
    group.hidden = !items.length;
    $(".tags", group).replaceChildren(...items.map((t) => techTag(t, withIcons)));
  }

  function render() {
    const p = list[index];
    tab.textContent = p.org ?? p.id;
    title.textContent = p.title;
    context.textContent = [p.place, p.when, p.badge].filter(Boolean).join(" · ");
    text.innerHTML = p.html;
    fillTags(stack, p.stack, true);
    fillTags(skills, p.tags);
    repo.hidden = !p.repo;
    if (p.repo) repo.href = p.repo;

    clearDemo();
    screen.replaceChildren();
    screen.classList.remove("on-black");
    const slides: Slide[] = [
      ...(p.demo ? [{ demo: DEMOS[p.demo] }] : []),
      ...(p.shots ?? []).map((shot) => ({ shot })),
    ];
    if (slides.length) showSlides(slides);
    else {
      screen.dataset.kind = "empty";
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = ui.noShot;
      screen.append(empty);
    }

    // Si le bouton qui a le focus se désactive (premier ou dernier projet), le focus passe à l'autre :
    // sinon il tomberait sur <body>, hors de la fiche, et les flèches du clavier ne marcheraient plus.
    const focused = document.activeElement;
    prev.disabled = index === 0;
    next.disabled = index === list.length - 1;
    if (focused === prev && prev.disabled) next.focus();
    if (focused === next && next.disabled) prev.focus();
  }

  const go = (d: number) => {
    const i = index + d;
    if (i < 0 || i >= list.length) return;
    index = i;
    render();
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  dialog.addEventListener("keydown", (e) => {
    // Les flèches restent à ce qui les utilise : l'écran (le jeu Smash, la recherche des recettes…),
    // un champ de saisie, ou une touche déjà traitée ailleurs.
    const target = e.target as Element;
    if (
      e.defaultPrevented ||
      target.closest("[data-screen], input, textarea, select, [contenteditable]")
    )
      return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });
  dialog.addEventListener("close", clearDemo);
  $("[data-close]", dialog).addEventListener("click", () => dialog.close());
  // Un clic sur le fond assombri (hors de la boîte) ferme aussi.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  return (projects: SubAgent[], i: number) => {
    list = projects;
    index = i;
    render();
    dialog.showModal();
  };
}
