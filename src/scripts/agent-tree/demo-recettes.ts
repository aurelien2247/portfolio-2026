// Reconstitution de l'appli Android de recettes (github.com/aurelien2247/aurelien_moignet_appli_mobile).
// Même interface que la vraie (Jetpack Compose, Material 3 clair, tailles en dp, textes), en HTML.
// Comme l'appli, elle appelle l'API TheMealDB en direct : catégories, plats d'une catégorie, détail.

import "../../styles/demos/recettes.css";
import { esc } from "./html";

const API = "https://www.themealdb.com/api/json/v1/1/";

type Category = { strCategory: string; strCategoryThumb: string };
type Meal = { idMeal: string; strMeal: string; strMealThumb: string };
type MealDetail = Meal & {
  strCategory: string;
  strArea: string;
  strTags: string | null;
  strInstructions: string;
  strYoutube: string | null;
  [key: string]: string | null;
};

// Un seul appel par URL : revenir en arrière ne recharge pas tout
const cache = new Map<string, Promise<any>>();
function get<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = fetch(API + path).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path)!;
}

// Le mapping manuel de CategoryListViewModel : chaque catégorie de l'API -> un filtre
const FILTER_OF: Record<string, string> = {
  Beef: "Meats",
  Chicken: "Meats",
  Lamb: "Meats",
  Pork: "Meats",
  Goat: "Meats",
  Dessert: "Desserts",
  Seafood: "Fish",
  Starter: "Starters",
  Side: "Starters",
  Breakfast: "Starters",
  Vegan: "Special diet",
  Vegetarian: "Special diet",
  Miscellaneous: "Miscellaneous",
  Pasta: "Miscellaneous",
};
const FILTERS = ["All", "Meats", "Desserts", "Fish", "Starters", "Special diet", "Miscellaneous"];

// Icônes Material (Icons.Filled.ArrowBack et Icons.Filled.List)
const PATHS = {
  back: `<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>`,
  list: `<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>`,
};
const icon = (name: keyof typeof PATHS) =>
  `<svg class="mi" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`;

function loadFonts() {
  if (document.getElementById("rec-fonts")) return;
  const link = document.createElement("link");
  link.id = "rec-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700;800&display=swap";
  document.head.append(link);
}

const spinner = `<span class="rec-spinner essential-motion" role="progressbar" aria-label="Chargement"></span>`;
const error = (e: unknown) =>
  `<p class="rec-error">${esc((e as Error)?.message || "Unknown error")}</p>`;
const backBtn = `<button class="rec-icon-btn" data-back aria-label="Retour">${icon("back")}</button>`;
const bar = (title: string, back = false, cls = "") =>
  `<header class="rec-bar ${cls}">${back ? backBtn : ""}<h1>${esc(title)}</h1></header>`;

type Load<T> = { data?: T; error?: unknown };

function categories(st: Load<Category[]>, filter: string) {
  // Comme l'appli : tant que ça charge, l'écran ne montre que le rond qui tourne
  if (!st.data && !st.error) return `<div class="rec-center">${spinner}</div>`;
  if (st.error) return `<div class="rec-center">${error(st.error)}</div>`;
  const shown =
    filter === "All" ? st.data! : st.data!.filter((c) => FILTER_OF[c.strCategory] === filter);
  return `${bar("Recipe categories", false, "is-raised")}
    <div class="rec-page is-gray">
      <div class="rec-filters">
        ${FILTERS.map(
          (f) =>
            `<button class="rec-pill${f === filter ? " is-on" : ""}" data-filter="${f}" aria-pressed="${f === filter}">${f}</button>`,
        ).join("")}
      </div>
      <div class="rec-scroll rec-cats">
        ${shown
          .map(
            (c) =>
              `<button class="rec-cat" data-cat="${esc(c.strCategory)}">
                <img src="${esc(c.strCategoryThumb)}" alt="" loading="lazy" />
                <span>${esc(c.strCategory)}</span>
              </button>`,
          )
          .join("")}
      </div>
    </div>`;
}

function grid(all: Meal[], query: string, asc: boolean) {
  const q = query.trim().toLowerCase();
  const list = all.filter((m) => !q || m.strMeal.toLowerCase().includes(q));
  // sortedBy { it.strMeal.lowercase() } : ordre des caractères, pas l'ordre alphabétique français
  list.sort((a, b) => {
    const x = a.strMeal.toLowerCase();
    const y = b.strMeal.toLowerCase();
    return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
  });
  return `<div class="rec-scroll rec-meals" data-results>${list
    .map(
      (m) =>
        `<button class="rec-meal" data-meal="${esc(m.idMeal)}">
          <img src="${esc(m.strMealThumb)}/small" alt="" loading="lazy" />
          <span>${esc(m.strMeal)}</span>
        </button>`,
    )
    .join("")}</div>`;
}

function meals(cat: string, st: Load<Meal[]>, query: string, asc: boolean) {
  const body = st.error
    ? `<div class="rec-center">${error(st.error)}</div>`
    : st.data
      ? grid(st.data, query, asc)
      : `<div class="rec-center">${spinner}</div>`;
  return `${bar(cat, true)}
    <div class="rec-page">
      <div class="rec-search">
        <input type="search" value="${esc(query)}" placeholder="Rechercher une recette..." aria-label="Rechercher une recette" data-query />
        <button class="rec-icon-btn" data-sort aria-label="${asc ? "Ordre alphabétique A-Z" : "Ordre alphabétique Z-A"}">${icon("list")}</button>
      </div>
      ${body}
    </div>`;
}

function detail(st: Load<MealDetail>) {
  let body: string;
  if (!st.data && !st.error) body = `<div class="rec-top">${spinner}</div>`;
  else if (st.error) body = `<div class="rec-center">${error(st.error)}</div>`;
  else {
    const m = st.data!;
    // Les ingrédients 1 à 20, quand l'ingrédient et la quantité sont remplis
    const ingredients = Array.from({ length: 20 }, (_, i) => [
      m[`strIngredient${i + 1}`],
      m[`strMeasure${i + 1}`],
    ])
      .filter(([ing, mes]) => ing?.trim() && mes?.trim())
      .map(([ing, mes]) => `<li>• ${esc(mes!)} ${esc(ing!)}</li>`)
      .join("");
    const yt = m.strYoutube && /^https:\/\//.test(m.strYoutube) ? m.strYoutube : null;
    body = `<div class="rec-scroll rec-detail">
      <section class="rec-card is-hero">
        <img src="${esc(m.strMealThumb)}/medium" alt="" />
        <div>
          <h2>${esc(m.strMeal)}</h2>
          <p class="rec-row"><span>Catégorie: ${esc(m.strCategory)}</span><span>Région: ${esc(m.strArea)}</span></p>
          ${m.strTags ? `<p class="rec-tags">Tags: ${esc(m.strTags)}</p>` : ""}
        </div>
      </section>
      <section class="rec-card">
        <h3>Ingrédients</h3>
        <ul>${ingredients}</ul>
      </section>
      <section class="rec-card">
        <h3>Instructions</h3>
        <p class="rec-steps">${esc(m.strInstructions)}</p>
      </section>
      ${
        yt
          ? `<section class="rec-card">
              <h4>Vidéo YouTube</h4>
              <a class="rec-link" href="${esc(yt)}" target="_blank" rel="noopener noreferrer">${esc(yt)}</a>
            </section>`
          : ""
      }
    </div>`;
  }
  return `${bar("Détails de la recette", true)}${body}`;
}

export function mountRecettes(root: HTMLElement) {
  loadFonts();
  root.insertAdjacentHTML(
    "beforeend",
    `<div class="rec">
      <div class="rec-phone">
        <div class="rec-screen">
          <div class="rec-route" data-route></div>
          <span class="rec-cam" aria-hidden="true"></span>
        </div>
      </div>
    </div>`,
  );
  const route = root.querySelector<HTMLElement>("[data-route]")!;

  // La pile de navigation : categories -> meals/{category} -> meal_detail/{idMeal}
  let cats: Load<Category[]> = {};
  let filter = "All";
  let cat: string | null = null;
  let list: Load<Meal[]> = {};
  let query = "";
  let asc = true;
  let meal: Load<MealDetail> | null = null;
  let mealsScroll = 0;
  let seq = 0; // ignore une réponse arrivée après qu'on a changé d'écran

  function render(enter = false) {
    // Si on tapait une recherche, on rend le focus et le curseur au nouveau champ
    const typing = document.activeElement as HTMLInputElement | null;
    const caret =
      typing && "query" in typing.dataset && route.contains(typing) ? typing.selectionStart : null;
    if (meal) route.innerHTML = detail(meal);
    else if (cat) route.innerHTML = meals(cat, list, query, asc);
    else route.innerHTML = categories(cats, filter);
    if (caret !== null) {
      const input = route.querySelector<HTMLInputElement>("[data-query]");
      input?.focus();
      input?.setSelectionRange(caret, caret);
    }
    route.classList.remove("is-entering");
    if (enter) {
      void route.offsetWidth; // relance l'animation
      route.classList.add("is-entering");
    }
  }

  function load<T>(
    path: string,
    pick: (json: any) => T,
    set: (s: Load<T>) => void,
    after?: () => void,
  ) {
    const n = ++seq;
    get<any>(path).then(
      (json) => {
        if (n !== seq) return;
        // Une réponse vide (ex. { meals: null } pour une recette disparue) est une erreur, pas un chargement
        const data = pick(json);
        set(data == null ? { error: new Error("No data") } : { data });
        render();
        after?.();
      },
      (e) => n === seq && (set({ error: e }), render()),
    );
  }

  function openCategories() {
    // LaunchedEffect(Unit) recharge les catégories et remet le filtre sur « All »
    filter = "All";
    cats = {};
    render();
    load(
      "categories.php",
      (j) => j.categories as Category[],
      (s) => (cats = s),
    );
  }

  function openMeals(keepScroll = false) {
    list = {};
    render(!keepScroll);
    load(
      `filter.php?c=${encodeURIComponent(cat!)}`,
      (j) => (j.meals ?? []) as Meal[],
      (s) => (list = s),
      () => {
        const sc = route.querySelector(".rec-scroll");
        if (sc && keepScroll) sc.scrollTop = mealsScroll;
      },
    );
  }

  root.addEventListener("click", (e) => {
    const t = (e.target as Element).closest<HTMLElement>("button");
    if (!t || !route.contains(t)) return;
    const d = t.dataset;
    if (d.filter) {
      filter = d.filter;
      render();
    } else if (d.cat) {
      cat = d.cat;
      query = "";
      asc = true;
      openMeals();
    } else if (d.meal) {
      mealsScroll = route.querySelector(".rec-scroll")?.scrollTop ?? 0;
      meal = {};
      render(true);
      load(
        `lookup.php?i=${encodeURIComponent(d.meal)}`,
        (j) => j.meals?.[0] as MealDetail,
        (s) => (meal = s),
      );
    } else if ("sort" in d) {
      asc = !asc;
      render();
    } else if ("back" in d) {
      if (meal) {
        // La recherche et le tri sont dans un remember : ils repartent de zéro au retour
        meal = null;
        query = "";
        asc = true;
        openMeals(true);
      } else {
        cat = null;
        openCategories();
      }
    }
  });

  // La recherche filtre à chaque lettre : seule la grille est redessinée, le champ garde le focus
  root.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (!("query" in input.dataset)) return;
    query = input.value;
    const results = route.querySelector("[data-results]");
    if (results && list.data) results.outerHTML = grid(list.data, query, asc);
  });

  openCategories();
}
