// Contenu du portfolio : chaque agent répond à une question, ses sous-agents apportent chacun un morceau.
// C'est la seule source de vérité : l'arbre animé ET la version rapide sont générés à partir d'ici.
// Les textes anglais sont dans agents.en.ts ; content.ts donne le contenu dans la bonne langue.

import type { ImageMetadata } from "astro";
import imtLogo from "../assets/imt-atlantique.png";
import joliotLogo from "../assets/joliot-curie.png";
import ldtLogo from "../assets/felix-le-dantec.png";
import dgfipShot1 from "../assets/image-system-multi-agent-DGFIP-1.jpeg";
import dgfipShot2 from "../assets/image-system-multi-agent-DGFIP-2.jpeg";
import dgfipLogo from "../assets/logo-dgfip-embleme.png";
import meetmagnetLogo from "../assets/logo-meetmagnet-embleme.png";
import mewsIcon from "../assets/mews.webp";
import p3Logo from "../assets/logo-p3-recadre.png";
import imtRoundLogo from "../assets/logo-imt-rond.png";
import imtventaireLogo from "../assets/logo-512.png";
import imtventaireScreens from "../assets/imtventaire-ecrans-finis.jpg";
import meetmagnetShot from "../assets/meetmagnet-architecture.jpg";
import adonisIcon from "../assets/icons/adonis.svg";
import apifyIcon from "../assets/icons/apify.svg";
import astroIcon from "../assets/icons/astro.svg";
import cIcon from "../assets/icons/c.svg";
import claudeIcon from "../assets/icons/claude.svg";
import cppIcon from "../assets/icons/cpp.svg";
import dartIcon from "../assets/icons/dart.svg";
import dockerIcon from "../assets/icons/docker.svg";
import figmaIcon from "../assets/icons/figma.svg";
import flutterIcon from "../assets/icons/flutter.svg";
import gitIcon from "../assets/icons/git.svg";
import javaIcon from "../assets/icons/java.svg";
import jsIcon from "../assets/icons/js.svg";
import kotlinIcon from "../assets/icons/kotlin.svg";
import n8nIcon from "../assets/icons/n8n.svg";
import openrouterIcon from "../assets/icons/openrouter.svg";
import laravelIcon from "../assets/icons/laravel.svg";
import phpIcon from "../assets/icons/php.svg";
import postgresIcon from "../assets/icons/postgres.svg";
import pythonIcon from "../assets/icons/python.svg";
import reactIcon from "../assets/icons/react.svg";
import springIcon from "../assets/icons/spring.svg";
import tailwindIcon from "../assets/icons/tailwind.svg";
import tsIcon from "../assets/icons/ts.svg";
import viteIcon from "../assets/icons/vite.svg";
import vscodeIcon from "../assets/icons/vscode.svg";
import angularIcon from "../assets/icons/angular.svg";
import cssIcon from "../assets/icons/css.svg";
import githubIcon from "../assets/icons/github.svg";
import htmlIcon from "../assets/icons/html.svg";
import jiraIcon from "../assets/icons/jira.svg";
import nodejsIcon from "../assets/icons/nodejs.svg";
import notionIcon from "../assets/icons/notion.svg";
import npmIcon from "../assets/icons/npm.svg";
import postmanIcon from "../assets/icons/postman.svg";
import qtIcon from "../assets/icons/qt.svg";

export interface SubAgent {
  /** Identifiant ; c'est aussi le nom affiché sous le sous-agent dans l'arbre, sauf si `name` est donné. */
  id: string;
  /** Nom affiché sous le sous-agent, quand il diffère de l'id (version anglaise). */
  name?: string;
  title: string;
  /** HTML de confiance (écrit à la main), affiché dans la réponse. */
  html: string;
  /** Champs optionnels, utilisés par la réponse en « git log » (parcours). */
  when?: string;
  place?: string;
  logo?: ImageMetadata;
  badge?: string;
  tags?: string[];
  /** Fiche projet : la stack technique (langages, frameworks, API). Les `tags` y sont les compétences.
   *  Ailleurs (réponse « Ma stack ») : les technos affichées en logos sous le titre. */
  stack?: string[];
  /** Déplié par défaut dans le « git log ». */
  open?: boolean;
  /** Version rapide : le projet en une phrase (le `html` complet reste pour la fiche). */
  short?: string;
  /** Fiche projet : nom complet de l'organisation, affiché dans l'onglet (sinon l'id). */
  org?: string;
  /** Fiche projet : lien vers le code sur GitHub. */
  repo?: string;
  /** Fiche projet : émulation jouable (voir src/scripts/agent-tree/demos.ts)… */
  demo?: "smash" | "spacex" | "recettes";
  /** …sinon des maquettes ou captures. Sans les deux, l'écran affiche « capture à venir ».
   *  `onBlack` : image à fond noir (un logo), l'écran passe en noir pour qu'elle s'y fonde. */
  shots?: { src: ImageMetadata; alt: string; onBlack?: boolean }[];
}

export interface Topic {
  /** Identifiant ; c'est aussi le nom de l'agent dans l'arbre, sauf si `name` est donné. */
  key: string;
  /** Nom affiché de l'agent, quand il diffère de la clé (version anglaise). */
  name?: string;
  question: string;
  title: string;
  /** Couleur CSS du corps de l'agent (variable CSS ou motif SVG). */
  color: string;
  accessory?: "ball";
  /** Forme de la réponse : liste simple par défaut, historique façon git log, ou sommaire de projets
   *  (chaque ligne ouvre une fiche projet en grand, avec écran, stack et description). */
  layout?: "log" | "projects";
  subs: SubAgent[];
}

/** Couleur unie d'un agent : la marinière (motif SVG) devient bleu marine, pour le CSS et les paquets. */
export const solidColor = (color: string) => color.replace("url(#mariniere)", "var(--navy)");
/** Texte posé sur cette couleur : clair sur le bleu marine (trop foncé pour --ink), sombre ailleurs. */
export const inkOn = (color: string) => (color === "url(#mariniere)" ? "var(--fg)" : "var(--ink)");

/** Logo de chaque techno de la stack (icônes de skillicons.dev, copiées dans src/assets/icons ;
 *  claude, n8n, openrouter et jira refaits au même format à partir de Simple Icons, apify depuis apify.com).
 *  Une techno sans logo s'affiche en simple étiquette. */
export const stackIcons: Record<string, ImageMetadata> = {
  JavaScript: jsIcon,
  "API d'extension VS Code": vscodeIcon,
  Python: pythonIcon,
  PHP: phpIcon,
  Laravel: laravelIcon,
  "C++": cppIcon,
  TypeScript: tsIcon,
  React: reactIcon,
  Vite: viteIcon,
  "Tailwind CSS": tailwindIcon,
  AdonisJS: adonisIcon,
  PostgreSQL: postgresIcon,
  Docker: dockerIcon,
  Flutter: flutterIcon,
  Dart: dartIcon,
  Kotlin: kotlinIcon,
  "Claude Code": claudeIcon,
  Apify: apifyIcon,
  OpenRouter: openrouterIcon,
  n8n: n8nIcon,
  Java: javaIcon,
  C: cIcon,
  Spring: springIcon,
  Astro: astroIcon,
  Git: gitIcon,
  Figma: figmaIcon,
  Angular: angularIcon,
  CSS: cssIcon,
  GitHub: githubIcon,
  HTML: htmlIcon,
  "VS Code": vscodeIcon,
  Jira: jiraIcon,
  "Node.js": nodejsIcon,
  Notion: notionIcon,
  npm: npmIcon,
  Postman: postmanIcon,
  Qt: qtIcon,
};

export const EMAIL = "aurelien.moignet@imt-atlantique.net";
export const LINKEDIN = "https://www.linkedin.com/in/aur%C3%A9lien-moignet-a065921b4/";
export const GITHUB = "https://github.com/aurelien2247";
/** Le CV en PDF, une version par langue, dans public/. Ce sont les versions sans le téléphone :
 *  la source LaTeX est hors du dépôt (~/Projects/cv, fichiers cv-site.tex et cv-en-site.tex).
 *  `download` : le nom du fichier téléchargé. */
export const CV = {
  fr: { href: "/cv-aurelien-moignet.pdf", download: "CV-Aurelien-Moignet.pdf" },
  en: { href: "/resume-aurelien-moignet.pdf", download: "Resume-Aurelien-Moignet.pdf" },
};
/** Les attributs d'un lien vers le CV : il se télécharge ; si le navigateur ne sait pas télécharger
 *  (certains téléphones), il s'ouvre dans un nouvel onglet, et le portfolio reste ouvert. */
export const cvLink = (lang: keyof typeof CV) =>
  `href="${CV[lang].href}" download="${CV[lang].download}" target="_blank" rel="noopener"`;

/** La bulle du « ? » après les pastilles : dit que les agents de la page sont une mise en scène. */
export const ABOUT_DEMO =
  "Ce portfolio ne repose pas sur de vrais agents IA ni sur de vrais LLM : tout suit un scénario bien précis.";

export const topics: Topic[] = [
  {
    key: "parcours",
    question: "D'où je viens ?",
    title: "Mon parcours",
    color: "var(--c-parcours)",
    layout: "log",
    subs: [
      {
        id: "imt",
        title: "IMT Atlantique",
        place: "Ingénierie logicielle",
        when: "2024 → 2027",
        logo: imtLogo,
        badge: "GPA 3.61",
        open: true,
        html: "C'est une formation d'ingénieur en alternance, spécialisée dans le logiciel. J'y apprends à concevoir des applications de bout en bout : architecture, méthodes agiles, déploiements… Mon alternance se fait à la DGFiP, à Nantes.",
        tags: ["conception logicielle", "archi distribuée", "DevOps", "agile", "mobile"],
      },
      {
        id: "ats",
        title: "Lycée Joliot-Curie",
        place: "Prépa ATS",
        when: "2023 → 2024",
        logo: joliotLogo,
        html: "Une année intensive de maths, physique et sciences de l'ingénieur, pour rattraper le niveau d'une école d'ingénieur après un BTS.<br /><strong>Admis à IMT Atlantique.</strong>",
        tags: ["maths", "physique", "algorithmique"],
      },
      {
        id: "bts",
        title: "Lycée Félix Le Dantec",
        place: "BTS SNIR",
        when: "2021 → 2023",
        logo: ldtLogo,
        html: "C'est un BTS d'informatique et de réseaux. J'y ai appris à coder en C et en C++, à configurer des réseaux, à concevoir des bases de données et à programmer des cartes électroniques avec des capteurs.",
        tags: ["C", "C++", "JavaScript", "réseaux", "IoT", "bases de données"],
      },
    ],
  },
  {
    key: "projets",
    question: "Quels sont mes projets ?",
    title: "Expériences et projets",
    color: "var(--c-projets)",
    layout: "projects",
    subs: [
      {
        id: "dgfip",
        title: "Système multi-agents souverain",
        short:
          "Une extension VS Code où des agents experts, pilotés par un orchestrateur, se partagent le travail sur des LLM hébergés en interne.",
        org: "Direction Générale des Finances Publiques",
        logo: dgfipLogo,
        place: "DGFiP, Nantes",
        when: "2024 → 2027",
        badge: "alternance",
        html: "<span class=\"step\"><strong>Année 1.</strong> Une extension VS Code avec un RAG : on interroge des documents directement depuis l'éditeur, via une API souveraine qui donne accès à des LLM hébergés en interne. Les données sensibles ne sortent jamais du réseau de la DGFiP.</span><span class=\"step\"><strong>Année 2.</strong> Avec mon tuteur, on a repensé l'architecture : des agents experts, chacun sur un domaine précis, qui se délèguent le travail sous la direction d'un orchestrateur. Leurs prompts sont générés par l'IA, puis ajustables par le développeur.</span><span class=\"step\"><strong>Aujourd'hui</strong>, l'extension fonctionne et permet de créer des agents adaptés à n'importe quel projet.</span>",
        stack: ["JavaScript", "API d'extension VS Code", "Python"],
        tags: ["RAG", "systèmes multi-agents", "orchestration", "LLM hébergés en interne"],
        shots: [
          {
            src: dgfipShot2,
            alt: "Le panneau de l'extension : actions rapides (autocomplétion COBOL, indexation en base, agents personnalisés, orchestrateur) et choix de l'agent",
          },
          {
            src: dgfipShot1,
            alt: "L'extension dans VS Code : une conversation avec l'agent chef de projet, qui fait appel à des experts et à des outils (contenu masqué)",
          },
        ],
      },
      {
        id: "p3",
        title: "Intégration Mews PMS",
        short:
          "Seul en R&D, j'ai branché le moteur de réservation sur Mews : réservation, paiement conforme PCI, check-in et check-out en ligne.",
        org: "P3 Hotel Software",
        logo: p3Logo,
        place: "P3 Hotel Software, Dublin",
        when: "2026",
        badge: "stage",
        html: '<span class="step"><strong>Le contexte.</strong> P3 édite un moteur de réservation pour hôtels, historiquement branché sur Oracle OPERA. Seul dans l\'équipe R&D, je l\'ai connecté à Mews, un autre PMS.</span><span class="step"><strong>Le résultat.</strong> Tout le parcours client fonctionne avec Mews : on réserve une ou plusieurs chambres avec des disponibilités à jour en temps réel, on paie de façon sécurisée et conforme PCI (acomptes et remboursements compris), puis on fait son check-in et son check-out en ligne.</span><span class="step"><strong>Claude Code.</strong> J\'ai appris à travailler avec Claude Code, en créant des agents et des skills propres à l\'entreprise, tout en revoyant chaque fonctionnement avec mon tuteur.</span>',
        stack: ["PHP", "Laravel", "Claude Code"],
        shots: [
          { src: mewsIcon, alt: "Logo de Mews, le PMS hôtelier intégré à P3", onBlack: true },
        ],
        tags: [
          "intégration d'API tierces",
          "paiements PCI",
          "synchronisation en temps réel",
          "autonomie",
        ],
      },
      {
        id: "smash",
        title: "Smash",
        short:
          "Un jeu de combat 8 bits à deux joueurs, en bare-metal sur Sextant, un petit noyau d'école.",
        org: "IMT Atlantique",
        logo: imtRoundLogo,
        badge: "projet d'école",
        demo: "smash",
        html: "<span class=\"step\"><strong>Le jeu.</strong> Un jeu de combat 8 bits à deux sur le même clavier, inspiré de Super Smash Bros : 7 personnages, 2 cartes, des bonus et des météorites. Chaque coup encaissé fait voler plus loin, le but est d'éjecter l'autre de l'écran.</span><span class=\"step\"><strong>Le projet.</strong> Tout tourne en bare-metal sur Sextant, un petit noyau d'école, sans OS ni bibliothèque standard : pilotes clavier et timer, affichage VGA 320×200 en 256 couleurs (8 bits par pixel), et trois threads synchronisés par spinlock (entrées, jeu, repos).</span>",
        stack: ["C++", "Sextant", "VGA"],
        tags: ["bare-metal", "jeu vidéo"],
        repo: "https://github.com/aurelien2247/smash",
      },
      {
        id: "meetmagnet",
        title: "Scraper universel",
        short:
          "Chef de projet d'une équipe de six : un scraper universel guidé par IA, en production chez MeetMagnet.",
        org: "MeetMagnet",
        logo: meetmagnetLogo,
        place: "MeetMagnet",
        when: "2026",
        badge: "projet startup",
        html: '<span class="step"><strong>Le contexte.</strong> MeetMagnet repère des signaux d\'achat (publications, recrutements, levées de fonds…) sur des dizaines de sites, mais chaque site demandait son propre scraper.</span><span class="step"><strong>Mon rôle.</strong> Chef de projet d\'une équipe de six, sur dix jours : objectifs intermédiaires, backlog partagé et répartition des tâches.</span><span class="step"><strong>La solution.</strong> Un scraper universel en deux briques. Discover, la partie IA, trouve seule l\'URL de recherche d\'un site inconnu et le chemin vers chaque information. Runner réutilise ces réglages pour scraper chaque jour.</span><span class="step"><strong>Le résultat.</strong> Il tourne en production chez MeetMagnet, pour environ 9 € par mois et par source.</span>',
        stack: ["JavaScript", "Apify", "OpenRouter", "n8n"],
        tags: [
          "gestion de projet",
          "méthode agile",
          "web scraping",
          "prompt engineering",
          "IA vision",
        ],
        shots: [
          {
            src: meetmagnetShot,
            alt: "Schéma de l'architecture : Discover (IA) trouve l'URL de recherche et le chemin vers chaque élément, Runner scrape le site avec ces réglages et stocke les résultats",
          },
        ],
      },
      {
        id: "imtventaire",
        title: "IMT'ventaire",
        short:
          "À quatre, en sprints agiles : une appli web d'inventaire par code-barres, en production à l'IMT.",
        org: "IMT Atlantique",
        logo: imtventaireLogo,
        when: "2025",
        badge: "projet d'école",
        html: '<span class="step"><strong>Le contexte.</strong> Le client utilisait un logiciel d\'inventaire ancien, sans support technique. Il fallait une alternative moderne, fiable et maintenable, adaptée à ses besoins.</span><span class="step"><strong>La solution.</strong> À quatre, en deux sprints agiles avec un Product Owner, une appli web installable sur téléphone (PWA) : on scanne le code-barres d\'un article, on retrouve le matériel par bâtiment et par pièce, on en ajoute de nouveaux.</span><span class="step"><strong>Le résultat.</strong> L\'appli a été mise en production sur un serveur de l\'IMT, avec les vraies données de l\'inventaire.</span>',
        stack: [
          "TypeScript",
          "React",
          "Vite",
          "Tailwind CSS",
          "AdonisJS",
          "PostgreSQL",
          "Docker",
          "Python",
        ],
        tags: ["PWA", "scan de codes-barres", "API REST", "méthode agile", "travail en équipe"],
        repo: "https://github.com/aurelien2247/IMTVENTAIRE",
        shots: [
          {
            src: imtventaireScreens,
            alt: "Les écrans finis d'IMT'ventaire sur iPhone : le formulaire d'ajout, l'inventaire par bâtiment et le scanner pointé sur une chaise",
          },
        ],
      },
      {
        id: "spacex",
        title: "Les lancements SpaceX",
        short: "Une appli Flutter qui liste les lancements de SpaceX. Le but : apprendre Flutter.",
        org: "IMT Atlantique",
        logo: imtRoundLogo,
        when: "2025",
        badge: "projet d'école",
        html: "Une appli mobile en Flutter qui affiche les lancements de SpaceX à partir de leur API publique, du plus récent au plus ancien, en liste ou en grille. Chaque mission a sa fiche détaillée : boosters, médias et liens. Le but : apprendre Flutter.",
        stack: ["Flutter", "Dart"],
        tags: ["appli mobile", "API REST", "design web"],
        repo: "https://github.com/aurelien2247/space_x",
        demo: "spacex",
      },
      {
        id: "recettes",
        title: "Appli de recettes",
        short:
          "Une appli Android de recettes en couches, avec le pattern MVI. Le but : apprendre Kotlin.",
        org: "IMT Atlantique",
        logo: imtRoundLogo,
        when: "2026",
        badge: "projet d'école",
        html: "Une appli Android de recettes : on parcourt les catégories, puis les plats, puis le détail d'une recette, à partir de l'API TheMealDB. Le code est organisé en couches (données, domaine, interface), avec des use cases et le pattern MVI. Le but : apprendre Kotlin.",
        stack: ["Kotlin"],
        tags: ["Android", "clean architecture", "MVI"],
        repo: "https://github.com/aurelien2247/aurelien_moignet_appli_mobile",
        demo: "recettes",
      },
    ],
  },
  {
    key: "stack",
    question: "Quelle est ma stack ?",
    title: "Ma stack",
    color: "var(--c-stack)",
    subs: [
      {
        id: "langages",
        title: "Langages",
        html: "",
        stack: [
          "TypeScript",
          "JavaScript",
          "Java",
          "PHP",
          "Python",
          "C",
          "C++",
          "Kotlin",
          "Dart",
          "HTML",
          "CSS",
        ],
      },
      {
        id: "frameworks",
        title: "Frameworks",
        html: "",
        stack: [
          "React",
          "Angular",
          "Node.js",
          "Spring",
          "Laravel",
          "AdonisJS",
          "Flutter",
          "Qt",
          "Tailwind CSS",
          "Astro",
        ],
      },
      {
        id: "ia",
        title: "IA",
        html: "",
        stack: ["Claude Code", "RAG", "systèmes multi-agents"],
      },
      {
        id: "outils",
        title: "Au quotidien",
        html: "",
        stack: [
          "Git",
          "GitHub",
          "Docker",
          "PostgreSQL",
          "Postman",
          "npm",
          "VS Code",
          "Jira",
          "Figma",
          "Notion",
        ],
      },
    ],
  },
  {
    key: "perso",
    question: "Et en dehors du code ?",
    title: "En dehors du code",
    color: "url(#mariniere)",
    accessory: "ball",
    subs: [
      { id: "sport", title: "Sport", html: "15 ans de football. Natation et basket en jeunes." },
      {
        id: "voyages",
        title: "Voyages",
        html: "L'Espagne (Barcelone, Madrid, Salamanque), Londres, et Dublin pour mon stage.",
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
        html: "CDI ou CDD d'ingénieur logiciel full-stack, à partir d'<strong>octobre 2027</strong>.",
      },
      {
        id: "email",
        title: "E-mail",
        html: `<span class="copy"><code>${EMAIL}</code><button class="btn" type="button" data-copy="${EMAIL}">Copier</button></span>`,
      },
      {
        id: "cv",
        title: "CV",
        html: `<a ${cvLink("fr")}>Télécharger mon CV</a>`,
      },
      {
        id: "liens",
        title: "Ailleurs",
        html: `<a href="${LINKEDIN}">LinkedIn</a> et <a href="${GITHUB}">GitHub</a>`,
      },
    ],
  },
];
