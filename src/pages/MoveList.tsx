import { Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { moveIndexQuery } from "~/api/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { PillFilter } from "~/components/PillFilter";
import { TypeCartridge } from "~/components/TypeCartridge";
import { ALL_TYPES, typeInfo } from "~/utils/typeInfo";
import { titleCase } from "~/utils/formatters";

const DAMAGE_CLASSES = [
  { value: "physical", label: "Physical" },
  { value: "special", label: "Special" },
  { value: "status", label: "Status" },
];

function MoveGrid() {
  const { data } = useSuspenseQuery(moveIndexQuery());
  const [type, setType] = useState("");
  const [damageClass, setDamageClass] = useState("");

  const typeOptions = useMemo(() => {
    const present = new Set<string>();
    for (const e of data.entries) present.add(e.type);
    return ALL_TYPES.filter((t) => present.has(t)).map((t) => ({
      value: t,
      label: typeInfo(t).display,
    }));
  }, [data.entries]);

  const filtered = useMemo(
    () =>
      data.entries.filter(
        (e) => (!type || e.type === type) && (!damageClass || e.damage_class === damageClass),
      ),
    [data.entries, type, damageClass],
  );

  return (
    <CatalogShell
      title="POKÉ DEX · MOVES"
      subtitleLabel={`${data.total} moves`}
      placeholder="Filter moves…"
      entries={filtered}
      keyOf={(e) => e.name}
      matches={(e, q) => e.name.includes(q) || e.display_name.toLowerCase().includes(q)}
      toolbar={
        <>
          <PillFilter label="Type" options={typeOptions} value={type} onChange={setType} />
          <PillFilter
            label="Damage class"
            options={DAMAGE_CLASSES}
            value={damageClass}
            onChange={setDamageClass}
          />
        </>
      }
      renderItem={(e) => (
        <Link
          to="/move/$name"
          params={{ name: e.name }}
          className="pokemon-card"
          aria-label={`${e.display_name} — ${titleCase(e.type)} ${titleCase(e.damage_class)}`}
          style={{ padding: "1rem" }}
        >
          <div className="pokemon-card__name" style={{ fontSize: "0.95rem" }}>
            {e.display_name}
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginTop: "0.4rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <TypeCartridge name={e.type} size="sm" asLink={false} />
            <span
              style={{
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                color: "var(--phosphor-dim)",
                textTransform: "uppercase",
              }}
            >
              {titleCase(e.damage_class)}
            </span>
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.75rem",
              color: "var(--phosphor-dim)",
            }}
            className="mono"
          >
            PWR {e.power ?? "—"} · ACC {e.accuracy ?? "—"}
          </div>
        </Link>
      )}
    />
  );
}

export function MoveListPage() {
  return (
    <Suspense
      fallback={
        <ConsoleDevice title="POKÉ DEX · MOVES" subtitle="loading" ariaLabel="Loading moves">
          <div className="skeleton" style={{ height: "20rem" }} />
        </ConsoleDevice>
      }
    >
      <MoveGrid />
    </Suspense>
  );
}
