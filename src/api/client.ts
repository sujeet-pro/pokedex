// All data the site reads at runtime comes from pre-built bundles under
// `<BASE_URL>/bundles/...json`. The bundles are generated at build time by
// `scripts/build-bundles.ts` from the committed `data/` mirror — no PokéAPI
// calls happen in the browser.

const BUNDLES_BASE = `${import.meta.env.BASE_URL}bundles`;

export class BundleError extends Error {
  status: number;
  path: string;
  constructor(status: number, path: string, message: string) {
    super(message);
    this.name = "BundleError";
    this.status = status;
    this.path = path;
  }
}

async function load<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${BUNDLES_BASE}${path}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new BundleError(res.status, path, `Bundle fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const bundles = {
  get: load,
};

export async function loadText(path: string, signal?: AbortSignal): Promise<string> {
  const url = `${BUNDLES_BASE}${path}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new BundleError(res.status, path, `Text fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}
