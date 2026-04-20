import { Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { berryIndexQuery } from "~/api/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { PillFilter } from "~/components/PillFilter";
import { TypeCartridge } from "~/components/TypeCartridge";
import { ALL_TYPES, typeInfo } from "~/utils/typeInfo";
import { titleCase } from "~/utils/formatters";

function BerryGrid() {
  const { data } = useSuspenseQuery(berryIndexQuery());
  const [giftType, setGiftType] = useState("");
  const [firmness, setFirmness] = useState("");

  const firmnessOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of data.entries) s.add(e.firmness);
    return [...s].sort().map((v) => ({ value: v, label: titleCase(v) }));
  }, [data.entries]);

  const typeOptions = useMemo(() => {
    const present = new Set<string>();
    for (const e of data.entries) present.add(e.natural_gift_type);
    return ALL_TYPES.filter((t) => present.has(t)).map((t) => ({
      value: t,
      label: typeInfo(t).display,
    }));
  }, [data.entries]);

  const filtered = useMemo(
    () =>
      data.entries.filter(
        (e) =>
          (!giftType || e.natural_gift_type === giftType) &&
          (!firmness || e.firmness === firmness),
      ),
    [data.entries, giftType, firmness],
  );

  return (
    <CatalogShell
      title="POKÉ DEX · BERRIES"
      subtitleLabel={`${data.total} berries`}
      placeholder="Filter berries…"
      entries={filtered}
      keyOf={(e) => e.name}
      matches={(e, q) => e.name.includes(q) || e.display_name.toLowerCase().includes(q)}
      toolbar={
        <>
          <PillFilter
            label="Natural gift type"
            options={typeOptions}
            value={giftType}
            onChange={setGiftType}
          />
          <PillFilter
            label="Firmness"
            options={firmnessOptions}
            value={firmness}
            onChange={setFirmness}
          />
        </>
      }
      layout="rows"
      renderItem={(e) => (
        <Link
          to="/berry/$name"
          params={{ name: e.name }}
          className="catalog-row"
          aria-label={`${e.display_name}, firmness ${e.firmness}, natural gift ${e.natural_gift_type}`}
        >
          <div className="catalog-row__sprite catalog-row__sprite--pixelated">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${e.name}-berry.png`}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="catalog-row__body">
            <div className="catalog-row__id">#{String(e.id).padStart(3, "0")}</div>
            <p className="catalog-row__name">{e.display_name}</p>
            <div className="catalog-row__meta">
              <TypeCartridge name={e.natural_gift_type} size="sm" asLink={false} />
              <span className="catalog-row__tag">{titleCase(e.firmness)}</span>
            </div>
          </div>
        </Link>
      )}
    />
  );
}

export function BerryListPage() {
  return (
    <Suspense
      fallback={
        <ConsoleDevice title="POKÉ DEX · BERRIES" subtitle="loading" ariaLabel="Loading berries">
          <div className="skeleton" style={{ height: "20rem" }} />
        </ConsoleDevice>
      }
    >
      <BerryGrid />
    </Suspense>
  );
}
