# Pokédex → Console redesign

**Direction:** Option A — Pokédex Console (game-authentic device chrome: red bezel, scanline screen, hex radar, cartridge type badges, 18-cell weakness heatmap).

**Selected by user:** 2026-04-20.

## Signature elements

- **Device chrome** — red bezel with rivets, status LEDs, speaker grille, D-pad + A/B decoration.
- **Screen** — dark-phosphor surface with CRT scanlines, corner reticle, animated scan sweep over sprite (respects `prefers-reduced-motion`).
- **Hex stat radar** — 6-vertex SVG polygon (HP/Atk/Def/Spe/SpD/SpA), filled with phosphor gradient.
- **Cartridge type badges** — notched clip-path with colored chip + label.
- **18-slot weakness heatmap** — each cell is an interactive Radix Popover explaining type + multiplier + breakdown + link to `/type/:name`.
- **Typography** — Open Sans body; JetBrains Mono for all HUD text, IDs, values, and code.

## A11y + keyboard contract

- Weakness cells are real `<button>` inside `Popover.Trigger asChild` — native keyboard (Tab, Enter, Esc), Radix handles focus return.
- Stat radar has `role="img"` + `aria-label` listing all stats, plus a visually-hidden `<dl>` mirror for screen readers.
- Every interactive element ≥ 32×32 px (cells 40×40+).
- Focus-visible: 2 px phosphor ring, 2 px offset.
- Scan sweep + LED pulse wrapped in `@media (prefers-reduced-motion: no-preference)`.
- Phosphor text (#b6e3bf) on screen bg (#0a1410) → contrast ≈ 12:1, well above WCAG AA.
- Skip link preserved.
- Hotkeys preserved: `/` search · `g h` home · `g s` search.

## Responsive contract

- Device max-width 1280 px; scales down to ≥ 320 px.
- HUD grid (sprite + radar/weakness/facts) collapses to single column under 960 px.
- Weakness grid keeps 6 columns — cells shrink; label stays legible at 11 px.
- Catalog: `auto-fill` minmax(180 px, 1fr).
- D-pad/A-B hidden on narrow; nav buttons become pills.

## File plan

### New files
- `src/utils/typeInfo.ts` — name, short-code, color, one-line description for all 18 types.
- `src/utils/typeEffectiveness.ts` — `damageTaken(defenders)` + `breakdownForAttack(attack, defenders)` computed from `TypeDetail.damage_relations`.
- `src/components/StatRadar.tsx` + `src/styles/components/StatRadar.css` — hex radar + visually-hidden dl fallback.
- `src/components/WeaknessGrid.tsx` + `src/styles/components/WeaknessGrid.css` — 18 cells with Radix Popover explainer.
- `src/components/TypeCartridge.tsx` + `src/styles/components/TypeCartridge.css` — cartridge-style type label.
- `src/components/ConsoleDevice.tsx` + `src/styles/components/Console.css` — device bezel shell, screen wrapper, head/foot.

### Modified
- `src/styles/global.css` — console tokens (casing, phosphor, amber, screen bg), scanline pattern, focus ring, reduced-motion guards.
- `src/styles/layout.css` — rewrite for device chrome + catalog grid.
- `src/components/Layout.tsx` — top bar themed as device status strip, keeps search + settings.
- `src/components/Settings.tsx` — retitle; keep Radix primitives; restyle via CSS.
- `src/components/PokemonCard.tsx` — console catalog card (scanline bg + type chips).
- `src/components/TypeBadge.tsx` — delegate to `TypeCartridge` (or keep as small variant for inline use).
- `src/components/StatBar.tsx` — kept for fallback; restyled to match.
- `src/pages/Home.tsx` — device hero (featured pokémon in console) + catalog grid.
- `src/pages/PokemonDetail.tsx` — full device chrome with hex radar + weakness grid + cartridges + evolution + dossier facts.
- `src/pages/Search.tsx` — secondary screen.
- `src/pages/SpeciesDetail.tsx` — secondary screen.
- `src/pages/TypeDetail.tsx` — secondary screen (damage relations stylised as 6-bucket matrix).
- `src/pages/AbilityDetail.tsx` — secondary screen.
- `src/pages/FormDetail.tsx` — secondary screen.
- `src/pages/NotFound.tsx` — "SIGNAL LOST" console error.
- `index.html` — theme-color + body fallback bg to avoid flash.

## Validation

- `npm run check` (oxlint + oxfmt + tsgo)
- `npm test` (none applicable — no test files yet; will note)
- `npm run build` — inspect bundle size
- Manual: keyboard pass on detail page (Tab through every weakness cell, open + close popover, Esc, navigate to linked type page).
- Manual: mobile viewport (360 px) responsive check.
- Manual: `prefers-reduced-motion` — sweep + scanline still render but don't animate.
