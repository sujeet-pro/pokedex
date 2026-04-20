import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { typeQuery } from "~/api/queries";
import { typeRoute } from "~/router";
import { TypeBadge } from "~/components/TypeBadge";
import type { NamedResource } from "~/types/pokeapi";
import { titleCase } from "~/utils/formatters";

function Relation({ label, list }: { label: string; list: NamedResource[] }) {
  return (
    <div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>{label}</h3>
      {list.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)" }}>None</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {list.map((t) => (
            <TypeBadge key={t.name} name={t.name} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeDetailContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(typeQuery(name));
  const r = data.damage_relations;

  return (
    <>
      <h1 className="page-title" style={{ textTransform: "capitalize" }}>
        <TypeBadge name={data.name} asLink={false} /> type
      </h1>
      <p className="page-lede">
        Generation: {data.generation.name.replace("generation-", "")}. {data.pokemon.length}{" "}
        Pokémon, {data.moves.length} moves.
      </p>

      <section className="panel" aria-labelledby="rel-heading">
        <h2 id="rel-heading">Damage relations</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <Relation label="Double damage to" list={r.double_damage_to} />
          <Relation label="Half damage to" list={r.half_damage_to} />
          <Relation label="No damage to" list={r.no_damage_to} />
          <Relation label="Double damage from" list={r.double_damage_from} />
          <Relation label="Half damage from" list={r.half_damage_from} />
          <Relation label="No damage from" list={r.no_damage_from} />
        </div>
      </section>

      <section className="panel" aria-labelledby="mon-heading" style={{ marginTop: "1rem" }}>
        <h2 id="mon-heading">Pokémon of this type</h2>
        <ul className="pill-list">
          {data.pokemon.slice(0, 60).map((p) => (
            <li key={p.pokemon.name}>
              <Link to="/pokemon/$name" params={{ name: p.pokemon.name }} className="pill">
                {titleCase(p.pokemon.name)}
              </Link>
            </li>
          ))}
        </ul>
        {data.pokemon.length > 60 && (
          <p style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Showing 60 of {data.pokemon.length}
          </p>
        )}
      </section>
    </>
  );
}

export function TypeDetailPage() {
  const { id } = typeRoute.useParams();
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />}>
      <TypeDetailContent name={id.toLowerCase()} />
    </Suspense>
  );
}
