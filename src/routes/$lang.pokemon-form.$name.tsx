import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { formBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { HudSprite } from "~/components/HudSprite";
import { TypeCartridge } from "~/components/TypeCartridge";

export const Route = createFileRoute("/$lang/pokemon-form/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(formBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: FormDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Form · Pokédex` }] }),
});

function FormDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(formBundleQuery(lang, name));

  const tags: string[] = [];
  if (data.is_default) tags.push("Default");
  if (data.is_mega) tags.push("Mega");
  if (data.is_battle_only) tags.push("Battle-only");

  return (
    <ConsoleDevice
      title={data.display_name}
      subtitle={`FORM · ${padDex(data.id)} · ${data.version_group.toUpperCase()}`}
    >
      <div className="screen__hud">
        <div>
          <HudSprite src={data.sprite} alt={data.display_name} priority />
        </div>
        <div className="hud__column">
          <p className="hud-row"><b>FORM</b>&nbsp;&nbsp;{data.form_name || data.name}</p>
          <h1 className="hud-name">{data.display_name}</h1>
          <p className="hud-genus">{data.version_group}</p>

          {tags.length > 0 ? (
            <ul className="pill-list" aria-label="Flags">
              {tags.map((tag) => (
                <li key={tag}>
                  <span className="pill">{tag}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {data.types.length > 0 ? (
            <ul className="cart-row pill-list" aria-label="Types">
              {data.types.map((t) => (
                <li key={t}>
                  <TypeCartridge name={t} locale={lang} asLink />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="hud-card">
            <div className="hud-card__title"><span>Base Pokémon</span></div>
            <Link
              to="/$lang/pokemon/$name"
              params={{ lang, name: data.pokemon.name }}
              className="pill"
            >
              {data.pokemon.display_name} · {padDex(data.pokemon.id)}
            </Link>
          </div>
        </div>
      </div>
    </ConsoleDevice>
  );
}
