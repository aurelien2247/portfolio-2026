// Le contenu dans la langue demandée : agents.ts tel quel en français, avec les textes de
// agents.en.ts par-dessus en anglais.

import type { Lang } from "../i18n";
import { ABOUT_DEMO, topics, type Topic } from "./agents";
import { aboutDemoEn, topicsEn } from "./agents.en";

export function getTopics(lang: Lang): Topic[] {
  if (lang === "fr") return topics;
  return topics.map((t) => {
    const { subs: subTexts = {}, ...text } = topicsEn[t.key] ?? {};
    return {
      ...t,
      ...text,
      subs: t.subs.map((s) => {
        const { alts, ...sub } = subTexts[s.id] ?? {};
        return {
          ...s,
          ...sub,
          shots: s.shots?.map((shot, i) => ({ ...shot, alt: alts?.[i] ?? shot.alt })),
        };
      }),
    };
  });
}

export const aboutDemo = (lang: Lang) => (lang === "en" ? aboutDemoEn : ABOUT_DEMO);
