// Les deux langues du site : le français à la racine (/), l'anglais sous /en/.
// Ce fichier contient les textes de l'interface ; le contenu (parcours, projets…) est dans src/data/.

export type Lang = "fr" | "en";
export const LANGS: Lang[] = ["fr", "en"];
export const HOME: Record<Lang, string> = { fr: "/", en: "/en/" };

/** Côté navigateur : la langue de la page, lue sur <html lang>. */
export const pageLang = (): Lang => (document.documentElement.lang === "en" ? "en" : "fr");

const fr = {
  // Page
  title: "Aurélien Moignet, ingénieur logiciel full-stack",
  description:
    "Ingénieur logiciel full-stack, en alternance à la DGFiP et à IMT Atlantique. Cherche un CDI ou CDD dès octobre 2027.",
  photoAlt: "Photo d'Aurélien Moignet",
  role: "Ingénieur logiciel full-stack.",
  intro: "En alternance à la DGFiP pour mon diplôme à IMT Atlantique.",
  looking: "Je cherche un CDI ou CDD dès octobre 2027.",
  quickOn: "Version rapide",
  quickOff: "Revenir aux agents",
  langLabel: "Langue du site",
  ogAlt:
    "Le portfolio d'Aurélien Moignet : son arbre d'agents animé répartit le travail entre ses sous-agents",

  // L'arbre
  treeLabel: "Mes agents se répartissent le travail",
  hint: "Choisis un sujet",
  score: "agents consultés",
  traceLabel: "Trace d'orchestration",
  traceTab: "trace",
  traceReady: "orchestrateur prêt, 5 agents en veille",
  answerTab: "réponse",
  orchestrator: "orchestrateur",
  ready: "prêt",
  idle: "en veille",
  clickMe: "Clique sur un de mes agents !",
  forYou: (k: string) => `${k}, c'est pour toi !`,
  receives: (q: string) => `reçoit « ${q} »`,
  delegates: "délègue",
  delegatesTo: (k: string) => `délègue → ${k}`,
  splits: "découpe",
  splitBubble: (n: number) => `je découpe en ${n} tâches`,
  splitLog: (n: number) => `découpe en ${n} sous-tâches`,
  launches: (k: string, n: number) => `${k} lance ${n} sous-agents…`,
  waits: (n: number) => `attend ${n} résultats`,
  searching: "cherche…",
  ok: "ok",
  resultSent: "résultat renvoyé",
  gathering: "je rassemble…",
  done: "terminé",
  answers: "répond",
  voila: "Voilà !",
  synthesis: (n: number, k: string, o: string) =>
    `${n} sous-agents mobilisés, synthèse par ${k}, transmise par l'${o}`,
  play: "jouer →",
  see: "voir →",
  copied: "Copié",
  copyFallback: "Sélectionné, fais Ctrl+C",
  aboutLabel: "Il y a une vraie IA derrière ?",

  // La fiche projet
  close: "Fermer",
  stackLabel: "stack technique",
  skillsLabel: "compétences",
  repo: "voir le code sur GitHub →",
  otherProjects: "Autres projets",
  prev: "← précédent",
  next: "suivant →",
  prevView: "Vue précédente",
  nextView: "Vue suivante",
  demo: "Démo",
  shot: (alt: string) => `Capture : ${alt}`,
  noShot: "capture à venir",

  // Les démos
  sextantScreen: "Écran de Sextant",
  sextantBoot: "Démarrer Sextant",
  sextantWeight: "le vrai noyau, émulé dans ton navigateur · ~640 Ko",
  sextantHint: "clique sur l'écran pour jouer",
  loading: "Chargement…",
  retry: "Réessayer",
  player: "J",
  move: "bouger",
  jump: "sauter",
  attacks: "attaques",
  left: "gauche",
  right: "droite",
  attack: (n: number) => `attaque ${n}`,
  padHint: "↑ valide dans les menus",

  // La version rapide
  quickLabel: "Version rapide",
  code: "code ↗",
  cv: "CV (PDF)",
  cvLink: "Mon CV en PDF",
};

const en: typeof fr = {
  title: "Aurélien Moignet, full-stack software engineer",
  description:
    "Full-stack software engineer, work-study student at the French tax administration (DGFiP) and IMT Atlantique. Looking for a permanent or fixed-term job from October 2027.",
  photoAlt: "Photo of Aurélien Moignet",
  role: "Full-stack software engineer.",
  intro: "Work-study at the DGFiP for my engineering degree at IMT Atlantique.",
  looking: "Looking for a permanent or fixed-term job from October 2027.",
  quickOn: "Quick view",
  quickOff: "Back to the agents",
  langLabel: "Site language",
  ogAlt:
    "Aurélien Moignet's portfolio: his animated agent tree sharing the work between sub-agents",

  treeLabel: "My agents share the work",
  hint: "Pick a topic",
  score: "agents consulted",
  traceLabel: "Orchestration trace",
  traceTab: "trace",
  traceReady: "orchestrator ready, 5 agents idle",
  answerTab: "answer",
  orchestrator: "orchestrator",
  ready: "ready",
  idle: "idle",
  clickMe: "Click one of my agents!",
  forYou: (k) => `${k}, this one's for you!`,
  receives: (q) => `receives “${q}”`,
  delegates: "delegating",
  delegatesTo: (k) => `delegates → ${k}`,
  splits: "splitting",
  splitBubble: (n) => `splitting into ${n} tasks`,
  splitLog: (n) => `splits into ${n} subtasks`,
  launches: (k, n) => `${k} launches ${n} sub-agents…`,
  waits: (n) => `waiting for ${n} results`,
  searching: "searching…",
  ok: "ok",
  resultSent: "result sent back",
  gathering: "putting it together…",
  done: "done",
  answers: "answers",
  voila: "Here you go!",
  synthesis: (n, k, o) => `${n} sub-agents involved, merged by ${k}, passed on by the ${o}`,
  play: "play →",
  see: "see →",
  copied: "Copied",
  copyFallback: "Selected, press Ctrl+C",
  aboutLabel: "Is there a real AI behind this?",

  close: "Close",
  stackLabel: "tech stack",
  skillsLabel: "skills",
  repo: "see the code on GitHub →",
  otherProjects: "Other projects",
  prev: "← previous",
  next: "next →",
  prevView: "Previous view",
  nextView: "Next view",
  demo: "Demo",
  shot: (alt) => `Screenshot: ${alt}`,
  noShot: "screenshot coming soon",

  sextantScreen: "Sextant screen",
  sextantBoot: "Boot Sextant",
  sextantWeight: "the real kernel, emulated in your browser · ~640 KB",
  sextantHint: "click the screen to play",
  loading: "Loading…",
  retry: "Try again",
  player: "P",
  move: "move",
  jump: "jump",
  attacks: "attacks",
  left: "left",
  right: "right",
  attack: (n) => `attack ${n}`,
  padHint: "↑ confirms in menus",

  quickLabel: "Quick view",
  code: "code ↗",
  cv: "Resume (PDF)",
  cvLink: "My resume as a PDF",
};

export const ui: Record<Lang, typeof fr> = { fr, en };

/** Côté navigateur : les textes de l'interface dans la langue de la page. */
export const strings = () => ui[pageLang()];
