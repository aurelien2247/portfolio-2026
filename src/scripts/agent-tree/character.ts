// Le « skin » des agents : tout le dessin d'un personnage est ici.
// Pour changer leur look, c'est ce fichier qu'il faut modifier (ou remplacer par des SVG dessinés dans Figma).
// Le personnage est dessiné centré sur (0, 0), corps de 56 × 50, avant mise à l'échelle.

import { reduceMotion } from "./motion";

export const SVG_NS = "http://www.w3.org/2000/svg";

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent?.appendChild(el);
  return el;
}

export type Mood = "idle" | "work" | "done";

const MOUTHS: Record<Mood, string> = {
  idle: "M-6 7 Q0 9 6 7",
  work: "M-4 7 Q0 5 4 7",
  done: "M-7 5 Q0 13 7 5",
};

export interface AgentOptions {
  id: string;
  label: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  status?: string;
  /** Orchestrateur : casque-micro et sourire permanent. */
  orch?: boolean;
  /** Agent de premier niveau : pastille « pas encore consulté » puis coche. */
  top?: boolean;
  sub?: boolean;
  parent?: Agent;
  accessory?: "ball";
  appear?: number;
}

export interface Agent extends AgentOptions {
  g: SVGGElement;
  bob: SVGGElement;
  eyes: SVGGElement;
  pupils: { ex: number; el: SVGCircleElement }[];
  mouth: SVGPathElement;
  statusEl: SVGTextElement;
  dot?: SVGCircleElement;
  check?: SVGGElement;
  edge?: SVGPathElement;
  mood: Mood;
  hop: number;
  appear: number;
  phase: number;
  blinkAt: number;
}

export function createAgent(layer: SVGGElement, o: AgentOptions): Agent {
  const g = svgEl("g", { class: "agent" + (o.sub ? " sub" : "") }, layer);
  svgEl(
    "ellipse",
    { class: "shadow", cx: 0, cy: 32 * o.scale, rx: 26 * o.scale, ry: 5 * o.scale },
    g,
  );
  const bob = svgEl("g", {}, g);
  const body = svgEl("g", { transform: `scale(${o.scale})` }, bob);

  // Jambes puis corps
  svgEl("path", { d: "M-10 18 V29 M10 18 V29", class: "ol legs" }, body);
  svgEl(
    "rect",
    { x: -28, y: -30, width: 56, height: 50, rx: 20, class: "ol", style: `fill: ${o.color}` },
    body,
  );

  if (o.orch) {
    svgEl("path", { class: "headset", d: "M-25 -12 Q-25 -42 0 -42 Q25 -42 25 -12" }, body);
    svgEl("path", { class: "headset", d: "M26 -6 Q27 8 12 10" }, body);
  }
  if (o.accessory === "ball") {
    svgEl("circle", { cx: 34, cy: 24, r: 7, class: "ol thin", fill: "#F6F6F2" }, body);
    svgEl("circle", { cx: 34, cy: 24, r: 2.6, fill: "#15181C" }, body);
  }

  // Yeux : les pupilles bougent (voir le regard dans engine.ts)
  const eyes = svgEl("g", {}, body);
  const pupils = [-10, 10].map((ex) => {
    svgEl("circle", { cx: ex, cy: -8, r: 7.5, class: "eye" }, eyes);
    return { ex, el: svgEl("circle", { cx: ex, cy: -8, r: 3.4, class: "pupil" }, eyes) };
  });
  const mouth = svgEl(
    "path",
    { d: o.orch ? MOUTHS.done : MOUTHS.idle, class: o.orch ? "mouth light" : "mouth" },
    body,
  );

  let dot: SVGCircleElement | undefined;
  let check: SVGGElement | undefined;
  if (o.top) {
    dot = svgEl("circle", { cx: 25, cy: -28, r: 6, class: "ol thin pending" }, body);
    if (!reduceMotion) {
      svgEl(
        "animate",
        {
          attributeName: "r",
          values: "5;7.5;5",
          dur: "1.6s",
          begin: `${Math.random()}s`,
          repeatCount: "indefinite",
        },
        dot,
      );
    }
    check = svgEl("g", { style: "display:none" }, body);
    svgEl("circle", { cx: 25, cy: -28, r: 9, class: "ol thin done-badge" }, check);
    svgEl("path", { d: "M21 -28 L24 -25 L29.5 -31", class: "tick" }, check);
  }

  const labelY = 50 * o.scale + (o.sub ? 2 : 0);
  svgEl("text", { class: "label", y: labelY }, g).textContent = o.label;
  const statusEl = svgEl("text", { class: "status", y: labelY + (o.sub ? 15 : 18) }, g);
  statusEl.textContent = o.status ?? "";

  return {
    ...o,
    g,
    bob,
    eyes,
    pupils,
    mouth,
    statusEl,
    dot,
    check,
    mood: "idle",
    hop: 0,
    appear: o.appear ?? 1,
    phase: Math.random() * 6,
    blinkAt: performance.now() + 1500 + Math.random() * 3000,
  };
}

export function setMood(a: Agent, mood: Mood, status: string) {
  a.mood = mood;
  a.statusEl.textContent = status;
  if (!a.orch) a.mouth.setAttribute("d", MOUTHS[mood]);
}

export function markConsulted(a: Agent) {
  a.dot?.remove();
  a.dot = undefined;
  if (a.check) a.check.style.display = "";
}
