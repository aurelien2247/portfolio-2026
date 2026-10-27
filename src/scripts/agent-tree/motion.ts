// Petits outils d'animation, tous désactivés si l'utilisateur préfère réduire les mouvements.

export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));

export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Appelle `frame(t)` avec t de 0 à 1 pendant `ms` millisecondes. */
export const tween = (ms: number, frame: (t: number) => void) =>
  new Promise<void>((resolve) => {
    if (reduceMotion) {
      frame(1);
      return resolve();
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      frame(t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
