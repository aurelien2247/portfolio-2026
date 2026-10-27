// Contenu du portfolio : chaque agent répond à une question, ses sous-agents apportent chacun un morceau.
// C'est la seule source de vérité : l'arbre animé ET la version rapide sont générés à partir d'ici.

export interface SubAgent {
  /** Nom court affiché sous le sous-agent dans l'arbre. */
  id: string;
  title: string;
  /** HTML de confiance (écrit à la main), affiché dans la réponse. */
  html: string;
}

export interface Topic {
  key: string;
  question: string;
  title: string;
  /** Couleur CSS du corps de l'agent (variable CSS ou motif SVG). */
  color: string;
  accessory?: "ball";
  subs: SubAgent[];
}

export const EMAIL = "aurelien.moignet@imt-atlantique.net";
export const LINKEDIN = "https://www.linkedin.com/in/aur%C3%A9lien-moignet-a065921b4/";
export const GITHUB = "https://github.com/aurelien2247";

export const topics: Topic[] = [
  {
    key: "parcours",
    question: "D'où tu viens ?",
    title: "Mon parcours",
    color: "var(--c-parcours)",
    subs: [
      {
        id: "bts",
        title: "BTS SNIR",
        html: "Systèmes numériques, informatique et réseaux. J'ai commencé par le bas de la pile.",
      },
      {
        id: "ats",
        title: "Prépa ATS · Lycée Joliot-Curie, Rennes · 2023–2024",
        html: "Un an de maths et de physique pour viser une école d'ingénieurs. Admis à IMT Atlantique.",
      },
      {
        id: "imt",
        title: "IMT Atlantique · 2024–2027",
        html: "Ingénieur en ingénierie logicielle, en alternance à la DGFiP à Nantes.",
      },
      {
        id: "dublin",
        title: "Dublin · été 2026",
        html: "Stage chez P3 Hotel Software, dans le coworking Dogpatch Labs.",
      },
    ],
  },
  {
    key: "projets",
    question: "Qu'est-ce que tu as construit ?",
    title: "Ce que j'ai construit",
    color: "var(--c-projets)",
    subs: [
      {
        id: "dgfip",
        title: "Système multi-agents souverain · DGFiP",
        html: "Extension VS Code. D'abord un RAG sur des LLM hébergés en interne, puis une architecture où des agents spécialisés se délèguent le travail. Les données ne sortent jamais du réseau.",
      },
      {
        id: "p3",
        title: "Intégration Mews PMS · P3 Hotel Software, Dublin",
        html: "Réservation en temps réel et multi-chambres, paiements PCI (tokenisation, acomptes, remboursements), check-in en ligne et borne en libre-service. En Laravel.",
      },
      {
        id: "meetmagnet",
        title: "Scraper de presse · MeetMagnet",
        html: "Récupère au plus vite les dernières actus de nombreux sites (Le Monde, Le Figaro, Ouest-France…) pour repérer de futurs clients.",
      },
      {
        id: "smash",
        title: "Smash · projet d'école",
        html: "Jeu de combat à deux joueurs en C++, en bare-metal sur le micro-noyau Sextant, en VGA 320×200.",
      },
      {
        id: "llm",
        title: "Un LLM depuis zéro",
        html: "Tokenizer, mécanisme d'attention, entraînement et génération, en Python.",
      },
    ],
  },
  {
    key: "stack",
    question: "Tu codes avec quoi ?",
    title: "Ma stack",
    color: "var(--c-stack)",
    subs: [
      { id: "langages", title: "Langages", html: "TypeScript, Java, PHP, Python, C/C++, Kotlin" },
      {
        id: "back",
        title: "Back-end",
        html: "Spring, Laravel, intégrations d'API tierces, paiements",
      },
      { id: "ia", title: "IA", html: "RAG, systèmes multi-agents, LLM hébergés en interne" },
      { id: "outils", title: "Au quotidien", html: "Git, Claude Code, Figma" },
    ],
  },
  {
    key: "perso",
    question: "Tu es comment en équipe ?",
    title: "En équipe",
    color: "url(#mariniere)",
    accessory: "ball",
    subs: [
      { id: "bretagne", title: "Breton", html: "D'où la marinière." },
      {
        id: "foot",
        title: "Footballeur",
        html: "Beaucoup de foot. Mes proches me décrivent comme <strong>amusant, festif et de bon conseil</strong>.",
      },
      {
        id: "asso",
        title: "Vie associative",
        html: "Responsable communication du Bureau des Arts, co-organisateur d'un voyage culturel pour 60 étudiants, équipe du gala.",
      },
    ],
  },
  {
    key: "contact",
    question: "On peut se parler ?",
    title: "On se parle ?",
    color: "var(--c-contact)",
    subs: [
      {
        id: "dispo",
        title: "Disponibilité",
        html: "CDI ou CDD d'ingénieur logiciel full-stack, à partir de <strong>septembre 2027</strong>, en France ou en Suisse.",
      },
      {
        id: "email",
        title: "E-mail",
        html: `<span class="copy"><code>${EMAIL}</code><button class="btn" type="button" data-copy="${EMAIL}">Copier</button></span>`,
      },
      {
        id: "liens",
        title: "Ailleurs",
        html: `<a href="${LINKEDIN}">LinkedIn</a> · <a href="${GITHUB}">GitHub</a>`,
      },
    ],
  },
];
