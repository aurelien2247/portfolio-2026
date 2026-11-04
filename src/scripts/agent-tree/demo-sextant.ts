// Le vrai Smash, sur le vrai noyau Sextant, dans un PC x86 émulé par v86 (WebAssembly).
// Rien n'est téléchargé avant le clic sur « Démarrer » : v86 + BIOS + noyau ≈ 640 Ko compressés.
//
// sextant.elf est compilé depuis github.com/aurelien2247/smash (g++ i686, Docker), avec deux retouches
// pour démarrer hors de la VM de l'école, sans toucher au jeu :
// - hal/multiboot.S installe la GDT plate de GRUB 0.97 (code 0x08, données 0x10), que Sextant suppose ;
//   GRUB 2 et le chargeur multiboot de v86 en laissent une autre, et le noyau plantait au premier IRQ.
// - vga/vga.cpp : le registre CRTC 0x14 passe de 0x1F à 0x40, la vraie valeur du mode 13h.
//   QEMU l'ignore en 256 couleurs, v86 non (il n'affichait qu'une colonne sur quatre).

import "../../styles/demos/smash.css";
import wasmUrl from "v86/build/v86.wasm?url";
import fallbackWasmUrl from "v86/build/v86-fallback.wasm?url";
import { pageLang, strings } from "../../i18n";
import kernelUrl from "../../assets/sextant/sextant.elf?url";
import biosUrl from "../../assets/sextant/seabios.bin?url";
import vgaBiosUrl from "../../assets/sextant/vgabios.bin?url";

// Les touches du jeu (smash.cpp lit les scancodes, donc la position des touches : Q/D/Z en AZERTY).
// En anglais, on suppose un clavier QWERTY : les mêmes touches s'appellent A/D/W.
const QWERTY: Record<string, string> = { Q: "A", Z: "W" };
const KEYS = [
  ["1", [["Q", "D"], "move"], [["Z"], "jump"], [["E", "R", "T"], "attacks"]],
  ["2", [["←", "→"], "move"], [["↑"], "jump"], [["J", "K", "L"], "attacks"]],
] as const;

// Sur écran tactile, une manette par joueur : les mêmes touches, en boutons (codes de KeyboardEvent.code).
// Dans les menus, « sauter » valide (Z pour J1, ↑ pour J2).
const PADS = [
  ["1", ["KeyA", "KeyW", "KeyD"], ["KeyE", "KeyR", "KeyT"]],
  ["2", ["ArrowLeft", "ArrowUp", "ArrowRight"], ["KeyJ", "KeyK", "KeyL"]],
] as const;

// Le clavier du PC émulé : on lui envoie nous-mêmes les scancodes (jeu 1) des touches tapées quand
// l'écran a le focus. L'adaptateur clavier de v86, lui, écoute toute la fenêtre dès le chargement.
const SCANCODES: Record<string, number[]> = {
  ArrowUp: [0xe0, 0x48],
  ArrowLeft: [0xe0, 0x4b],
  ArrowRight: [0xe0, 0x4d],
  ArrowDown: [0xe0, 0x50],
  Space: [0x39],
  Enter: [0x1c],
  Backspace: [0x0e],
  ShiftLeft: [0x2a],
  ShiftRight: [0x36],
  ControlLeft: [0x1d],
};
[
  ["QWERTYUIOP", 0x10],
  ["ASDFGHJKL", 0x1e],
  ["ZXCVBNM", 0x2c],
  ["1234567890", 0x02],
].forEach(([keys, first]) =>
  [...(keys as string)].forEach(
    (k, i) => (SCANCODES[/\d/.test(k) ? `Digit${k}` : `Key${k}`] = [(first as number) + i]),
  ),
);
// Relâcher une touche : le même code avec le bit 7 levé (le préfixe 0xE0 des flèches reste)
const release = (codes: number[]) => codes.map((c, i) => (i === codes.length - 1 ? c | 0x80 : c));

const keycaps = (ui: ReturnType<typeof strings>, qwerty: boolean) =>
  KEYS.map(
    ([who, ...groups]) =>
      `<p><b>${ui.player}${who}</b>${groups
        .map(
          ([keys, what]) =>
            `<span>${keys.map((k) => `<kbd>${(qwerty && QWERTY[k]) || k}</kbd>`).join("")} ${ui[what]}</span>`,
        )
        .join("")}</p>`,
  ).join("");

const pads = (ui: ReturnType<typeof strings>) =>
  PADS.map(([who, [left, jump, right], attacks]) => {
    const key = (code: string, label: string, name: string) =>
      `<button type="button" data-code="${code}" aria-label="${ui.player}${who} ${name}">${label}</button>`;
    return `<div class="sxt-pad" data-player="${who}">
      <b>${ui.player}${who}</b>
      <div>${key(left, "←", ui.left)}${key(jump, "↑", ui.jump)}${key(right, "→", ui.right)}</div>
      <div>${attacks.map((code, i) => key(code, String(i + 1), ui.attack(i + 1))).join("")}</div>
    </div>`;
  }).join("");

export function mountSextant(root: HTMLElement) {
  const ui = strings();
  const touch = matchMedia("(pointer: coarse)").matches;
  root.insertAdjacentHTML(
    "beforeend",
    `<div class="sxt">
      <div class="sxt-screen" data-own-keys tabindex="-1" aria-label="${ui.sextantScreen}">
        <div class="sxt-text"></div>
        <canvas></canvas>
        <div class="sxt-cover">
          <p class="sxt-name">SEXTANT</p>
          <button type="button" class="btn demo-btn" data-boot>${ui.sextantBoot}</button>
          <p class="sxt-weight">${ui.sextantWeight}</p>
        </div>
        <p class="sxt-hint" hidden>${ui.sextantHint}</p>
      </div>
      ${
        touch
          ? `<div class="sxt-pads">${pads(ui)}</div><p class="sxt-pad-hint">${ui.padHint}</p>`
          : `<div class="sxt-keys">${keycaps(ui, pageLang() === "en")}</div>`
      }
    </div>`,
  );
  const sxt = root.querySelector<HTMLElement>(".sxt")!;
  const screen = root.querySelector<HTMLElement>(".sxt-screen")!;
  const cover = root.querySelector<HTMLElement>(".sxt-cover")!;
  const hint = root.querySelector<HTMLElement>(".sxt-hint")!;
  const boot = root.querySelector<HTMLButtonElement>("[data-boot]")!;

  let emu: any = null; // la machine en cours (une seule à la fois)
  let running = false; // « emulator-loaded » reçu : destroy() n'est sûr qu'à partir de là
  let alive = true; // passe à false quand la fiche démonte la démo
  // Les touches enfoncées, au clavier et sur la manette : chacun ne relâche que les siennes
  const keys = new Set<string>();
  const fingers = new Set<string>();
  const press = (code: string, held: Set<string>) => {
    if (!running || held.has(code)) return;
    held.add(code);
    emu.keyboard_send_scancodes(SCANCODES[code]);
  };
  const lift = (code: string, held: Set<string>) => {
    if (held.delete(code)) emu?.keyboard_send_scancodes(release(SCANCODES[code]));
  };

  // Le clavier n'appartient au jeu que quand l'écran a le focus : sinon les flèches changeraient
  // de projet et Échap ne fermerait plus la fiche. On relâche tout en perdant le focus.
  screen.addEventListener("focus", () => {
    screen.classList.add("is-playing");
    hint.hidden = true;
  });
  screen.addEventListener("blur", () => {
    screen.classList.remove("is-playing");
    hint.hidden = !running || touch;
    keys.forEach((code) => lift(code, keys));
  });
  screen.addEventListener("pointerdown", () => running && screen.focus());
  screen.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return screen.blur(); // rend Échap à la fiche, qui se ferme
    if (!running || !SCANCODES[e.code]) return;
    e.preventDefault();
    press(e.code, keys);
  });
  screen.addEventListener("keyup", (e) => {
    if (!running || !SCANCODES[e.code]) return;
    e.preventDefault();
    lift(e.code, keys);
  });

  // La manette : un bouton reste enfoncé tant que le doigt est dessus, plusieurs doigts à la fois
  const pad = root.querySelector<HTMLElement>(".sxt-pads");
  const padKey = (e: Event) => (e.target as Element).closest<HTMLElement>("[data-code]");
  pad?.addEventListener("pointerdown", (e) => {
    const b = padKey(e);
    if (!b) return;
    e.preventDefault();
    b.setPointerCapture(e.pointerId); // le relâcher arrive au bouton, même si le doigt glisse
    b.classList.add("is-down");
    press(b.dataset.code!, fingers);
  });
  const padUp = (e: PointerEvent) => {
    const b = padKey(e);
    if (!b) return;
    b.classList.remove("is-down");
    lift(b.dataset.code!, fingers);
  };
  pad?.addEventListener("pointerup", padUp);
  pad?.addEventListener("pointercancel", padUp);
  pad?.addEventListener("contextmenu", (e) => e.preventDefault()); // pas de menu sur un appui long

  // Éteindre une machine. Avant « emulator-loaded », destroy() planterait (la machine n'existe pas
  // encore) : on attend ce moment-là pour l'éteindre.
  const shutdown = (machine: any, ready: boolean) => {
    if (!machine) return;
    const kill = () => machine.destroy().catch(() => {});
    if (ready) kill();
    else machine.add_listener("emulator-loaded", kill);
  };

  // Un téléchargement raté (réseau, fichier bloqué) : on abandonne cette machine et on propose de réessayer
  const fail = () => {
    if (!alive) return;
    shutdown(emu, running);
    emu = null;
    running = false;
    boot.disabled = false;
    boot.textContent = ui.retry;
  };

  // Le wasm de v86, et sa version de secours pour les navigateurs qui ne le supportent pas.
  // v86 devine l'adresse du secours à partir du nom « v86.wasm », que Vite renomme : on charge nous-mêmes.
  const loadWasm = async (imports: WebAssembly.Imports) => {
    for (const url of [wasmUrl, fallbackWasmUrl]) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), imports);
        return instance.exports;
      } catch {}
    }
    fail();
    return new Promise(() => {}); // v86 n'attend plus rien de cette machine
  };

  boot.addEventListener("click", async () => {
    boot.disabled = true;
    boot.textContent = ui.loading;
    let V86: any;
    try {
      ({ V86 } = await import("v86"));
    } catch {
      return fail();
    }
    if (!alive) return;
    const machine = new V86({
      wasm_fn: loadWasm,
      memory_size: 32 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      screen_container: screen,
      bios: { url: biosUrl },
      vga_bios: { url: vgaBiosUrl },
      multiboot: { url: kernelUrl },
      disable_keyboard: true, // les touches passent par l'écran (voir SCANCODES)
      disable_mouse: true,
      disable_speaker: true,
      autostart: true,
    });
    emu = machine;
    machine.add_listener("download-error", () => machine === emu && fail());
    machine.add_listener("emulator-loaded", () => {
      if (machine !== emu) return;
      running = true;
      cover.remove();
      sxt.classList.add("is-running");
      screen.tabIndex = 0;
      if (!touch) screen.focus();
    });
  });

  // La fiche appelle ceci quand elle se ferme ou passe à un autre projet
  return () => {
    alive = false;
    shutdown(emu, running);
    emu = null;
  };
}
