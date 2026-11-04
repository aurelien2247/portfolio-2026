// Le nom affiché d'une techno. La clé (en français) sert aussi à trouver son logo (stackIcons) :
// seuls les quelques noms qui se traduisent changent en anglais.

import type { Lang } from "../i18n";

const EN: Record<string, string> = {
  "API d'extension VS Code": "VS Code extension API",
  "systèmes multi-agents": "multi-agent systems",
};

export const techName = (tech: string, lang: Lang) => (lang === "en" && EN[tech]) || tech;
