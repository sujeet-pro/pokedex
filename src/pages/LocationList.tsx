import { Suspense, useMemo, useState } from "react";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { locationBundleQuery, locationIndexQuery } from "~/api/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { SpeakButton } from "~/components/SpeakButton";
import { PillFilter } from "~/components/PillFilter";
import type { LocationBundle, LocationIndexBundle } from "~/types/bundles";
import { titleCase } from "~/utils/formatters";
import "~/styles/components/LocationCard.css";

type IndexEntry = LocationIndexBundle["entries"][number];

function LocationGrid() {
  const { data } = useSuspenseQuery(locationIndexQuery());
  const [region, setRegion] = useState("");

  const regionOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of data.entries) if (e.region) s.add(e.region);
    return [...s].sort().map((r) => ({ value: r, label: titleCase(r) }));
  }, [data.entries]);

  const filtered = useMemo(
    () => (region ? data.entries.filter((e) => e.region === region) : data.entries),
    [data.entries, region],
  );

  return (
    <CatalogShell
      title="POKÉ DEX · LOCATIONS"
      subtitleLabel={`${data.total} locations`}
      placeholder="Filter locations…"
      entries={filtered}
      keyOf={(e) => e.name}
      matches={(e, q) => e.name.includes(q) || e.display_name.toLowerCase().includes(q)}
      toolbar={
        <PillFilter label="Region" options={regionOptions} value={region} onChange={setRegion} />
      }
      renderItem={(e) => <LocationRow entry={e} />}
    />
  );
}

function LocationRow({ entry }: { entry: IndexEntry }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  return (
    <div
      id={entry.name}
      className="location-card"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={`location-${entry.name}-body`}
      aria-label={`${entry.display_name} — ${open ? "hide details" : "show details"}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="location-card__head">
        <div>
          <p className="location-card__name">{entry.display_name}</p>
          <div className="location-card__meta">
            <span className="catalog-row__tag">
              {entry.region ? titleCase(entry.region) : "No region"}
            </span>
          </div>
        </div>
        <span aria-hidden="true" className="location-card__chevron">
          ▾
        </span>
      </div>
      {open && (
        <div
          id={`location-${entry.name}-body`}
          className="location-card__body"
          onClick={(e) => e.stopPropagation()}
        >
          <Suspense fallback={<div className="skeleton" style={{ height: "4rem" }} />}>
            <LocationDetails name={entry.name} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function LocationDetails({ name }: { name: string }) {
  const [{ data }] = useSuspenseQueries({
    queries: [locationBundleQuery(name)],
  });
  return <LocationDetailsBody bundle={data} />;
}

function LocationDetailsBody({ bundle }: { bundle: LocationBundle }) {
  return (
    <>
      <ul className="location-card__stats">
        {bundle.region && (
          <li>
            <span className="location-card__label">Region</span>
            <span>{titleCase(bundle.region)}</span>
          </li>
        )}
        {bundle.generation && (
          <li>
            <span className="location-card__label">Generation</span>
            <span>{titleCase(bundle.generation.replace("generation-", ""))}</span>
          </li>
        )}
        <li>
          <span className="location-card__label">Areas</span>
          <span>{bundle.areas.length}</span>
        </li>
      </ul>
      {bundle.areas.length > 0 && (
        <ul className="pill-list" style={{ marginTop: "0.5rem" }}>
          {bundle.areas.map((a) => (
            <li key={a.name}>
              <span className="pill">{titleCase(a.name)}</span>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: "0.6rem" }}>
        <SpeakButton kind="location" name={bundle.name} displayName={bundle.display_name} />
      </div>
    </>
  );
}

export function LocationListPage() {
  return (
    <Suspense
      fallback={
        <ConsoleDevice
          title="POKÉ DEX · LOCATIONS"
          subtitle="loading"
          ariaLabel="Loading locations"
        >
          <div className="skeleton" style={{ height: "20rem" }} />
        </ConsoleDevice>
      }
    >
      <LocationGrid />
    </Suspense>
  );
}
