import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { abilityQuery } from "~/api/queries";
import { abilityRoute } from "~/router";
import { cleanFlavor, englishEntry, titleCase } from "~/utils/formatters";

function AbilityDetailContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(abilityQuery(name));
  const english = englishEntry(data.effect_entries);
  const flavor = englishEntry(data.flavor_text_entries);
  const displayName = englishEntry(data.names)?.name ?? titleCase(data.name);

  return (
    <>
      <h1 className="page-title">{displayName}</h1>
      <p className="page-lede">
        Ability · Generation: {data.generation.name.replace("generation-", "")} ·{" "}
        {data.pokemon.length} Pokémon can have this ability.
      </p>

      {english && (
        <section className="panel" aria-labelledby="effect-heading">
          <h2 id="effect-heading">Effect</h2>
          <p style={{ margin: "0 0 0.5rem" }}>{english.short_effect}</p>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{english.effect}</p>
        </section>
      )}

      {flavor && (
        <section className="panel" aria-labelledby="flavor-heading" style={{ marginTop: "1rem" }}>
          <h2 id="flavor-heading">Flavor text</h2>
          <p style={{ margin: 0 }}>{cleanFlavor(flavor.flavor_text)}</p>
        </section>
      )}

      <section className="panel" aria-labelledby="mon-heading" style={{ marginTop: "1rem" }}>
        <h2 id="mon-heading">Pokémon with {displayName}</h2>
        <ul className="pill-list">
          {data.pokemon.map((p) => (
            <li key={p.pokemon.name}>
              <Link to="/pokemon/$name" params={{ name: p.pokemon.name }} className="pill">
                {titleCase(p.pokemon.name)}
                {p.is_hidden && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75em" }}>
                    {" "}
                    (hidden)
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function AbilityDetailPage() {
  const { id } = abilityRoute.useParams();
  return (
    <Suspense
      fallback={<div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />}
    >
      <AbilityDetailContent name={id.toLowerCase()} />
    </Suspense>
  );
}
