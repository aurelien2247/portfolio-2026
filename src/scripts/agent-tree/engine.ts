// Le moteur de l'arbre : orchestrateur → agents → sous-agents éphémères.
// Ce n'est pas une vraie IA : les réponses viennent de src/data/agents.ts, seule la mise en scène est animée.

import type { Topic, SubAgent } from "../../data/agents";
import { createAgent, markConsulted, setMood, svgEl, type Agent } from "./character";
import { createConfetti } from "./fx";
import { ease, reduceMotion, tween, wait } from "./motion";

const VIEW_W = 1000;
const VIEW_H = 580;

const $ = <T extends Element>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

export function initAgentTree(root: HTMLElement, topics: Topic[]) {
  const svg = $<SVGSVGElement>("svg", root);
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
  const confetti = createConfetti($<HTMLCanvasElement>("canvas", root), VIEW_W, VIEW_H);

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
      y: 92,
      scale: 1.1,
      color: "var(--orch)",
      label: "Aurélien · orchestrateur",
      status: "prêt",
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
        label: t.key,
        status: "en veille",
      }),
    );
    a.edge = svgEl("path", { class: "edge", d: elbow(orch, a) }, layers.edges);
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
    const w = Math.max(44, b.text.getComputedTextLength() + 26);
    let x: number;
    let top: number;
    if (a.orch) {
      // À droite de l'orchestrateur : au-dessus, il n'y a pas la place.
      x = a.x + 52 * a.scale;
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
  const resultColor = (c: string) => c.replace("url(#mariniere)", "var(--navy)");

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
          label: d.id,
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
      btn.textContent = "Copié";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(btn.previousElementSibling!);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      btn.textContent = "Sélectionné, fais Ctrl+C";
    }
  });

  const chipButtons = topics.map((t) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    const swatch = document.createElement("i");
    swatch.className = "swatch";
    // Le motif marinière du SVG n'existe pas en CSS : on le refait en rayures.
    swatch.style.background = t.color.startsWith("url(")
      ? "repeating-linear-gradient(#f6f6f2 0 3px, var(--navy) 3px 6px)"
      : t.color;
    b.append(swatch, t.question);
    b.addEventListener("click", () => ask(t));
    chips.appendChild(b);
    return { key: t.key, el: b };
  });
  const setChips = (disabled: boolean, active?: string) =>
    chipButtons.forEach(({ key, el }) => {
      el.disabled = disabled;
      if (active) el.setAttribute("aria-pressed", String(key === active));
    });

  /* ---------- Le déroulé d'une question ---------- */

  let busy = false;
  let finaleDone = false;
  const consulted = new Set<string>();
  setTimeout(() => {
    if (!busy && !consulted.size) say(orch, "Clique sur un de mes agents !");
  }, 900);

  async function ask(t: Topic) {
    if (busy) return;
    busy = true;
    const a = agents.get(t.key)!;
    setChips(true, t.key);

    answer.innerHTML = `<h2></h2><p class="by"></p><ul></ul><div class="waiting"><span></span><span></span><span></span></div>`;
    $("h2", answer).textContent = t.title;
    const by = $<HTMLElement>(".by", answer);
    const list = $<HTMLUListElement>("ul", answer);
    by.textContent = `orchestrateur → ${t.key}…`;

    // 1. L'orchestrateur délègue
    log("orchestrateur", `reçoit « ${t.question} »`);
    setMood(orch, "work", "délègue");
    say(orch, `${t.key}, c'est pour toi !`);
    log("orchestrateur", `délègue → ${t.key}`);
    await send(a.edge!, false, 480, "var(--card)");
    say(orch, null);
    a.hop = 1;

    // 2. L'agent découpe le travail et lance ses sous-agents
    const n = t.subs.length;
    setMood(a, "work", "découpe");
    say(a, `je découpe en ${n} tâches`);
    log(t.key, `découpe en ${n} sous-tâches`);
    by.textContent = `${t.key} lance ${n} sous-agents…`;
    const subs = await spawn(a, t.subs);
    setMood(a, "work", `attend ${n} résultats`);
    say(a, null);

    // 3. Les sous-agents travaillent en parallèle ; chaque résultat s'affiche dès son retour
    await Promise.all(
      subs.map(async ({ agent: s, def }, i) => {
        await wait(i * 70);
        await send(s.edge!, false, 340, "var(--card)");
        s.hop = 1;
        setMood(s, "work", "cherche…");
        await wait(260 + Math.random() * 380);
        setMood(s, "done", "ok");
        await send(s.edge!, true, 320, resultColor(a.color));
        const li = document.createElement("li");
        li.innerHTML = `<strong></strong><span>${def.html}</span>`;
        $("strong", li).textContent = def.title;
        list.appendChild(li);
        log(`${t.key}/${def.id}`, "résultat renvoyé");
      }),
    );
    answer.querySelector(".waiting")?.remove();

    // 4. L'agent rassemble et remonte la synthèse à l'orchestrateur
    say(a, "je rassemble…");
    await despawn(
      a,
      subs.map((s) => s.agent),
    );
    say(a, null);
    setMood(a, "done", "terminé");
    await send(a.edge!, true, 420, resultColor(a.color));
    orch.hop = 1;
    setMood(orch, "idle", "prêt");
    say(orch, "Voilà !");
    setTimeout(() => !busy && say(orch, null), 1300);
    by.textContent = `${n} sous-agents · rassemblé par ${t.key} · transmis par l'orchestrateur`;
    log("orchestrateur", "répond", true);

    consulted.add(t.key);
    markConsulted(a);
    scoreEl.textContent = String(consulted.size);

    if (!finaleDone && (t.key === "contact" || consulted.size === topics.length)) {
      finaleDone = true;
      await wait(700);
      await finale();
    }
    setChips(false);
    busy = false;
  }

  // L'effet signature : une seule fois, quand on demande le contact ou qu'on a fait le tour.
  async function finale() {
    say(orch, "Merci d'être passé ! On se parle ?");
    log("orchestrateur", "mission accomplie", true);
    confetti(orch.x, orch.y + 10);
    [orch, ...agents.values()].forEach((a, i) =>
      setTimeout(() => (a.hop = 1.2), reduceMotion ? 0 : i * 110),
    );
    scoreEl.insertAdjacentText("afterend", " · mission accomplie");
    await wait(1700);
    say(orch, null);
  }
}
