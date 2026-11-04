// Le moteur de l'arbre : orchestrateur → agents → sous-agents éphémères.
// Ce n'est pas une vraie IA : les réponses viennent de src/data/agents.ts, seule la mise en scène est animée.
// Les textes de l'interface viennent de src/i18n.ts, dans la langue de la page.

import { inkOn, solidColor, type Topic, type SubAgent } from "../../data/agents";
import { strings } from "../../i18n";
import { createAgent, createFace, markConsulted, setMood, svgEl, type Agent } from "./character";
import { ease, reduceMotion, tween, wait } from "./motion";
import { createProjectModal, techTag } from "./projects";

const VIEW_W = 1000;
const PROGRESS = "agent-tree-progress";
const VIEW_H = 580;

const $ = <T extends Element>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

// Le nom affiché d'un agent ou d'un sous-agent (traduit en anglais, sinon sa clé)
const nameOf = (x: Topic | SubAgent) => x.name ?? ("key" in x ? x.key : x.id);

/** `aboutText` : le texte de la bulle du « ? » (src/data/agents.ts, dans la langue de la page). */
export function initAgentTree(root: HTMLElement, topics: Topic[], aboutText: string) {
  const ui = strings();
  // La scène (le premier <svg> de l'arbre est la petite flèche de « Choisis un sujet »)
  const svg = $<SVGSVGElement>(".stage > svg", root);
  const layers = {
    edges: $<SVGGElement>("[data-layer=edges]", root),
    packets: $<SVGGElement>("[data-layer=packets]", root),
    nodes: $<SVGGElement>("[data-layer=nodes]", root),
    bubbles: $<SVGGElement>("[data-layer=bubbles]", root),
  };
  const chips = $<HTMLElement>("[data-chips]", root);
  const answer = $<HTMLElement>("[data-answer]", root);
  const logEl = $<HTMLOListElement>("[data-log]", root);
  const scoreEl = $<HTMLElement>("[data-score]", root);
  const openProject = createProjectModal($<HTMLDialogElement>("[data-project]", root));

  const nodes = new Set<Agent>();
  const add = (a: Agent) => (nodes.add(a), a);

  /* ---------- L'arbre ---------- */

  // Lien en équerre du bas du parent (sous son texte) vers le haut de l'enfant.
  const elbow = (p: Agent, c: Agent) => {
    const y1 = p.y + 50 * p.scale + 26;
    const y2 = c.y - 38 * c.scale;
    const mid = y1 + (y2 - y1) / 2;
    return `M${p.x} ${y1} V${mid} H${c.x} V${y2}`;
  };

  const orch = add(
    createAgent(layers.nodes, {
      id: "orch",
      orch: true,
      x: VIEW_W / 2,
      y: 100,
      scale: 1.1,
      color: "var(--orch)",
      label: ui.orchestrator,
      status: ui.ready,
    }),
  );

  const step = (VIEW_W - 220) / (topics.length - 1);
  const agents = new Map<string, Agent>();
  topics.forEach((t, i) => {
    const a = add(
      createAgent(layers.nodes, {
        id: t.key,
        top: true,
        x: 110 + i * step,
        y: 300,
        scale: 0.95,
        color: t.color,
        accessory: t.accessory,
        label: nameOf(t),
        status: ui.idle,
      }),
    );
    a.edge = svgEl("path", { class: "edge", d: elbow(orch, a) }, layers.edges);
    a.g.classList.add("clickable");
    a.g.addEventListener("click", () => ask(t));
    agents.set(t.key, a);
  });

  /* ---------- Bulles ---------- */

  const bubbles = new Map<
    Agent,
    { g: SVGGElement; rect: SVGRectElement; tail: SVGPathElement; text: SVGTextElement }
  >();
  function say(a: Agent, text: string | null) {
    let b = bubbles.get(a);
    if (!b) {
      const g = svgEl("g", { class: "bubble" }, layers.bubbles);
      b = {
        g,
        rect: svgEl("rect", { rx: 10, height: 32 }, g),
        tail: svgEl("path", {}, g),
        text: svgEl("text", {}, g),
      };
      bubbles.set(a, b);
    }
    if (!text) {
      b.g.style.display = "none";
      return;
    }
    b.g.style.display = "";
    b.text.textContent = text;
    // Arbre caché (version rapide) : le texte ne se mesure pas, on estime sa largeur
    const len = b.text.getComputedTextLength() || text.length * 8;
    const w = Math.max(44, len + 26);
    let x: number;
    let top: number;
    if (a.orch) {
      // À droite de l'orchestrateur : au-dessus, il n'y a pas la place.
      x = a.x + 56 * a.scale;
      top = a.y - 34;
      b.tail.setAttribute("d", `M${x + 1} ${top + 9} L${x - 9} ${top + 16} L${x + 1} ${top + 23}`);
    } else {
      top = a.y - 38 * a.scale - 50;
      x = Math.min(VIEW_W - 10 - w, Math.max(10, a.x - w / 2));
      b.tail.setAttribute(
        "d",
        `M${a.x - 6} ${top + 31} L${a.x} ${top + 41} L${a.x + 6} ${top + 31}`,
      );
    }
    b.rect.setAttribute("x", String(x));
    b.rect.setAttribute("y", String(top));
    b.rect.setAttribute("width", String(w));
    b.text.setAttribute("x", String(x + 13));
    b.text.setAttribute("y", String(top + 22));
  }

  /* ---------- Messages le long des liens ---------- */

  let lookAt: DOMPoint | null = null;

  async function send(edge: SVGPathElement, back: boolean, ms: number, fill: string) {
    edge.classList.add("on");
    const packet = svgEl("g", { class: "packet" }, layers.packets);
    svgEl("rect", { x: -9, y: -7, width: 18, height: 14, rx: 4, style: `fill: ${fill}` }, packet);
    const length = edge.getTotalLength();
    await tween(ms, (t) => {
      const p = edge.getPointAtLength(length * (back ? 1 - ease(t) : ease(t)));
      packet.setAttribute("transform", `translate(${p.x} ${p.y})`);
      lookAt = p;
    });
    packet.remove();
    edge.classList.remove("on");
    lookAt = null;
  }

  /* ---------- Sous-agents éphémères ---------- */

  async function spawn(parent: Agent, defs: SubAgent[]) {
    const n = defs.length;
    const gap = Math.min(185, (VIEW_W - 140) / Math.max(1, n - 1));
    const start = Math.min(
      VIEW_W - 70 - (n - 1) * gap,
      Math.max(70, parent.x - ((n - 1) * gap) / 2),
    );
    const subs = defs.map((d, i) => {
      const s = add(
        createAgent(layers.nodes, {
          id: d.id,
          sub: true,
          parent,
          x: parent.x,
          y: parent.y,
          scale: 0.6,
          color: parent.color,
          label: nameOf(d),
          appear: 0,
        }),
      );
      s.edge = svgEl("path", { class: "edge" }, layers.edges);
      return { agent: s, def: d, tx: start + i * gap, ty: 492 };
    });
    await tween(380, (t) => {
      const e = ease(t);
      for (const { agent: s, tx, ty } of subs) {
        s.x = parent.x + (tx - parent.x) * e;
        s.y = parent.y + (ty - parent.y) * e;
        s.appear = e;
        s.edge!.setAttribute("d", elbow(parent, s));
      }
    });
    return subs;
  }

  async function despawn(parent: Agent, subs: Agent[]) {
    const from = subs.map((s) => [s.x, s.y]);
    await tween(300, (t) => {
      const e = ease(t);
      subs.forEach((s, i) => {
        s.x = from[i][0] + (parent.x - from[i][0]) * e;
        s.y = from[i][1] + (parent.y - from[i][1]) * e;
        s.appear = 1 - e;
        s.edge!.style.opacity = String(1 - e);
      });
    });
    for (const s of subs) {
      s.g.remove();
      s.edge!.remove();
      nodes.delete(s);
      bubbles.get(s)?.g.remove();
    }
  }

  /* ---------- Vie : respiration, clignements, regard ---------- */

  let mouse: DOMPoint | null = null;
  svg.addEventListener("pointermove", (e) => {
    mouse = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
  });
  svg.addEventListener("pointerleave", () => (mouse = null));

  function frame(now: number) {
    const s = now / 1000;
    for (const a of nodes) {
      if (a.mood === "work" && !reduceMotion) a.hop = Math.abs(Math.sin(s * 9 + a.phase)) * 0.3;
      else a.hop *= 0.88;
      const breathe = reduceMotion ? 0 : Math.sin(s * 1.6 + a.phase) * 1.3;
      a.g.setAttribute("transform", `translate(${a.x} ${a.y}) scale(${a.appear})`);
      a.bob.setAttribute("transform", `translate(0 ${breathe - a.hop * 16})`);

      const target = lookAt ?? mouse ?? (a.orch ? null : (a.parent ?? orch));
      for (const p of a.pupils) {
        let dx = 0;
        let dy = 0;
        if (target) {
          const vx = target.x - (a.x + p.ex * a.scale);
          const vy = target.y - (a.y - 8 * a.scale);
          const d = Math.hypot(vx, vy) || 1;
          dx = (vx / d) * 3;
          dy = (vy / d) * 3;
        }
        p.el.setAttribute("cx", String(p.ex + dx));
        p.el.setAttribute("cy", String(-8 + dy));
      }

      if (!reduceMotion && now > a.blinkAt) {
        a.eyes.setAttribute("transform", "translate(0 -8) scale(1 0.12) translate(0 8)");
        if (now > a.blinkAt + 130) {
          a.eyes.removeAttribute("transform");
          a.blinkAt = now + 2200 + Math.random() * 4000;
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Interface ---------- */

  function log(who: string, what: string, done = false) {
    const li = document.createElement("li");
    if (done) li.className = "done";
    const b = document.createElement("b");
    b.textContent = who;
    li.append(new Date().toLocaleTimeString("fr-FR") + " ", b, " " + what);
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }

  answer.addEventListener("click", async (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>("[data-copy]");
    if (!btn) return;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
      btn.textContent = ui.copied;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(btn.previousElementSibling!);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      btn.textContent = ui.copyFallback;
    }
  });

  const chipButtons = topics.map((t) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.style.setProperty("--who", solidColor(t.color));
    b.style.setProperty("--who-ink", inkOn(t.color));
    b.append(createFace(t.color), t.question);
    b.addEventListener("click", () => ask(t));
    chips.appendChild(b);
    return { key: t.key, el: b };
  });

  // Le « ? » après les pastilles : sa bulle s'ouvre au survol, au focus clavier, ou au toucher (téléphone)
  const about = document.createElement("span");
  about.className = "about";
  about.innerHTML = `<button type="button" aria-expanded="false" aria-controls="about-demo" aria-label="${ui.aboutLabel}">?</button><span class="about-tip" id="about-demo" role="note"></span>`;
  $(".about-tip", about).textContent = aboutText;
  const aboutBtn = $<HTMLButtonElement>("button", about);
  const aboutTip = $<HTMLElement>(".about-tip", about);
  // La bulle est centrée sur le « ? » ; on la décale si elle sort de l'écran (le « ? » est au bord)
  const placeAbout = () => {
    aboutTip.style.setProperty("--dx", "0px");
    const r = aboutTip.getBoundingClientRect();
    const margin = 16;
    const dx =
      r.left < margin
        ? margin - r.left
        : r.right > innerWidth - margin
          ? innerWidth - margin - r.right
          : 0;
    aboutTip.style.setProperty("--dx", `${dx}px`);
  };
  // Ouverte au survol de la souris ou au focus clavier ; un clic (ou un toucher) l'épingle ouverte.
  // Échap, un clic ailleurs ou un second clic la ferment.
  let pinned = false;
  const showAbout = (on: boolean) => {
    aboutBtn.setAttribute("aria-expanded", String(on));
    if (on) placeAbout(); // une fois affichée : fermée, elle n'a pas de taille
  };
  const unpin = () => {
    pinned = false;
    showAbout(false);
  };
  about.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && showAbout(true));
  about.addEventListener(
    "pointerleave",
    (e) => e.pointerType === "mouse" && !pinned && showAbout(false),
  );
  aboutBtn.addEventListener("focus", () => aboutBtn.matches(":focus-visible") && showAbout(true));
  aboutBtn.addEventListener("blur", () => !pinned && showAbout(false));
  aboutBtn.addEventListener("click", () => {
    pinned = !pinned;
    showAbout(pinned);
  });
  document.addEventListener("click", (e) => !about.contains(e.target as Node) && unpin());
  about.addEventListener("keydown", (e) => e.key === "Escape" && unpin());
  chips.appendChild(about);

  const setChips = (disabled: boolean, active?: string) =>
    chipButtons.forEach(({ key, el }) => {
      el.disabled = disabled;
      if (active) el.setAttribute("aria-pressed", String(key === active));
    });

  /* ---------- Les résultats dans la réponse ---------- */

  // Le html vient de agents.ts (écrit à la main) ; les autres champs passent par textContent.
  function listItem(def: SubAgent) {
    const li = document.createElement("li");
    li.innerHTML = `<strong></strong><span>${def.html}</span>`;
    $("strong", li).textContent = def.title;
    if (def.stack) {
      const techs = document.createElement("div");
      techs.className = "techs";
      techs.append(...def.stack.map((t) => techTag(t)));
      $("span", li).replaceWith(techs);
    }
    return li;
  }

  // Un « commit » du git log : nœud sur la ligne, puis un accordéon.
  // Le même `name` sur chaque <details> fait que le navigateur n'en garde qu'un d'ouvert.
  function commitItem(def: SubAgent, group: string) {
    const li = document.createElement("li");
    li.className = "commit";
    li.innerHTML = `<span class="node" aria-hidden="true"></span>
      <details name="${group}">
        <summary>
          <span class="who"><span class="meta"><span class="when"></span></span><strong></strong><span class="place"></span></span>
          <span class="toggle" aria-hidden="true"></span>
        </summary>
        <p class="text">${def.html}</p>
        <div class="tags"></div>
      </details>`;
    if (def.open) $<HTMLDetailsElement>("details", li).open = true;
    $(".when", li).textContent = def.when ?? "";
    if (def.badge) {
      const s = document.createElement("span");
      s.className = "badge";
      s.textContent = def.badge;
      $(".meta", li).append(s);
    }
    $("strong", li).textContent = def.title;
    $(".place", li).textContent = def.place ?? "";
    if (def.logo) {
      const img = document.createElement("img");
      img.className = "logo";
      img.src = def.logo.src;
      img.alt = "";
      $("summary", li).prepend(img);
    }
    for (const tag of def.tags ?? []) {
      const s = document.createElement("span");
      s.textContent = tag;
      $(".tags", li).append(s);
    }
    // Si la description qu'on vient d'ouvrir dépasse du bas de la réponse, on la fait défiler pour la
    // montrer en entier. Seulement après un clic : une ligne ouverte d'office ne fait pas bouger la page.
    const details = $<HTMLDetailsElement>("details", li);
    let clicked = false;
    $("summary", li).addEventListener("click", () => (clicked = true));
    details.addEventListener("toggle", () => {
      if (details.open && clicked)
        details.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
      clicked = false;
    });
    return li;
  }

  // Une ligne du sommaire des projets : un clic ouvre la fiche en grand.
  function projectItem(t: Topic, def: SubAgent, i: number) {
    const li = document.createElement("li");
    li.className = "project";
    li.innerHTML = `<button type="button"><span class="who"><strong></strong><span class="place"></span></span><span class="go"></span></button>`;
    $("strong", li).textContent = def.title;
    $(".place", li).textContent = [def.place, def.badge].filter(Boolean).join(" · ");
    $(".go", li).textContent = def.demo ? ui.play : ui.see;
    if (def.logo) {
      const img = document.createElement("img");
      img.className = "logo";
      img.src = def.logo.src;
      img.alt = "";
      $("button", li).prepend(img);
    }
    $("button", li).addEventListener("click", () => openProject(t.subs, i));
    return li;
  }

  const resultItem = (t: Topic, def: SubAgent, i: number) =>
    t.layout === "log"
      ? commitItem(def, `log-${t.key}`)
      : t.layout === "projects"
        ? projectItem(t, def, i)
        : listItem(def);

  /* ---------- Le déroulé d'une question ---------- */

  let busy = false;
  let lastAnswer: string | undefined;
  const consulted = new Set<string>();
  setTimeout(() => {
    if (!busy && !consulted.size) say(orch, ui.clickMe);
  }, 900);

  async function ask(t: Topic) {
    if (busy) return;
    busy = true;
    const a = agents.get(t.key)!;
    setChips(true, t.key);

    const { by, list } = openAnswer(t);
    const who = nameOf(t);
    by.textContent = `${ui.orchestrator} → ${who}…`;

    // 1. L'orchestrateur délègue
    log(ui.orchestrator, ui.receives(t.question));
    setMood(orch, "work", ui.delegates);
    say(orch, ui.forYou(who));
    log(ui.orchestrator, ui.delegatesTo(who));
    await send(a.edge!, false, 480, "var(--card)");
    say(orch, null);
    a.hop = 1;

    // 2. L'agent découpe le travail et lance ses sous-agents
    const n = t.subs.length;
    setMood(a, "work", ui.splits);
    say(a, ui.splitBubble(n));
    log(who, ui.splitLog(n));
    by.textContent = ui.launches(who, n);
    const subs = await spawn(a, t.subs);
    setMood(a, "work", ui.waits(n));
    say(a, null);

    // 3. Les sous-agents travaillent en parallèle ; les résultats attendent d'arriver à l'orchestrateur
    const results: HTMLLIElement[] = [];
    await Promise.all(
      subs.map(async ({ agent: s, def }, i) => {
        await wait(i * 70);
        await send(s.edge!, false, 340, "var(--card)");
        s.hop = 1;
        setMood(s, "work", ui.searching);
        await wait(260 + Math.random() * 380);
        setMood(s, "done", ui.ok);
        await send(s.edge!, true, 320, solidColor(a.color));
        // Les sous-agents finissent dans le désordre : chaque résultat garde sa place.
        results[i] = resultItem(t, def, i);
        log(`${who}/${nameOf(def)}`, ui.resultSent);
      }),
    );

    // 4. L'agent rassemble et remonte la synthèse à l'orchestrateur
    say(a, ui.gathering);
    await despawn(
      a,
      subs.map((s) => s.agent),
    );
    say(a, null);
    setMood(a, "done", ui.done);
    await send(a.edge!, true, 420, solidColor(a.color));
    orch.hop = 1;
    setMood(orch, "idle", ui.ready);
    say(orch, ui.voila);
    setTimeout(() => !busy && say(orch, null), 1300);

    // 5. Seulement maintenant, la réponse se remplit, une ligne après l'autre
    answer.querySelector(".waiting")?.remove();
    for (const li of results) {
      list.append(li);
      await wait(90);
    }
    by.textContent = ui.synthesis(n, who, ui.orchestrator);
    log(ui.orchestrator, ui.answers, true);

    consulted.add(t.key);
    lastAnswer = t.key;
    markConsulted(a);
    scoreEl.textContent = String(consulted.size);

    saveProgress();
    setChips(false);
    busy = false;
  }

  // La boîte réponse, vide, aux couleurs de l'agent qui répond
  function openAnswer(t: Topic) {
    answer.style.setProperty("--who", solidColor(t.color));
    answer.style.setProperty("--who-ink", inkOn(t.color));
    answer.innerHTML = `<span class="tab">${ui.answerTab}</span><div class="answer-body"><h2></h2><p class="by"></p><div class="waiting"><span></span><span></span><span></span></div></div>`;
    $("h2", answer).textContent = t.title;
    const by = $<HTMLElement>(".by", answer);
    const list = document.createElement(t.layout ? "ol" : "ul");
    if (t.layout) list.className = t.layout;
    by.after(list);
    return { by, list };
  }

  /* ---------- La progression survit au changement de langue ---------- */

  // FR ↔ EN charge l'autre page : on garde dans l'onglet ce qui a été vu, et on le remet sans animation.
  function saveProgress() {
    try {
      sessionStorage.setItem(
        PROGRESS,
        JSON.stringify({ consulted: [...consulted], last: lastAnswer }),
      );
    } catch {}
  }

  function restoreProgress() {
    let saved: { consulted?: string[]; last?: string } = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(PROGRESS) ?? "{}");
    } catch {}
    for (const key of saved.consulted ?? []) {
      const a = agents.get(key);
      if (!a) continue;
      consulted.add(key);
      markConsulted(a);
      setMood(a, "done", ui.done);
    }
    scoreEl.textContent = String(consulted.size);
    const t = topics.find((x) => x.key === saved.last);
    if (!t) return;
    lastAnswer = t.key;
    setChips(false, t.key);
    const { by, list } = openAnswer(t);
    answer.querySelector(".waiting")?.remove();
    list.append(...t.subs.map((def, i) => resultItem(t, def, i)));
    by.textContent = ui.synthesis(t.subs.length, nameOf(t), ui.orchestrator);
  }
  restoreProgress();
}
