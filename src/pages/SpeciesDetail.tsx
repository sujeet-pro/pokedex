import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { speciesQuery } from "~/api/queries";
import { speciesRoute } from "~/router";
import { cleanFlavor, englishEntry, titleCase } from "~/utils/formatters";

function SpeciesDetailContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(speciesQuery(name));
  const flavor = englishEntry(data.flavor_text_entries);
  const genus = englishEntry(data.genera);
  const displayName = englishEntry(data.names)?.name ?? titleCase(data.name);

  return (
    <>
      <h1 className="page-title">{displayName}</h1>
      {genus && <p className="page-lede">{genus.genus}</p>}

      {flavor && (
        <section className="panel" aria-labelledby="flavor-heading">
          <h2 id="flavor-heading">Pokédex entry</h2>
          <p style={{ margin: 0 }}>{cleanFlavor(flavor.flavor_text)}</p>
        </section>
      )}

      <section className="panel" aria-labelledby="details-heading" style={{ marginTop: "1rem" }}>
        <h2 id="details-heading">Species details</h2>
        <dl className="meta">
          <div>
            <dt>Generation</dt>
            <dd>{data.generation.name.replace("generation-", "")}</dd>
          </div>
          <div>
            <dt>Color</dt>
            <dd>{data.color.name}</dd>
          </div>
          {data.habitat && (
            <div>
              <dt>Habitat</dt>
              <dd>{data.habitat.name}</dd>
            </div>
          )}
          {data.shape && (
            <div>
              <dt>Shape</dt>
              <dd>{data.shape.name}</dd>
            </div>
          )}
          <div>
            <dt>Capture rate</dt>
            <dd>{data.capture_rate}</dd>
          </div>
          <div>
            <dt>Base happiness</dt>
            <dd>{data.base_happiness}</dd>
          </div>
          <div>
            <dt>Legendary</dt>
            <dd>{data.is_legendary ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Mythical</dt>
            <dd>{data.is_mythical ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel" aria-labelledby="var-heading" style={{ marginTop: "1rem" }}>
        <h2 id="var-heading">Varieties</h2>
        <ul className="pill-list">
          {data.varieties.map((v) => (
            <li key={v.pokemon.name}>
              <Link to="/pokemon/$name" params={{ name: v.pokemon.name }} className="pill">
                {titleCase(v.pokemon.name)}
                {v.is_default && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75em" }}>
                    {" "}
                    (default)
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

export function SpeciesDetailPage() {
  const { id } = speciesRoute.useParams();
  return (
    <Suspense
      fallback={<div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />}
    >
      <SpeciesDetailContent name={id.toLowerCase()} />
    </Suspense>
  );
}
