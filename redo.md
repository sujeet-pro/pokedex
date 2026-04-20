# Pokédex v3 — Greenfield Rewrite Specification

> Single source of truth for rebuilding the Pokédex from scratch on top of a
> minimal base. Only `data/api/v2/` (PokéAPI mirror), `public/favicon.svg`,
> and `LICENSE` are preserved from the prior codebase. Everything else —
> source, configs, tests, styles, bundles — is deleted and rebuilt.
>
> This doc captures:
> 1. Why we're rewriting
> 2. What features must be preserved from v2
> 3. What new capabilities v3 adds
> 4. Definitive tech/architecture choices
> 5. Phase-by-phase implementation plan with acceptance criteria

---

## 1. Goals & constraints

### The product
A **fully static**, **accessible**, **locale-aware** Pokédex web app with a
retro handheld-console aesthetic. Deployed to GitHub Pages under
`https://projects.sujeet.pro/pokedex`. Every page is **pre-rendered HTML** —
opening any route requires **zero network fetches**; client-side navigation
fetches at most one JSON blob for the destination page.

### Hard constraints
- **Zero runtime server.** Static site hosted on GitHub Pages. Build output
  is a directory of HTML/JS/CSS/JSON, deployed as-is.
- **Data is static.** PokéAPI is mirrored at build time into
  `data/api/v2/`; bundles are generated from there into the deploy output.
  No runtime API calls to pokeapi.co.
- **Two locales only.** English (`en`) and one additional language
  (**recommended: `es`** — Spanish, biggest Latin-script audience, clean TTS
  word-boundary support). Halving the page count vs. the 4-locale plan
  keeps CI build time manageable on free-tier runners.
- **Free-tier CI.** Build must complete on `ubuntu-latest` (4 vCPU, 16 GB
  RAM) within a reasonable window — target cold build ≤ 10 min, warm
  ≤ 3 min.
- **Accessibility is not optional.** WCAG 2.1 AA across all 6
  theme/mode combinations, full keyboard navigation, screen-reader support.

### Soft constraints / preferences
- Prefer Vite ecosystem tooling (oxc for lint+format, `tsgo` for typecheck).
- Prefer Radix UI for accessibility-first primitives.
- Prefer TanStack family (Router, Query, Start) for routing/data.
- Prefer React 19 + React Compiler.
- Commit all generated summary text files (`data_generated/summary/`) so
  re-runs are cheap.

---

## 2. Tech stack (definitive)

| Concern | Choice | Why |
|---|---|---|
| Framework | **TanStack Start** (SSG preset) | Native file-based routing, built-in prerender, Vite-based, works with existing TanStack Router / Query knowledge, deploys to static hosts. |
| UI library | React 19 + React Compiler | Auto-memo, less boilerplate. |
| Router | `@tanstack/react-router` (via Start) | Typed routes, loaders run server-side during prerender + client-side on nav. |
| Data cache | `@tanstack/react-query` | Loader ↔ component cache bridge; `ensureQueryData` for loader use. |
| UI primitives | `radix-ui` (single package) | Popover, Tooltip, ToggleGroup, Dialog, VisuallyHidden, Combobox — a11y-complete. |
| Global hotkeys | `@tanstack/react-hotkeys` | Scoped chords (`g` `p` etc.) + Cmd+K. |
| Build | Vite 6 (via TanStack Start plugin) | Fast dev, already in family. |
| TypeScript | `typescript-native-preview` (`tsgo`) | Fast typecheck; current code uses it. Strict mode + erasable-syntax. |
| Lint | `oxlint` | Fast, configured with Rust-based rules. |
| Format | `oxfmt` | Fast, opinionated. |
| Unit test | Vitest + jsdom | Component + utility tests. |
| E2E test | Playwright + `@axe-core/playwright` | Navigation + accessibility audits per theme. |
| Package manager | `npm` | Lockfile committed. |
| Node | ≥ 22 | LTS, modern APIs. |
| Deploy | GitHub Pages via `actions/deploy-pages@v3` | Existing target. |

### Explicit non-choices
- **No** Next.js / Remix / Astro — TanStack Start covers our SSG needs.
- **No** RSC (React Server Components) — not mature enough in TanStack Start
  yet; revisit as Phase N+1 if client JS size becomes a blocker.
- **No** Tailwind / CSS-in-JS — vanilla CSS + CSS custom properties.
- **No** Sentry / analytics — this is a static hobby project.
- **No** Service Worker / PWA — can be added post-v3 if desired.

---

## 3. Architecture overview

### Paint model
- **First visit (any URL):** user sees fully rendered HTML from the
  pre-rendered file. Loader data was inlined into the HTML as a dehydrated
  React Query cache; React hydrates and the page is interactive. **Zero
  network requests for the opened page.**
- **Client navigation (in-SPA link click):** TanStack Router calls the
  destination route's loader, which does one `queryClient.ensureQueryData`
  → fetches one JSON bundle from `/ui-data/v1/<type>/<lang>/<slug>.json`.
  Cache hit for pages already visited; cache miss for new pages.
- **Locale switch:** full browser navigation (new URL prefix). Each locale
  is its own deploy tree; switching locales is rare and a full reload is
  fine.

### URL shape
```
/                                      → English landing page (lang picker)
/en/                                   → EN home
/en/pokemon                            → EN Pokémon list
/en/pokemon/bulbasaur                  → EN Bulbasaur detail
/en/type/fire
/en/ability/blaze
/en/pokemon-species/bulbasaur
/en/pokemon-form/charizard-mega-x
/en/berries | /en/berry/cheri
/en/items   | /en/item/potion
/en/moves   | /en/move/thunderbolt
/en/locations                          (inline area expansion; no detail page)
/en/generations | /en/generation/generation-i
/en/search?q=<query>&kind=<kind>
/es/...                                (mirror, every URL above)
/404 (fallback)
```

Locale prefix is the first path segment. The existing basepath
`/pokedex/` from the GitHub Pages deploy wraps everything; final public URLs
become `https://projects.sujeet.pro/pokedex/en/pokemon/bulbasaur` etc.

### Per-locale output isolation
- `dist/en/...` and `dist/es/...` are self-contained trees.
- Each locale's HTML references only that locale's JSON bundles.
- Shared JS/CSS assets live under `dist/_assets/` (or the Vite default),
  hashed; both locale trees reference the same hashed files.
- Root `dist/index.html` is a minimal English landing page with a language
  picker (2 buttons). No auto-redirect.
- `dist/404.html` is a simple error page with a link back to `/`.

### Build pipeline
```
npm run data:sync      (manual, occasional — refreshes data/api/v2/)
       │
       ▼
npm run bundles:build  (per-locale; writes public/ui-data/v1/<type>/<lang>/…)
       │
       ▼
npm run summaries:build (manual, idempotent — AI-narrated summaries EN → ES)
       │
       ▼
npm run build          (typecheck → bundles:build → start build)
                        └─ produces dist/ with per-locale prerendered HTML
```

---

## 4. Data layer

### Source of truth
`data/api/v2/` — a raw mirror of PokéAPI. Preserved from v2. Directory
shape: `data/api/v2/<resource>/<id>/index.json` (+ `encounters` subdir for
pokemon). Index files like `data/api/v2/pokemon/index.json` list
pagination.

Resources we consume:
`pokemon`, `pokemon-species`, `pokemon-form`, `type`, `ability`,
`berry`, `item`, `move`, `location`, `location-area`, `generation`,
`evolution-chain`, `language`, plus dictionaries
(`growth-rate`, `egg-group`, `gender`, etc.) referenced by the above.

### Bundle output (v3 shape)
```
public/ui-data/v1/
├── <resource>/
│   ├── <lang>/
│   │   ├── _index.json               (list page manifest)
│   │   └── <slug>.json               (one per entity)
```

Concrete:
```
public/ui-data/v1/
├── pokemon/en/_index.json
├── pokemon/en/bulbasaur.json
├── pokemon/es/bulbasaur.json
├── type/en/fire.json
├── type/es/fire.json
├── ability/en/blaze.json
├── ability/es/blaze.json
├── pokemon-species/<lang>/<slug>.json
├── pokemon-form/<lang>/<slug>.json
├── berry/<lang>/<slug>.json
├── item/<lang>/<slug>.json
├── move/<lang>/<slug>.json
├── location/<lang>/<slug>.json
├── generation/<lang>/<slug>.json
└── search/<lang>/index.json          (unified search index per locale)
```

Served URLs (under the gh-pages basepath): `/pokedex/ui-data/v1/...`.

### Bundle contents
Each per-locale bundle is **self-sufficient for its page**: a single fetch
returns every piece of data the detail page needs, including localized
flavor text, ability short-effects, move descriptions, and the AI summary
HTML fragment. No secondary fetches beyond maybe a shared asset (sprites
still come from PokéAPI's CDN URLs).

### Inline HTML fragments (the "tooltip-as-HTML" pattern)
For content that is presentational (flavor paragraphs, ability effects,
move effects, summary prose, evolution notes, weakness-grid cell
explanations), the bundle carries a `content_html` string produced at
bundle-build time. Components can consume it either as:

1. **HTML fragment** (default): `<div dangerouslySetInnerHTML={{ __html: x.content_html }} />` —
   ships no rendering code.
2. **React children** (opt-in): full composition for cases that need state
   or event handlers inside the content.

The switch is per-component, defaulting to (1). A tiny registry
(`src/config/rendering.ts`) maps component names to their chosen path so
the decision is auditable.

### Canonical bundle shapes (preserved from v2)

**PokemonBundle**:
```ts
{
  kind: "pokemon",
  id: number,
  name: string,                     // slug, e.g. "bulbasaur"
  display_name: string,             // localized, e.g. "Bulbasaur" / "Fushigidane"
  order: number,
  height: number,                   // decimeters
  weight: number,                   // hectograms
  base_experience: number,
  types: { slot: number; name: string }[],
  stats: { name: string; base_stat: number }[],
  sprites: { front_default: string | null; official_artwork: string | null },
  abilities: {
    name: string;
    display_name: string;           // localized
    is_hidden: boolean;
    slot: number;
    short_effect_html: string;      // localized HTML fragment
  }[],
  forms: { name: string; display_name: string }[],
  species: {
    name: string,
    display_name: string,
    genus: string,                  // localized, e.g. "Seed Pokémon"
    generation: string,             // "generation-i"
    capture_rate: number,
    base_happiness: number,
    hatch_counter: number | null,
    color: string,
    shape: string | null,
    habitat: string | null,
    growth_rate: string,
    egg_groups: string[],
    is_legendary: boolean,
    is_mythical: boolean,
    is_baby: boolean,
    flavor_html: string,            // localized HTML paragraph(s)
  },
  evolution_chain: BundleEvoNode | null,
  defenders: BundleDefenderType[],
  pager: { prev: { name: string; id: number } | null; next: { name: string; id: number } | null },
  summary_html: string | null,      // word-boundary-wrapped HTML or null if missing
}
```

**BundleEvoNode**:
```ts
{
  name: string,
  id: number,
  display_name: string,
  trigger: string,                  // localized, e.g. "LVL 16" / "Nv. 16", "Thunder Stone" / "Pierre Foudre"
  evolves_to: BundleEvoNode[],
}
```

**BundleDefenderType**:
```ts
{
  name: string,                     // slug
  no_damage_from: string[],
  double_damage_from: string[],
  half_damage_from: string[],
}
```

**TypeBundle**:
```ts
{
  kind: "type",
  id: number,
  name: string,
  display_name: string,
  generation: string,
  relations: {
    double_damage_to: string[], half_damage_to: string[], no_damage_to: string[],
    double_damage_from: string[], half_damage_from: string[], no_damage_from: string[],
  },
  pokemon: { name: string; display_name: string; id: number; slot: number }[],
}
```

**AbilityBundle**:
```ts
{
  kind: "ability",
  id: number,
  name: string,
  display_name: string,
  generation: string,
  short_effect_html: string | null,
  effect_html: string | null,
  flavor_html: string | null,
  pokemon: { name: string; display_name: string; id: number; is_hidden: boolean }[],
}
```

(Berry, Item, Move, Location, Generation, Form, Species follow the same
pattern — `display_name`, `*_html` for prose, slug references for
cross-linking.)

**Index bundles** (`<resource>/<lang>/_index.json`):
```ts
{
  kind: "<resource>-index",
  locale: "en" | "es",
  total: number,
  entries: IndexEntry[],            // resource-specific entry shape
}
```

**Search index** (`search/<lang>/index.json`):
```ts
{
  kind: "search-index",
  locale: "en" | "es",
  total: number,
  entries: {
    kind: ResourceKind,
    name: string,                   // slug
    id: number,
    display_name: string,           // localized
    tag?: string,                   // for filtering (type, category, etc.)
  }[],
}
```

### Query factory layer
One thin module `src/lib/queries.ts` exports query factories per resource.
Loaders call them via `ensureQueryData`; components (where needed) call
them via `useSuspenseQuery`. All queries use `staleTime: Infinity,
gcTime: Infinity` because bundles are immutable per deploy.

Query key convention: `["bundle", <resource>, <lang>, <slug>]`, e.g.
`["bundle", "pokemon", "en", "bulbasaur"]`.

Fetch wrapper (`src/lib/bundles.ts`):
```ts
export async function fetchBundle<T>(
  resource: string,
  lang: Locale,
  slug: string,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${import.meta.env.BASE_URL}ui-data/v1/${resource}/${lang}/${slug}.json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new BundleError(res.status, url);
  return res.json();
}
```

---

## 5. Routes & pages

### Route table (per locale)
| Path (under `/<lang>`) | Page | Data |
|---|---|---|
| `/` | `Home` | `pokemonIndexQuery` (random featured) + index totals |
| `/pokemon` | `PokemonList` | `pokemonIndexQuery` |
| `/pokemon/$name` | `PokemonDetail` | `pokemonBundleQuery($name)` |
| `/pokemon-species/$name` | `SpeciesDetail` | `speciesBundleQuery($name)` |
| `/pokemon-form/$name` | `FormDetail` | `formBundleQuery($name)` |
| `/type/$name` | `TypeDetail` | `typeBundleQuery($name)` |
| `/ability/$name` | `AbilityDetail` | `abilityBundleQuery($name)` |
| `/berries` | `BerryList` | `berryIndexQuery` |
| `/berry/$name` | `BerryDetail` | `berryBundleQuery($name)` |
| `/items` | `ItemList` | `itemIndexQuery` |
| `/item/$name` | `ItemDetail` | `itemBundleQuery($name)` |
| `/moves` | `MoveList` | `moveIndexQuery` |
| `/move/$name` | `MoveDetail` | `moveBundleQuery($name)` |
| `/locations` | `LocationList` | `locationIndexQuery` (inline area expansion — no separate detail page) |
| `/generations` | `GenerationList` | `generationIndexQuery` |
| `/generation/$name` | `GenerationDetail` | `generationBundleQuery($name)` |
| `/search` | `SearchResults` | `searchIndexQuery` + client-side filter |

Plus **root `/`** → English landing page with 2 language buttons
(English / Español). No auto-redirect.
Plus **`*` catch-all** → NotFound page with links home and to search.

### Page-by-page spec

#### Home (`/<lang>/`)
**Purpose:** welcoming landing with a random featured Pokémon hero and
deep links to all catalog pages.
**Layout:** retro console device shell, centered card containing the
featured Pokémon (sprite, name, types, genus, localized flavor, read-aloud
button). Below: a grid of "Browse all X" tiles for Pokémon, Berries,
Items, Moves, Locations, Generations.
**Data:** `pokemonIndexQuery` → pick random entry at render time (use
URL-derived seed so prerender is deterministic per locale), then
`pokemonBundleQuery(featured.name)`. Totals come from each list's
`_index.json`.

#### PokemonList (`/<lang>/pokemon`)
**Purpose:** full grid of ~1000 Pokémon.
**Layout:** grid of square cards — sprite, dex number, localized name,
type pills. Responsive auto-fill (≈5-column desktop, 2-column mobile).
Page size: all entries on one page (content-visibility+
contain-intrinsic-size keeps scroll perf acceptable).
**Interaction:** each card is a link. No filter UI in v3 phase 1.

#### PokemonDetail (`/<lang>/pokemon/$name`)
**Purpose:** the flagship page. Everything about one Pokémon.
**Sections** (top to bottom):
1. Header: dex #, generation badge, name h1, localized genus, localized
   flavor paragraph, **SpeakButton** for read-aloud.
2. Sprite showcase (official artwork, fallback to front_default).
3. Type cartridges (dual-type supported).
4. Stats radar chart (hexagonal SVG, 6 axes: HP, Atk, Def, SpA, SpD, Spe).
   Stat names + values exposed to screen readers via `<text>`.
5. Evolution chain (tree showing branches and triggers — "LVL 16",
   "Thunder Stone", etc.). Localized triggers.
6. Abilities row: `AbilityButton` per ability. Click → popover with
   localized short_effect_html.
7. Weakness grid: 18 types × 5 multiplier rows (`×0`, `×¼`, `×½`, `×2`,
   `×4`). Color-coded; "×1" row omitted or visually muted.
8. Forms gallery (if any): small sprites linking to FormDetail.
9. Dossier: height, weight, capture rate, base happiness, hatch counter,
   habitat, shape, color, growth rate, egg groups, generation. Each field
   has a tiny "?" info popover with localized description.
10. **Read-aloud summary**: the AI-generated narrated entry (2–3 min
    listen). Rendered as word-span-wrapped HTML (see §9). Play/pause
    button with word-level highlight during speech.
11. Pager: prev/next navigation by dex id. `[` / `]` keyboard shortcuts.

#### TypeDetail (`/<lang>/type/$name`)
Type effectiveness breakdown (attacks of this type do super effective
to X, not very effective to Y, no effect on Z; takes super effective from
A, resists B, immune to C). Plus a grid of all Pokémon of this type.

#### AbilityDetail (`/<lang>/ability/$name`)
Ability display_name, generation, localized short_effect_html and
effect_html, flavor_html (game dex), plus grid of Pokémon that can have
it (marked for hidden-ability carriers).

#### SpeciesDetail (`/<lang>/pokemon-species/$name`)
Species-level metadata: rarity flags (legendary / mythical / baby),
color/shape/habitat, capture rate, base happiness, hatch counter,
growth rate, egg groups, forms list, generation. Cross-links to each
Pokémon form.

#### FormDetail (`/<lang>/pokemon-form/$name`)
Alternate forms (Mega, Alolan, Galarian, Paldean, Terastal). Form name,
link back to base Pokémon, form's types (may differ), form sprite,
version group that introduced it.

#### BerryList / BerryDetail
**List:** catalog row layout (image left, name + firmness + natural-gift
type right). Paginated if needed.
**Detail:** flavor potency grid (5 flavors × potency), growth time,
max harvest, size, smoothness, soil dryness, natural gift type/power,
Pokémon that can hold it. SpeakButton.

#### ItemList / ItemDetail
**List:** catalog rows with sprite, name, category tag, cost.
**Detail:** sprite, category, cost, fling power + effect, short and full
effects, flavor text, attributes (consumable, fling-able, etc.), Pokémon
that naturally hold it. SpeakButton.

#### MoveList / MoveDetail
**List:** rows with type pill, name, damage class icon, power, accuracy,
PP.
**Detail:** type cartridge, damage class, power, accuracy, PP, priority,
target scope, generation, localized short + full effects, flavor text,
"learned by" Pokémon list (may be hundreds — paginated sub-grid).
SpeakButton.

#### LocationList (`/<lang>/locations`)
Grouped by region. Each location card shows region + area count.
Clicking the card **inline-expands** to show that location's areas
(no separate detail page). Card uses `aria-expanded` to signal state.

#### GenerationList / GenerationDetail
**List:** timeline of Gen I–IX, each card shows main region + counts of
new species/moves/types/abilities.
**Detail:** region, version groups, new types/abilities/Pokémon lists,
move count. SpeakButton.

#### Search (`/<lang>/search`)
Query from `?q=`, optional `?kind=` filter. Loads the per-locale search
index, filters client-side. Displays results grouped by kind with a
top bar of kind-filter toggles (9 resource types). Results are
mini-cards with display_name + optional tag (type, category, etc.).
Focus is on the input when landing.

#### NotFound (catch-all)
Retro "error screen" styling. Heading, explanatory text, Home + Search
links.

---

## 6. Components

All components live in `src/components/` with a matching `src/styles/components/<Name>.css`.

### Shell
- **`Layout`** (app shell): sticky navbar, main content slot, footer.
  Wires global hotkeys (see §10). Provides `PreferencesContext` and
  `LocaleContext`.
- **`Navbar`**: brand logo (Pokéball SVG that wobbles on hover unless
  reduced-motion), Autocomplete (search), BurgerMenu (mobile), Settings,
  LocaleSwitcher. On large screens inline; on small screens collapses
  into BurgerMenu.
- **`Footer`**: shortcuts legend, attribution, commit SHA (at build time).
- **`SkipLink`**: visible on focus, jumps to `#main-content`.
- **`ErrorBoundary`**: catches render errors, shows error screen + home
  link.
- **`ConsoleDevice`**: retro handheld shell — case gradient, bevel
  shadows, screen area, corner rivets, LEDs (pulse animation), speaker
  grille, decorative D-pad + A/B buttons. Used by Home and detail pages.
  Props: `title`, `subtitle?`, `ariaLabel?`, `headerAction?`, `footer?`,
  `children`.

### Input / control
- **`Autocomplete`**: combobox in navbar. Debounced query against
  per-locale `searchIndexQuery`. Props: `kbdHint?` (e.g. `⌘K`).
  Built on Radix Combobox primitives. Arrow keys navigate, Enter selects,
  Esc closes.
- **`Combobox`**: generic Radix-backed combobox (used by Settings voice
  picker).
- **`BurgerMenu`**: Radix Dialog/Popover — mobile nav with links to all
  catalogs.
- **`Settings`**: Radix Popover. ToggleGroups for Theme (blue/yellow/red),
  Mode (light/dark), Scale (xs/sm/md/lg/xl), Direction (ltr/rtl), Voice
  (Combobox of system voices).
- **`LocaleSwitcher`**: 2-button toggle (EN/ES). On click, full browser
  nav to the equivalent URL under the other locale. Persists choice in
  localStorage.

### Pokédex widgets
- **`TypeCartridge`**: type pill. Background + text color from `TYPE_INFO`.
  Props: `name` (slug).
- **`StatRadar`**: hexagonal SVG radar chart. Props: `stats`, `maxStat?`.
- **`WeaknessGrid`**: 18 types × multiplier rows. Color-coded by
  effectiveness. Props: `defenders`.
- **`EvolutionChain`**: recursive tree renderer. Props: `root: BundleEvoNode`.
  Branches side-by-side, trigger labels between.
- **`AbilityButton`**: button trigger + Radix Popover showing localized
  short_effect. Props: `ability: BundleAbilityEntry`.
- **`DossierField`**: label + value + info-icon popover (Radix).
  Props: `dossierKey`, `value`.
- **`InfoPopover`**: generic info icon → popover. Props: `title?`,
  `description`, `children` (trigger).
- **`Sprite`**: `<img>` wrapper with lazy-loading + optional `priority`.
- **`PokemonCard`**: square card for grid views.
- **`CatalogShell`**: list page wrapper — heading, subtitle, optional
  filter row, grid container.
- **`PillFilter`**: toggle-button row for filter UI. Props: `options`,
  `selected`, `onChange`.
- **`LocationCard`**: expandable card for LocationList.
- **`PokemonSummary`**: renders the word-span-wrapped narrated entry
  HTML. Props: `summaryHtml: string | null`. If null, renders nothing.
- **`SpeakButton`**: read-aloud button. See §9.
- **`Pokeball`**: SVG Pokéball brand icon. Props: `className?`.

---

## 7. Internationalization

### Locale set
- `en` — English (base locale, AI-narrative master)
- `es` — Spanish (swappable; alternatives: `fr`, `de`, `ja`)

### Runtime
- **`<LocaleContext>`** provides `locale: Locale` (resolved from first URL
  path segment via TanStack Router's `useParams` / route definition).
- **`useT()`** hook returns a typed translation function with
  string-literal union keys. Strings live in
  `src/i18n/<lang>.ts` as a typed `const` map; `Messages` type is derived
  from the EN map so typos in other locales fail typecheck.
- **`<html lang={locale}>`** set from the root route document head.
- **Per-locale tree-shake:** each pre-rendered page imports only its
  locale's message map (via a lazy import keyed on the route param).
  Post-build, locale-specific chunks are smaller.

### Content localization
- PokéAPI provides translations in-band (flavor text, genus, type names,
  ability short-effect, move effect, item effect). Bundle build picks the
  locale-specific entry per output locale. Missing entry → fall back to
  English string with a `[lang=en]` attribute on the rendered element
  (screen-reader can announce the language mismatch).
- Chrome strings (buttons, card headers, aria-labels, shortcut legend):
  hand-translated in `src/i18n/<lang>.ts`.
- AI summaries: generated in EN via Claude + WebSearch, then translated
  to ES in the **same CLI call** (§9). One generation run → two files
  per Pokémon: `<id>_en.txt`, `<id>_es.txt`.

### Locale switch UX
- Full-page navigation via anchor tag (`<a href="/es/...">`), not
  client-side. Guarantees fresh locale-specific JS/message map.
- Remember last-chosen locale in localStorage key `pokedex.locale`. Used
  by the root `/` landing page to re-offer the user's prior choice on
  subsequent visits (non-binding; they still click a button).

---

## 8. Theming & styling

### Theme system
- **3 themes** × **2 modes** = **6 combinations**:
  - Blue / Red / Yellow themes (case color identity).
  - Light / Dark modes (screen background).
- Persisted user preference: **never** auto-detect `prefers-color-scheme`;
  always respect user's explicit choice (stored, defaults to Blue / Dark).
- Applied via attributes on `<html>`: `data-theme`, `data-mode`,
  `data-scale`, `dir`.

### CSS variable taxonomy
Defined in `src/styles/global.css` under scoped selectors:

```css
:root { /* global tokens */
  --font-sans: "Open Sans", system-ui, …;
  --font-mono: "JetBrains Mono", ui-monospace, …;
  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 14px;
  --device-radius: 32px;  --screen-radius: 14px;
  --transition: 160ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-sm: 0 1px 2px rgb(0 0 0 / .15);
  --shadow-md: 0 8px 20px rgb(0 0 0 / .2);
  --shadow-lg: 0 18px 40px rgb(0 0 0 / .35);
}

:root[data-theme="red"]    { --case:#bb2a2a; --case-2:#8f1e1e; --case-3:#6c1515;
                             --case-hi:rgba(255,160,160,.28); --case-ink:#ffe3e3;
                             --brand-accent:#ff5b5b; }
:root[data-theme="blue"]   { --case:#264ba0; --case-2:#1b3775; --case-3:#12255a;
                             --case-hi:rgba(160,200,255,.28); --case-ink:#dde6ff;
                             --brand-accent:#5b9bff; }
:root[data-theme="yellow"] { --case:#d4a61f; --case-2:#a7800e; --case-3:#755a00;
                             --case-hi:rgba(255,232,160,.30); --case-ink:#2a1f00;
                             --brand-accent:#e0b53c; }

:root[data-mode="dark"] {
  /* shared dark screen tokens */
  --screen-scanline: rgba(0,0,0,.18);
  --screen-shade:    rgba(0,0,0,.22);
  --screen-shade-strong: rgba(0,0,0,.35);
  --card-bg: var(--case-3);
  --card-ink: var(--case-ink);
  /* + theme-specific --bg / --screen-bg / --text / --text-muted / --phosphor / --amber / --warn */
}
:root[data-mode="light"] {
  --screen-scanline: rgba(0,0,0,.04);
  --screen-shade:    rgba(0,0,0,.04);
  --screen-shade-strong: rgba(0,0,0,.08);
  --card-bg: var(--screen-bg);
  --card-ink: var(--screen-fg);
  /* + theme-specific lighter tokens */
}

/* Per-combo overrides (red dark, red light, blue dark, blue light, yellow dark, yellow light)
   define: --bg, --bg-alt, --text, --text-muted, --border, --page-overlay,
           --screen-bg, --screen-bg-2, --screen-fg, --screen-fg-dim,
           --phosphor, --phosphor-dim, --amber, --warn, --screen-rule. */

/* Scale */
:root[data-scale="xs"] { font-size: 13px; }
:root[data-scale="sm"] { font-size: 14.5px; }
:root[data-scale="md"] { font-size: 16px; }
:root[data-scale="lg"] { font-size: 17.5px; }
:root[data-scale="xl"] { font-size: 19px; }

/* A11y */
:focus-visible { outline: 2px solid var(--phosphor); outline-offset: 2px; }
.skip-link { position: absolute; left: -9999px; &:focus { left: 1rem; top: 1rem; } }
.visually-hidden { /* sr-only */ }

@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

**Color contrast target:** WCAG AA — 4.5:1 normal text, 3:1 large. Enforced
by an axe-core Playwright test that runs Home + Pokémon detail pages under
all 6 theme/mode combos.

### Typography
- Sans: Open Sans, then system stack.
- Mono: JetBrains Mono, then system mono stack.
- No external font files (system fonts keep bundle small; Open Sans and
  JetBrains Mono are widely pre-installed — fallbacks ensure graceful
  degradation).

### Retro console aesthetic
The visual signature. Rendered purely in CSS (no image assets):
- **Device case**: `linear-gradient` from `--case` to `--case-3`, bevel via
  `box-shadow` stack (inset highlights + deep outer shadow).
- **Screen area**: inset-shadow creates the "sunken LCD" look.
  Scanline overlay: `repeating-linear-gradient(to bottom, transparent 0 2px,
  var(--screen-scanline) 2px 3px)`.
- **LEDs**: small circles with `box-shadow` glow and a pulsing keyframe
  animation. Disabled under reduced-motion.
- **Corner rivets**: 4 small radial gradients at corners.
- **Speaker grille**: repeating dot pattern (decorative).
- **D-pad + A/B buttons**: decorative CSS shapes for flavor.
- **Pokéball brand**: inline SVG, fills `currentColor`.

### CSS architecture
```
src/styles/
├── global.css            (tokens, resets, utilities, shared a11y)
├── layout.css            (grids, cards, shell)
├── reset.css             (normalize)
└── components/
    ├── ConsoleDevice.css
    ├── Navbar.css
    ├── WeaknessGrid.css
    ├── StatRadar.css
    ├── EvolutionChain.css
    ├── SpeakButton.css
    ├── Combobox.css
    ├── InfoPopover.css
    ├── AbilityButton.css
    ├── DossierField.css
    ├── BurgerMenu.css
    ├── Settings.css
    ├── LocationCard.css
    ├── PillFilter.css
    ├── TypeCartridge.css
    ├── CatalogShell.css
    ├── HomeFeatured.css
    ├── PokemonCard.css
    └── …
```

No CSS-in-JS. No Tailwind. Just vanilla CSS with variables. Tests in
`src/styles/__tests__/contrast.test.ts` assert contrast via axe-core.

---

## 9. AI summary generator & read-aloud

### Summary generation script (`scripts/summarize.ts`)
- **Source of truth:** `data_generated/summary/<id>_<lang>.txt` (one
  plain-text file per Pokémon × locale). Committed to git.
- **One CLI call per Pokémon** produces **both locales**: the prompt
  passes the full structured Pokémon bundle, enables `WebSearch`,
  instructs the model to:
  1. Use PokéAPI data + web-sourced lore to write a **320–400 word,
     3-paragraph, story-like English narration** (2–3 minutes of
     listening at 150 wpm). Cover: what the Pokémon is like; habitat,
     behaviour, lore; abilities (what they do) and typing matchups.
  2. Translate that exact English narration into Spanish (or other
     chosen second locale), preserving paragraph boundaries.
  3. Emit the two outputs with a simple delimiter the script parses into
     separate files.
- **Model:** Claude Haiku by default (cheap, WebSearch-capable). `--model
  sonnet` flag for quality bump.
- **Concurrency:** default 2 (tunable via `--concurrency`).
- **Idempotent resume:** skips `(id, lang)` pairs whose file exists
  unless `--force`. On rate-limit, logs and exits 0.
- Old script at `scripts/summarize.ts` (pre-v3) already implements the
  single-locale path and can be extended.

### Inline into bundles
During `bundles:build`, the per-locale text files are wrapped in
word-boundary `<span>`s and stored as `summary_html` on the respective
`PokemonBundle`. Example:

```html
<p>
  <span data-w="0">Bulbasaur</span>
  <span data-w="10"> </span>
  <span data-w="11">is</span>
  …
</p>
```

Each span carries `data-w="<char-offset>"` so the TTS word-highlight
component can map SpeechSynthesis `onboundary` events to the right span.

### SpeakButton (`src/components/SpeakButton.tsx`)
Read-aloud control. Usage across: Home featured, PokemonDetail,
BerryDetail, ItemDetail, MoveDetail, LocationList (per location card),
GenerationDetail. Props:
```ts
{
  kind: "pokemon" | "berry" | "item" | "move" | "location" | "generation";
  slug: string;                   // URL slug (lowercase-kebab)
  displayName?: string;           // for aria-label
}
```

**Behavior:**
1. On first click, acquire text to speak:
   - For `pokemon` kind with `summary_html` present on the bundle →
     strip HTML, speak plain text, pass through word-highlight handler
     (see below).
   - Otherwise, call `summarizeWithAi()` (browser on-device AI):
     - Try Chrome **`window.LanguageModel`** (Prompt API) with locale-
       specific system prompt + structured narrative context.
     - Fall back to Chrome **`window.Summarizer`** (tldr, plain-text).
     - Final fallback: `narrative(kind, bundle, locale).friendlyFallback`
       — a hand-written natural paragraph per resource kind.
2. Create `SpeechSynthesisUtterance`, set `rate=1, pitch=1, volume=1`,
   `lang` from current locale, voice from user preference.
3. `window.speechSynthesis.cancel()` first, then `.speak(utterance)`.
4. Click again while speaking → stop. Route change → stop. Error → stop.
5. Status state: `idle` → `preparing` → `speaking` → `idle | error`.

**Word-highlight** (see §11):
- Attach `onboundary` handler; map `charIndex` to the nearest `<span
  data-w="n">` whose `n ≤ charIndex < next n`. Toggle a `.is-speaking`
  class on that span.
- On `end`, clear highlight.

### Chrome on-device AI (`src/lib/aiSummarize.ts`)
```ts
export async function summarizeWithAi(
  rawContext: string,
  systemPrompt?: string,
  locale: Locale = "en",
): Promise<{ text: string; source: "prompt" | "summarizer" | "fallback" }>;

export function hasAiSupport(): boolean;
```

Uses `window.LanguageModel?.create({ initialPrompts: [{ role: "system",
content: systemPrompt }], temperature: 0.6, topK: 40 })` when available.
Falls back to `window.Summarizer?.create({ type: "tldr", format:
"plain-text", length: "medium", sharedContext: systemPrompt })`. Final
fallback returns the rawContext unchanged so the caller can substitute
`friendlyFallback`. All calls check `availability()` and degrade
silently. Progress monitor hooks can be wired for "downloading" state.

### Narrative builders (`src/lib/narrative.ts`)
Per resource kind, returns:
```ts
{
  richContext: string,      // key/value structured prompt for AI
  friendlyFallback: string, // hand-written natural paragraph for no-AI case
  systemPrompt: string,     // voice/style directive (locale-specific)
}
```

Functions: `pokemonNarrative`, `berryNarrative`, `itemNarrative`,
`moveNarrative`, `locationNarrative`, `generationNarrative`. System prompt
target: 2–4 warm sentences, no numbers, no markdown, present tense.

---

## 10. Settings, preferences, hotkeys

### Preferences
Stored in localStorage under key `pokedex.prefs` (JSON):
```ts
type Preferences = {
  theme: "blue" | "red" | "yellow",
  mode: "light" | "dark",
  scale: "xs" | "sm" | "md" | "lg" | "xl",
  dir: "ltr" | "rtl",
  voice: string | null,     // SpeechSynthesisVoice.name
};
```

Hook: `usePreferences()` returns `{ prefs, setPref<K>(key, value) }`.
Also ambient `pokedex.locale` key for last-chosen locale (string,
independent of the JSON above).

### Settings popover UI (Radix Popover + ToggleGroup)
- **Theme** (3 radio buttons with colored swatches): Blue, Red, Yellow.
- **Mode** (2 radio buttons): Light, Dark.
- **Text size** (5 radio buttons): xs, sm, md, lg, xl.
- **Direction** (2 radio buttons): LTR, RTL.
- **Voice** (Combobox): "Auto" + list of system voices filtered by the
  current locale. Populated via `useVoices()` hook which listens to
  `speechSynthesis.voiceschanged`.

### Global hotkeys (`@tanstack/react-hotkeys`)
- `/` → focus search input (if not already in a text field)
- `Cmd+K` / `Ctrl+K` → focus search input
- `g` `h` → go Home
- `g` `s` → go Search
- `g` `p` → go Pokémon
- `g` `b` → go Berries
- `g` `i` → go Items
- `g` `l` → go Locations
- `g` `m` → go Moves
- `g` `g` → go Generations
- `[` / `]` → prev/next entry (detail pages)
- `Esc` → close any open Radix popover/dialog (native)

The shortcut sheet is rendered in the footer as a legible legend (
localized).

### Motion & contrast preferences
- `@media (prefers-reduced-motion: reduce)` disables all keyframe
  animations and transitions.
- Contrast: WCAG AA across all 6 theme/mode combos (axe test enforces).

---

## 11. TTS word-highlight

The summary panel on PokemonDetail (and any other page that has
`summary_html`) shows the full text pre-rendered with word spans. When
the user clicks Play:

1. `SpeakButton` reads the container's text content (strip tags).
2. Creates the utterance and subscribes to `onboundary`.
3. On each `boundary` event (word-level on most browsers), finds the
   span whose `data-w` char offset range contains `event.charIndex` and
   toggles the `.is-speaking` class.
4. CSS: `.is-speaking { background: var(--phosphor); color: var(--bg);
   padding: 0 2px; border-radius: 2px; }` — brief visual glow.
5. On `end`, clear highlight.

**Caveats:**
- Not all browsers fire `boundary` events (Firefox desktop: yes;
  Safari: partial; Chrome: yes). If no boundary events fire in ~500 ms,
  we fall back to a synthetic progress bar (no per-word highlight).
- Boundary events reference UTF-16 code-unit offsets; emoji or combining
  marks in translations can shift them. Word-span generation uses the
  same char-offset basis so alignment is exact for the common case.

---

## 12. Build pipeline

### Local commands
```
npm run data:sync          # manual, occasional
npm run bundles:build      # generates public/ui-data/v1/<resource>/<lang>/…
npm run summaries:build    # generates data_generated/summary/<id>_<lang>.txt
                           # (reads public/ui-data/v1; must run bundles:build first)
                           # default concurrency 2
npm run dev                # TanStack Start dev server
npm run build              # typecheck → bundles:build → start build (prerender)
npm run preview            # static server over dist/
npm run typecheck          # tsgo (strict)
npm run lint               # oxlint
npm run format:check       # oxfmt
npm test                   # vitest
npm run test:unit          # vitest run
npm run test:e2e           # playwright
```

### Prerender
TanStack Start's static preset. Route paths are enumerated at build time
by reading each `public/ui-data/v1/<resource>/<lang>/_index.json` and
generating `/<lang>/<resource>/<slug>` for every entry × every locale.
Static routes (`/`, `/<lang>/`, `/<lang>/search`) are listed explicitly.

Concurrency: `prerender.concurrency = os.availableParallelism()` (4 on
free-tier runners).

### CI parallelization (`.github/workflows/deploy.yml`)
Matrix strategy to fan out per-locale builds, merge at deploy:

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, install, lint, format:check, typecheck, test:unit]

  bundles:
    needs: check
    runs-on: ubuntu-latest
    strategy:
      matrix:
        lang: [en, es]
    steps:
      - checkout
      - setup-node + npm ci
      - actions/cache for public/ui-data (keyed on data/api/v2 + bundle script hash)
      - run: npm run bundles:build -- --lang=${{ matrix.lang }}
      - upload-artifact: ui-data-${{ matrix.lang }}

  ssg:
    needs: bundles
    runs-on: ubuntu-latest
    strategy:
      matrix:
        lang: [en, es]
    steps:
      - checkout + setup-node + npm ci
      - download-artifact: ui-data-${{ matrix.lang }} → public/ui-data/v1/…/<lang>/…
      - actions/cache for .tanstack/<lang>-cache (keyed on src hash)
      - run: npm run build -- --lang=${{ matrix.lang }}
      - upload-artifact: dist-${{ matrix.lang }}

  deploy:
    needs: ssg
    runs-on: ubuntu-latest
    steps:
      - download all dist-<lang> artifacts
      - merge into dist/ (dist/<lang>/… plus root landing)
      - upload-pages-artifact path: dist
      - deploy-pages
```

Target: **cold build ≤ 10 min** (2 × ~4 min per-locale, parallel, + ~2
min combined for check/deploy). **Warm build ≤ 3 min** (artifact cache
hits for unchanged locale).

### Incremental build hashing
- `scripts/lib/hash.ts` computes content hash per prerender unit
  (Pokémon, Ability, etc.) = hash of (bundle JSON + template source +
  i18n file for that locale).
- Stored in `.tanstack/<lang>-cache/<hash>.html`.
- Next build: if hash matches, reuse cached HTML instead of re-rendering.
- `actions/cache` persists `.tanstack/` between runs, keyed on a
  per-locale content fingerprint.

---

## 13. Testing strategy

### Unit (Vitest + jsdom)
- `src/lib/__tests__/typeEffectiveness.test.ts` — attack × defender
  damage multiplier algorithm.
- `src/lib/__tests__/formatters.test.ts` — titleCase, padId, unit
  conversions, cleanFlavor.
- `src/lib/__tests__/narrative.test.ts` — narrative builder outputs are
  stable for known inputs.
- `src/styles/__tests__/contrast.test.ts` — static assertions on contrast
  ratios of the CSS variable palette.
- Component tests (vitest + `@testing-library/react` if added): focus
  behavior, keyboard nav, aria attributes on a representative sample
  (SpeakButton, Settings, Autocomplete).

### E2E (Playwright)
- `tests/e2e/navigation.spec.ts`:
  - Home → featured Pokémon card is present.
  - Burger menu → click "Pokémon" → lands at `/en/pokemon`.
  - Autocomplete: type "bulb", see a result, press Enter → land on
    Bulbasaur detail.
  - PokemonDetail: press `]` → next entry; press `[` → prev entry.
  - LocationList: click a card → its areas list expands inline
    (no navigation).
  - LocaleSwitcher: click "Español" on `/en/pokemon/bulbasaur` → land on
    `/es/pokemon/bulbasaur`.
- `tests/e2e/a11y.spec.ts`: for each of 6 theme/mode combos × 4
  representative pages (Home, Pokémon list, Pokémon detail, Search),
  run axe-core and assert zero violations (excluding the "region" rule
  which is relaxed because of the retro UI shell).
- `tests/e2e/speak.spec.ts` (optional / headed-only): smoke that
  SpeakButton triggers a speech event (`speechSynthesis` is mocked in
  Playwright — assert our utterance was queued).
- Playwright `baseURL` points at `http://localhost:4173/pokedex/` via
  `npm run preview`.

### Continuous checks
- CI runs: typecheck, lint, format:check, vitest, playwright.
- Deploy only triggers on push-to-main after CI passes.

---

## 14. Accessibility requirements

Non-negotiable. Verified in CI via axe + manual keyboard-only pass.

- **Landmarks:** `<header>` (navbar), `<main id="main-content">`,
  `<footer>`. Each detail page's `<h1>` is the entity name.
- **Skip link:** visible on focus, jumps to `#main-content`.
- **Focus visible:** `:focus-visible` outline in `var(--phosphor)`.
- **Keyboard:** tab order matches visual order. All interactive elements
  reachable via keyboard. No keyboard traps. Radix handles Esc.
- **ARIA:**
  - icon-only buttons → `aria-label`.
  - expandable cards → `aria-expanded`.
  - toggle buttons → `aria-pressed`.
  - decorative elements (rivets, scanlines, speaker grille, LEDs) →
    `aria-hidden="true"`.
  - SpeakButton status announcement → `role="status"` +
    `aria-live="polite"`.
  - Popover triggers → `aria-describedby` pointing at popover content.
  - Autocomplete → Radix Combobox handles roving ARIA.
- **Color contrast:** WCAG AA across all theme/mode combos.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables
  all animations.
- **`<html lang>`:** set from current locale.
- **RTL:** `data-direction="rtl"` on `<html>` flips layouts where
  appropriate (used for accessibility/preference testing, even though
  EN/ES are both LTR).
- **Screen reader:** tested with VoiceOver on macOS + NVDA on Windows
  during Phase 2 QA.

---

## 15. File layout (target)

```
pokedex/
├── data/api/v2/                       # preserved from v2
├── data_generated/                    # committed; summary text per (id, lang)
│   └── summary/
│       ├── 1_en.txt
│       ├── 1_es.txt
│       └── …
├── public/
│   ├── favicon.svg                    # preserved from v2
│   ├── 404.html                       # (optional) minimal fallback
│   └── ui-data/v1/                    # generated; not committed (built from scripts)
│       ├── pokemon/<lang>/…
│       ├── type/<lang>/…
│       └── …
├── src/
│   ├── routes/                        # TanStack Start file-based routes
│   │   ├── __root.tsx
│   │   ├── index.tsx                  # "/" landing
│   │   ├── $lang/
│   │   │   ├── _layout.tsx            # locale layout + LocaleContext
│   │   │   ├── index.tsx              # "/<lang>/"
│   │   │   ├── search.tsx             # "/<lang>/search"
│   │   │   ├── pokemon.index.tsx      # "/<lang>/pokemon"
│   │   │   ├── pokemon.$name.tsx      # "/<lang>/pokemon/$name"
│   │   │   ├── pokemon-species.$name.tsx
│   │   │   ├── pokemon-form.$name.tsx
│   │   │   ├── type.$name.tsx
│   │   │   ├── ability.$name.tsx
│   │   │   ├── berries.tsx
│   │   │   ├── berry.$name.tsx
│   │   │   ├── items.tsx
│   │   │   ├── item.$name.tsx
│   │   │   ├── moves.tsx
│   │   │   ├── move.$name.tsx
│   │   │   ├── locations.tsx
│   │   │   ├── generations.tsx
│   │   │   └── generation.$name.tsx
│   ├── components/
│   │   ├── Layout.tsx, Navbar.tsx, Footer.tsx
│   │   ├── ConsoleDevice.tsx, ErrorBoundary.tsx, SkipLink.tsx
│   │   ├── Autocomplete.tsx, Combobox.tsx, BurgerMenu.tsx, Settings.tsx,
│   │   │   LocaleSwitcher.tsx
│   │   ├── TypeCartridge.tsx, StatRadar.tsx, WeaknessGrid.tsx,
│   │   │   EvolutionChain.tsx, AbilityButton.tsx, DossierField.tsx,
│   │   │   InfoPopover.tsx, Sprite.tsx, PokemonCard.tsx,
│   │   │   CatalogShell.tsx, PillFilter.tsx, LocationCard.tsx,
│   │   │   PokemonSummary.tsx, SpeakButton.tsx, Pokeball.tsx,
│   │   │   HtmlFragment.tsx
│   ├── pages/                         # (if not using routes/ as page container)
│   ├── lib/
│   │   ├── bundles.ts                 # fetch wrapper
│   │   ├── queries.ts                 # query factories
│   │   ├── aiSummarize.ts             # Chrome on-device AI
│   │   ├── narrative.ts               # per-kind prompt builders
│   │   ├── typeEffectiveness.ts
│   │   ├── formatters.ts
│   │   ├── typeInfo.ts                # TYPE_INFO registry
│   │   ├── dossierInfo.ts             # dossier field metadata
│   │   ├── statInfo.ts
│   │   ├── hash.ts                    # build-time content hashing
│   │   └── preferences.ts             # localStorage + usePreferences hook
│   ├── hooks/
│   │   ├── useVoices.ts
│   │   ├── useAdjacentNav.ts          # [ / ] pager shortcuts
│   │   └── useLocale.ts
│   ├── i18n/
│   │   ├── en.ts                      # Messages master
│   │   └── es.ts
│   ├── types/
│   │   ├── bundles.ts                 # bundle shapes (per §4)
│   │   ├── pokeapi.ts                 # raw PokéAPI response shapes (used by scripts)
│   │   └── locales.ts                 # type Locale = "en" | "es"
│   ├── config/
│   │   └── rendering.ts               # html-fragment vs children registry
│   ├── styles/
│   │   ├── global.css, layout.css, reset.css
│   │   └── components/*.css
│   ├── app.css
│   └── entry.client.tsx (or app/ as Start requires)
├── scripts/
│   ├── sync-data.ts                   # PokéAPI mirror
│   ├── build-bundles.ts               # data/api/v2 → public/ui-data/v1
│   ├── summarize.ts                   # AI summary generator (EN + translation)
│   └── lib/
│       ├── io.ts
│       ├── hash.ts
│       └── transform/
│           ├── pokemon.ts, type.ts, ability.ts, species.ts, form.ts,
│           ├── berry.ts, item.ts, move.ts, location.ts, generation.ts
├── tests/e2e/
│   ├── navigation.spec.ts
│   └── a11y.spec.ts
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── app.config.ts                      # TanStack Start config
├── vite.config.ts                     # (if needed alongside app.config)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── playwright.config.ts
├── package.json
├── README.md
└── redo.md                            # THIS DOCUMENT
```

---

## 16. Implementation phases

**Ground rules for each phase:**
- One phase = one PR-sized commit (or a short series).
- Each phase must leave the app in a runnable, shippable state (even if
  features are stubbed).
- Run `npm run check && npm run test:unit && npm run test:e2e` at the
  end of each phase before marking complete.
- No "Co-Authored-By" trailers (user preference).

### Phase A — Foundation
**Goal:** TanStack Start scaffold with locale-prefixed routing and a
working static build.

1. `npm init`; add dependencies per §2.
2. Create `app.config.ts` with static/gh-pages preset, `basePath:
   "/pokedex"`, prerender.crawlLinks = false (we enumerate explicitly
   in Phase B).
3. Create `src/entry.client.tsx`, `src/entry.server.tsx`, `src/router.tsx`,
   and the minimal `__root.tsx` route with QueryClient + Layout.
4. Scaffold `src/routes/index.tsx` (root landing), `src/routes/$lang/_layout.tsx`
   (locale layout guarding valid `lang` ∈ `{"en","es"}`), and
   `src/routes/$lang/index.tsx` (per-locale home with placeholder
   content).
5. Scaffold Layout / Navbar / Footer / SkipLink / ErrorBoundary (static
   content, no data yet).
6. Wire basic chrome CSS: global tokens, layout shell, 1 theme (Blue
   Dark) applied via `data-theme`/`data-mode` hard-coded in `<html>`.
7. Add `tsconfig.*.json`, `oxlint.json`, `oxfmtrc`, `playwright.config.ts`.
8. Add basic CI workflow (lint, format:check, typecheck, build).
9. Add basic `tests/e2e/smoke.spec.ts` (open `/`, see landing buttons).

**Exit:** `npm run build` produces `dist/index.html`, `dist/en/index.html`,
`dist/es/index.html`; `npm run preview` serves them; smoke test passes.

### Phase B — Data layer
**Goal:** per-locale bundles, query factories, PokemonList working
end-to-end.

1. Port `scripts/sync-data.ts` — PokéAPI mirror (this is effectively
   unchanged from v2).
2. Write `scripts/build-bundles.ts` producing the v3 per-locale layout
   (§4). Start with `pokemon` resource only.
3. Write `src/types/bundles.ts` (§4 shapes).
4. Write `src/lib/bundles.ts` + `src/lib/queries.ts`.
5. Add PokemonList route (`/$lang/pokemon`) with loader +
   `pokemonIndexQuery`. Renders a grid of `PokemonCard`s linking to
   `/$lang/pokemon/$name`.
6. Add PokemonDetail route with loader + `pokemonBundleQuery($name)`.
   Minimal rendering: sprite, name, types, stats list.
7. Extend `build-bundles.ts` to enumerate all pokemon routes for
   prerender. Update `app.config.ts` to pull paths from the pokemon
   index at build time.
8. Verify: `npm run build` prerenders all ~1000 Pokémon pages × 2
   locales. Spot-check a few files have real content (not just
   `<div id="root"></div>`).

**Exit:** `/en/pokemon` lists all Pokémon; `/en/pokemon/bulbasaur`
renders detail (stub styling fine); same for `/es/...`. All pages
pre-rendered to static HTML.

### Phase C — Catalog breadth
**Goal:** all resources (Type, Ability, Species, Form, Berry, Item,
Move, Location, Generation, Search) rendered with appropriate detail.

1. Extend `build-bundles.ts` to emit all resource bundles + search
   index.
2. Add one route per list + detail page. Reuse `CatalogShell` and
   detail-page patterns from Phase B.
3. Implement `WeaknessGrid`, `StatRadar`, `EvolutionChain`,
   `AbilityButton`, `DossierField`, `InfoPopover`, `PillFilter`,
   `LocationCard`.
4. Search page: client-side filter over the per-locale
   `search-index.json`.
5. Add `NotFound` catch-all route.

**Exit:** every route in §5 renders with appropriate content in both
locales. Nav links all resolve. Pager `[` / `]` works on detail pages.

### Phase D — i18n chrome + Settings
**Goal:** UI chrome fully localized; theme/mode/scale/direction/voice
toggles working; locale switcher doing full-page nav.

1. `src/i18n/en.ts` + `src/i18n/es.ts` as typed string maps.
2. `useT()` hook and `useLocale()` hook.
3. Pass 1: replace every hardcoded English string in components + pages
   with `t("key")`.
4. Build Settings popover per §10. localStorage persistence.
   `<html data-theme data-mode data-scale dir>` kept in sync.
5. LocaleSwitcher (2 buttons on root landing, Settings option for
   switching from within locale).
6. BurgerMenu with localized nav labels.
7. Global hotkeys (`react-hotkeys`) per §10.

**Exit:** Every chrome string switches when user flips locale. All 6
theme/mode combos render correctly. Hotkeys work.

### Phase E — AI summary generator
**Goal:** `data_generated/summary/<id>_{en,es}.txt` for the full
pokedex; inlined as `summary_html` in bundles.

1. Write `scripts/summarize.ts` with EN + ES single-call output
   (§9). Default model haiku + WebSearch permission.
2. Run on CI against commit data (manual trigger OK — the generator is
   not part of the default build pipeline because of API costs).
3. Extend `build-bundles.ts` to read `data_generated/summary/<id>_<lang>.txt`,
   wrap words in `<span data-w="n">` tokens, store as
   `summary_html` on each `PokemonBundle`.
4. `PokemonSummary` component renders `summary_html` via
   `dangerouslySetInnerHTML`.

**Exit:** Every Pokémon detail page shows a 2-3 min narrated entry in
both locales, as visible text. No speech yet.

### Phase F — Read-aloud + word highlight
**Goal:** SpeakButton works across kinds; PokemonDetail highlights
current word during speech.

1. `src/lib/aiSummarize.ts` + `src/lib/narrative.ts` per §9.
2. `SpeakButton` component with state machine (idle → preparing →
   speaking). Uses `speechSynthesis` + AI fallback chain.
3. Word-highlight controller attached when `summary_html` is present.
4. `useVoices` hook + voice selection in Settings.
5. Tests: mock `speechSynthesis`; assert SpeakButton dispatches
   `.speak()` with expected args.

**Exit:** Pokémon detail Play button narrates in ~2-3 min, highlights
words in real time. Berry/Item/Move/Location/Generation Speak buttons
narrate via on-device AI or narrative fallback.

### Phase G — Bundle minimization & HTML-fragment islands
**Goal:** per-route client JS under budget.

1. `HtmlFragment` component (`{ html: string; as?: keyof JSX.IntrinsicElements }`).
2. `src/config/rendering.ts` registry; flip flavor/ability-effect/weakness-grid
   cells/summary body to HtmlFragment by default.
3. `React.lazy()` boundaries: Autocomplete, Combobox, SpeakButton,
   BurgerMenu, Settings, AbilityButton popover content.
4. `rollup-plugin-visualizer` in CI; assert pokemon detail client JS
   gzipped < 60 KB.
5. Lighthouse CI check on a few representative pages.

**Exit:** Bundle budget passes in CI. Lighthouse mobile performance ≥
90 on Pokémon detail.

### Phase H — CI parallelization & deploy
**Goal:** cold build ≤ 10 min, warm ≤ 3 min.

1. Rewrite `deploy.yml` per §12: matrix strategy for bundles + ssg.
2. `actions/cache` for `public/ui-data/*` and `.tanstack/<lang>-cache/*`.
3. Deploy merge step combining per-locale `dist/<lang>/` artifacts.
4. Verify on a test branch: change one EN summary, push, confirm only
   EN re-renders (ES cache hit).

**Exit:** Production deploy runs under budget. Warm rebuild confirmed
fast.

---

## 17. Reference data & inline constants

These move to `src/lib/` files but are captured here so the implementor
has them at hand.

### Types (18 + Stellar + Unknown)
```
TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark",
  "steel","fairy","stellar","unknown"
]

Per type:
  display     (localized)
  short       (3-letter code; uppercase)
  color       (hex background for type pill)
  textColor   (hex; readable on background)
  description (localized 1-liner for popover)
```

Base colors (dark-mode friendly; tune for WCAG AA against `--case`
backgrounds):
```
normal   #A8A77A  fighting #C22E28  flying   #A98FF3
poison   #A33EA1  ground   #E2BF65  rock     #B6A136
bug      #A6B91A  ghost    #735797  steel    #B7B7CE
fire     #EE8130  water    #6390F0  grass    #7AC74C
electric #F7D02C  psychic  #F95587  ice      #96D9D6
dragon   #6F35FC  dark     #705746  fairy   #D685AD
stellar  #40E0D0  unknown  #7F7F7F
```

### Stats
```
["hp","attack","defense","special-attack","special-defense","speed"]

Display labels (EN):
  hp → "HP"
  attack → "Attack"
  defense → "Defense"
  special-attack → "Sp. Atk"
  special-defense → "Sp. Def"
  speed → "Speed"
```

### Dossier fields
```
height, weight, base-experience, capture-rate, base-happiness,
hatch-counter, habitat, shape, color, growth-rate, egg-groups,
rarity (legendary/mythical/baby), generation, form-name, version-group
```

Each has a localized short description that shows in the `?` popover.

### Evolution triggers
Map PokéAPI `evolution_details[0]` shape to a short localized label:
- `min_level: N` → "LVL N" / "Nv. N"
- `item: { name }` → TitleCased item name (localized)
- `trigger: { name }` → humanized label ("trade", "friendship", "moon-stone")

### Multipliers (type effectiveness)
```
0     "×0"   token "zero"   headline "No effect"
0.25  "×¼"   token "qtr"    headline "Not very effective"
0.5   "×½"   token "half"   headline "Not very effective"
1     "×1"   token "one"    headline "Normal damage"
2     "×2"   token "two"    headline "Super effective"
4     "×4"   token "four"   headline "Super effective"
```

---

## 18. Open decisions (flag before Phase A)

1. **Second locale:** recommendation `es`. Swap to `fr` / `de` if
   preferred. Japanese (`ja-hrkt`) complicates word-highlight — avoid
   unless you want to drop TTS highlighting.
2. **Root landing UX:** static EN copy with 2 big language buttons
   (recommended). Alternative: auto-redirect based on
   `localStorage.pokedex.locale` or `navigator.language`.
3. **Summary generation CI:** keep **manual** (`npm run
   summaries:build` locally, commit output) to avoid API costs in PR
   runs. Alternative: GitHub Actions workflow with `ANTHROPIC_API_KEY`
   secret, runs on demand only.
4. **TanStack Start RSC:** probably skip for v3. Revisit if client bundle
   remains heavy after Phase G.
5. **Content-security policy:** not defined. If adding one later, budget
   for `unsafe-inline` on styles (for CSS-in-JS-like dynamic tokens) and
   fetch allowlist for sprite CDNs.

---

## 19. Scope markers — what's in v3 and what's out

**In v3:**
- Everything in §5 (all pages from v2).
- 2-locale content + chrome translation.
- AI-narrated read-aloud with word highlight on Pokémon.
- Settings (theme/mode/scale/direction/voice).
- Full accessibility compliance (WCAG AA).
- Static prerender, per-locale CI parallelization.
- HTML-fragment rendering for static subtrees, React for interactive.

**Out of v3 (future / not committed):**
- React Server Components.
- PWA / offline mode.
- User accounts, favorites, decks, team builder.
- Multiplayer comparisons.
- Generation 10 / future Pokémon releases beyond current data mirror.
- Analytics / telemetry.
- Custom font files (stick to system stack).
- More than 2 locales (revisit if scope + runner budget expands).

---

## 20. Preservation manifest

After wiping the repo, **ONLY these files remain**:
- `data/api/v2/**` (PokéAPI raw mirror)
- `public/favicon.svg`
- `LICENSE`
- `.git/` (history preserved — old implementation remains retrievable via
  git log)
- `redo.md` (this document)

Everything else — `src/`, `scripts/`, `public/bundles/`, configs, tests,
package.json, tsconfig files, .github/workflows/, node_modules, etc. —
is removed. The rebuild starts from this minimal base.

---

*End of redo.md. When Phase A begins, this file stays at the repo root
as the living spec; amend in-place if decisions change mid-rebuild.*
