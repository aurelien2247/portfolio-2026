// Le plan du site pour Google : les deux pages, chacune avec sa version dans l'autre langue.
// Les adresses partent de `site` (astro.config.mjs).

import type { APIRoute } from "astro";
import { HOME, LANGS } from "../i18n";

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const alternates = LANGS.map(
    (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${url(HOME[l])}"/>`,
  ).join("");
  const pages = LANGS.map((l) => `<url><loc>${url(HOME[l])}</loc>${alternates}</url>`).join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages}</urlset>
`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
