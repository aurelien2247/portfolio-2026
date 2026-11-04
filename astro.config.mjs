// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // L'adresse du site en ligne : Google reçoit ainsi des liens complets entre la version française
  // et l'anglaise (voir src/layouts/Base.astro).
  site: "https://aurelienmoignet.fr",
});
