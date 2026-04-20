import { Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { generationIndexQuery, pokemonIndexQuery } from "~/api/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { Combobox } from "~/components/Combobox";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { ALL_TYPES, typeInfo } from "~/utils/typeInfo";
import { padId, titleCase } from "~/utils/formatters";

function PokemonGrid() {
  const { data } = useSuspenseQuery(pokemonIndexQuery());
  const { data: genIndex } = useSuspenseQuery(generationIndexQuery());
  const [type, setType] = useState("");
  const [generation, setGeneration] = useState("");

  const typeOptions = useMemo(
    () => ALL_TYPES.map((t) => ({ value: t, label: typeInfo(t).display })),
    [],
  );

  const generationOptions = useMemo(
    () =>
      genIndex.entries.map((g) => ({
        value: g.name,
        label: g.display_name,
      })),
    [genIndex.entries],
  );

  const filtered = useMemo(
    () =>
      data.entries.filter(
        (e) =>
          (!type || e.types.includes(type)) && (!generation || e.generation === generation),
      ),
    [data.entries, type, generation],
  );

  return (
    <CatalogShell
      title="POKÉ DEX · POKÉMON"
      subtitleLabel={`${data.total} species`}
      placeholder="Filter Pokémon by name…"
      entries={filtered}
      keyOf={(e) => e.name}
      matches={(e, q) => e.name.includes(q)}
      toolbar={
        <>
          <Combobox
            label="Type"
            options={typeOptions}
            value={type}
            onChange={setType}
            placeholder="Type a type…"
          />
          <Combobox
            label="Generation"
            options={generationOptions}
            value={generation}
            onChange={setGeneration}
            placeholder="Type a generation…"
          />
        </>
      }
      layout="rows"
      renderItem={(e) => (
        <Link
          to="/pokemon/$name"
          params={{ name: e.name }}
          className="catalog-row"
          aria-label={`${titleCase(e.name)}, ${padId(e.id)}`}
        >
          <div className="catalog-row__sprite">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.id}.png`}
              alt=""
              width={450}
              height={450}
              loading="lazy"
              decoding="async"
              onError={(ev) => {
                (ev.currentTarget as HTMLImageElement).src =
                  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.id}.png`;
              }}
            />
          </div>
          <div className="catalog-row__body">
            <div className="catalog-row__id">{padId(e.id)}</div>
            <p className="catalog-row__name">{titleCase(e.name)}</p>
            <div className="catalog-row__meta">
              {e.types.map((t) => (
                <TypeCartridge key={t} name={t} size="sm" asLink={false} />
              ))}
            </div>
            {e.generation && (
              <div className="catalog-row__detail">
                {titleCase(e.generation.replace("generation-", "Gen "))}
              </div>
            )}
          </div>
        </Link>
      )}
    />
  );
}

export function PokemonListPage() {
  return (
    <Suspense
      fallback={
        <ConsoleDevice title="POKÉ DEX · POKÉMON" subtitle="loading" ariaLabel="Loading Pokémon">
          <div className="skeleton" style={{ height: "20rem" }} />
        </ConsoleDevice>
      }
    >
      <PokemonGrid />
    </Suspense>
  );
}
