# Pokédex

A modern, accessible Pokédex web app. Browse, search, and explore every Pokémon,
type, ability, species, and form. Powered by the [PokéAPI](https://pokeapi.co).

**Live:** https://projects.sujeet.pro/pokedex

## Versions

- **v1** (tag `v1`, branch `v1-angular`) — the original Angular 8 + Firebase implementation.
- **v2** (current `master`) — a rewrite in React 19 with Vite and TanStack libraries.

## Stack (v2)

Built on [Vite+](https://viteplus.dev/) — a unified toolchain combining Vite, Vitest, and oxc.

| Concern        | Tool                                                           |
| -------------- | -------------------------------------------------------------- |
| Dev server     | [Vite 6](https://vitejs.dev/) (Rolldown internals)             |
| Build          | Vite → Rolldown                                                |
| Language       | TypeScript (100%), type-checked with `@typescript/native-preview` (`tsgo`, Go port) |
| Lint           | [oxlint](https://oxc.rs/docs/guide/usage/linter)               |
| Format         | [oxfmt](https://oxc.rs/docs/guide/usage/formatter)             |
| Test           | [Vitest](https://vitest.dev)                                   |
| UI             | React 19 (+ React Compiler)                                    |
| Primitives     | [Radix UI](https://www.radix-ui.com/) (Popover, ToggleGroup, VisuallyHidden) |
| Routing        | [TanStack Router](https://tanstack.com/router) (type-safe)     |
| Data           | [TanStack Query](https://tanstack.com/query)                   |
| Hotkeys        | [TanStack Hotkeys](https://tanstack.com/hotkeys)               |

## Features

- **Pokémon of the day** on the home page — deterministic per UTC date
- **Autocomplete search** by partial name (listbox with keyboard navigation)
- **Search page** at `/search?q=...` — partial match or `all`
- **Detail pages** for Pokémon, types, abilities, species, and forms
- **Evolution chains** rendered on Pokémon detail
- **Personalization**
  - 3 themes: blue, yellow, red (also updates `theme-color` meta)
  - Light / dark mode
  - 5 text sizes (XS → XL)
  - LTR / RTL direction toggle
  - Preferences persist in `localStorage` and apply before first render (no FOUC)
- **Keyboard shortcuts**
  - `/` — focus the global search
  - `g` `h` — go home
  - `g` `s` — go to search
  - `Esc` — close popovers / autocomplete menus
- **Accessibility — WCAG 2.2 AA targeted**
  - Skip-to-content link
  - Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`)
  - Visible focus, ≥ 3:1 focus contrast
  - Live regions for async result counts
  - ARIA combobox pattern for autocomplete
  - `prefers-reduced-motion` honored
  - Radix primitives for focus trap + ESC dismissal on menus
- **Performance**
  - React Compiler handles memoization
  - Code-splitting via Vite manual chunks (react / router / query)
  - `content-visibility: auto` on card grids
  - Deferred values for pagination transitions
  - Lazy image loading + error fallbacks

## Scripts

```
npm run dev         # start Vite dev server
npm run build       # typecheck + production build
npm run preview     # preview the production build
npm run lint        # oxlint
npm run format      # oxfmt
npm run typecheck   # tsgo
npm run check       # lint + format check + typecheck
npm test            # vitest
```

## Project layout

```
src/
├── api/            # PokéAPI client + query factories
├── components/     # Reusable UI pieces (cards, autocomplete, settings, …)
├── hooks/          # useLocalStorage, useDebounced, usePreferences
├── pages/          # One file per route component
├── router.tsx      # TanStack Router definition
├── styles/         # global.css + layout.css (CSS custom properties, tokens)
├── types/          # PokéAPI types
└── utils/          # Formatters and small helpers
```

## Deployment

Static build in `dist/` is published to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `master`. The app expects to be
served from the path `/pokedex/` — configured via Vite's `base` option.

Deep-link support on GitHub Pages uses a `public/404.html` redirect shim that
stashes the original path in `?__redirect=…` and the SPA reads it on boot.

> If you serve this from a different base, update `base` in `vite.config.ts`
> and the repo prefix in `public/404.html` / `index.html`.

## Data source

All content comes from [PokéAPI](https://pokeapi.co/docs/v2). Pokémon is a
trademark of Nintendo / Game Freak / The Pokémon Company — this project is a
fan-made educational demo.
