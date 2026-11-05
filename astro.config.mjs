// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // L'adresse du site en ligne, avec www comme sur Vercel (aurelienmoignet.fr y redirige).
  // Google reçoit ainsi des liens complets entre la version française et l'anglaise
  // (voir src/layouts/Base.astro), et le plan du site (src/pages/sitemap.xml.ts).
  site: "https://www.aurelienmoignet.fr",
});
