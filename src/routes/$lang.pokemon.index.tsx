import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import type { Rarity } from "~/types/bundles";
import { abilityIndexQuery, pokemonIndexQuery, typeIndexQuery } from "~/lib/queries";
import { PokemonCard } from "~/components/PokemonCard";
import { CatalogShell } from "~/components/CatalogShell";
import { FilterBar, MultiFilter, NameFilter, SingleFilter } from "~/components/FilterBar";
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
    { value: "standard", label: lang === "fr" ? "Standard" : "Standard" },
    { value: "legendary", label: lang === "fr" ? "Légendaire" : "Legendary" },
    { value: "mythical", label: lang === "fr" ? "Fabuleux" : "Mythical" },
    { value: "baby", label: lang === "fr" ? "Bébé" : "Baby" },
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
          placeholder={lang === "fr" ? "Filtrer par nom…" : "Filter by name…"}
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
          label={lang === "fr" ? "Rareté" : "Rarity"}
          options={rarityOptions}
          value={rarity}
          onChange={setRarity}
        />
        {anyActive ? (
          <button type="button" className="pill-button" onClick={clearAll}>
            {lang === "fr" ? "Effacer" : "Clear"}
          </button>
        ) : null}
      </FilterBar>

      <div className="filter-summary">
        <span>
          {filtered.length} / {data.total}
        </span>
      </div>

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
          {lang === "fr" ? "Aucun résultat. Ajustez les filtres." : "No results. Adjust filters."}
        </div>
      )}
    </CatalogShell>
  );
}
