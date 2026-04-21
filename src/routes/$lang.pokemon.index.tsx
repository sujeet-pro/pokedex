import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import type { Rarity } from "~/types/bundles";
import { abilityIndexQuery, pokemonIndexQuery, typeIndexQuery } from "~/lib/queries";
import { PokemonCard } from "~/components/PokemonCard";
import { CatalogShell } from "~/components/CatalogShell";
import {
  ActiveFilters,
  FilterBar,
  MultiFilter,
  NameFilter,
  SingleFilter,
  type ActiveFilterTag,
} from "~/components/FilterBar";
import { makeT } from "~/i18n";

export const Route = createFileRoute("/$lang/pokemon/")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await Promise.all([
      context.queryClient.ensureQueryData(pokemonIndexQuery(params.lang)),
      context.queryClient.ensureQueryData(typeIndexQuery(params.lang)),
      context.queryClient.ensureQueryData(abilityIndexQuery(params.lang)),
    ]);
  },
  component: PokemonListPage,
  head: ({ params }) => ({ meta: [{ title: `Pokémon · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function PokemonListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonIndexQuery(lang));
  const { data: typeIndex } = useSuspenseQuery(typeIndexQuery(lang));
  const { data: abilityIndex } = useSuspenseQuery(abilityIndexQuery(lang));

  const [name, setName] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [abilities, setAbilities] = useState<string[]>([]);
  const [rarity, setRarity] = useState<string | null>(null);

  const typeOptions = useMemo(
    () =>
      typeIndex.entries
        .filter((e) => e.name !== "unknown" && e.name !== "shadow")
        .map((e) => ({ value: e.name, label: e.display_name })),
    [typeIndex.entries],
  );

  const abilityOptions = useMemo(
    () => abilityIndex.entries.map((e) => ({ value: e.name, label: e.display_name })),
    [abilityIndex.entries],
  );

  const rarityOptions: Array<{ value: Rarity; label: string }> = [
    { value: "standard", label: t("rarity_standard") },
    { value: "legendary", label: t("rarity_legendary") },
    { value: "mythical", label: t("rarity_mythical") },
    { value: "baby", label: t("rarity_baby") },
  ];

  const filtered = useMemo(() => {
    const q = name.trim();
    const needle = q ? normalize(q) : "";
    return data.entries.filter((e) => {
      if (needle && !normalize(e.display_name).includes(needle) && !normalize(e.name).includes(needle)) {
        return false;
      }
      if (types.length > 0 && !types.every((t) => e.types.includes(t))) return false;
      if (
        abilities.length > 0 &&
        !abilities.every((a) => e.abilities.includes(a))
      )
        return false;
      if (rarity && e.rarity !== rarity) return false;
      return true;
    });
  }, [data.entries, name, types, abilities, rarity]);

  const anyActive = name || types.length > 0 || abilities.length > 0 || rarity;
  const clearAll = () => {
    setName("");
    setTypes([]);
    setAbilities([]);
    setRarity(null);
  };

  const activeTags: ActiveFilterTag[] = [];
  if (name.trim()) {
    activeTags.push({
      id: "name",
      label: t("filter_name"),
      value: name.trim(),
      onRemove: () => setName(""),
    });
  }
  for (const value of types) {
    const opt = typeOptions.find((o) => o.value === value);
    activeTags.push({
      id: `type:${value}`,
      label: t("filter_types"),
      value: opt?.label ?? value,
      onRemove: () => setTypes(types.filter((x) => x !== value)),
    });
  }
  for (const value of abilities) {
    const opt = abilityOptions.find((o) => o.value === value);
    activeTags.push({
      id: `ability:${value}`,
      label: t("filter_abilities"),
      value: opt?.label ?? value,
      onRemove: () => setAbilities(abilities.filter((a) => a !== value)),
    });
  }
  if (rarity) {
    const opt = rarityOptions.find((o) => o.value === rarity);
    activeTags.push({
      id: `rarity:${rarity}`,
      label: t("filter_rarity"),
      value: opt?.label ?? rarity,
      onRemove: () => setRarity(null),
    });
  }

  return (
    <CatalogShell
      title={t("list_pokemon_heading")}
      lede={t("list_pokemon_subtitle")}
      count={data.total}
    >
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "es" ? "Filtrar por nombre…" : "Filter by name…"}
        />
        <MultiFilter
          label={t("detail_types")}
          options={typeOptions}
          selected={types}
          onChange={setTypes}
        />
        <MultiFilter
          label={t("detail_abilities")}
          options={abilityOptions}
          selected={abilities}
          onChange={setAbilities}
        />
        <SingleFilter
          label={t("filter_rarity")}
          options={rarityOptions}
          value={rarity}
          onChange={setRarity}
        />
        {anyActive ? (
          <button type="button" className="pill-button" onClick={clearAll}>
            {t("filter_clear_all")}
          </button>
        ) : null}
      </FilterBar>

      <ActiveFilters
        tags={activeTags}
        count={`${filtered.length} / ${data.total}`}
        removeLabel={t("filter_remove")}
      />

      {filtered.length > 0 ? (
        <ul className="grid-cards" aria-label="Pokémon list">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <PokemonCard entry={entry} locale={lang} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="filter-empty">
          {lang === "es" ? "Sin resultados. Ajusta los filtros." : "No results. Adjust filters."}
        </div>
      )}
    </CatalogShell>
  );
}
