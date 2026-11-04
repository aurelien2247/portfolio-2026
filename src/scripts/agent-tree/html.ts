// Échappe un texte avant de l'insérer dans du HTML (données d'API ou d'archive dans les démos).
const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c]);
