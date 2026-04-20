import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formQuery } from "~/api/queries";
import { formRoute } from "~/router";
import { Sprite } from "~/components/Sprite";
import { TypeBadge } from "~/components/TypeBadge";
import { englishEntry, titleCase } from "~/utils/formatters";

function FormDetailContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(formQuery(name));
  const art = data.sprites.front_default;
  const display = englishEntry(data.names)?.name ?? titleCase(data.name);

  return (
    <article className="detail">
      <aside className="detail__hero" aria-label="Form summary">
        <h1 className="detail__name">{display}</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Form of{" "}
          <Link to="/pokemon/$name" params={{ name: data.pokemon.name }}>
            {titleCase(data.pokemon.name)}
          </Link>
        </div>
        <div className="detail__sprite">
          <Sprite src={art} alt={`${data.name} sprite`} size={256} priority />
        </div>
        <div className="detail__types" aria-label="Types">
          {data.types.map((t) => (
            <TypeBadge key={t.type.name} name={t.type.name} />
          ))}
        </div>
      </aside>
      <div className="detail__body">
        <section className="panel" aria-labelledby="form-heading">
          <h2 id="form-heading">Form details</h2>
          <dl className="meta">
            <div>
              <dt>Form name</dt>
              <dd>{data.form_name || "—"}</dd>
            </div>
            <div>
              <dt>Version group</dt>
              <dd>{data.version_group.name}</dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
  );
}

export function FormDetailPage() {
  const { id } = formRoute.useParams();
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />}>
      <FormDetailContent name={id.toLowerCase()} />
    </Suspense>
  );
}
