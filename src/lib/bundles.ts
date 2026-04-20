import type { Locale } from "~/types/locales";

export class BundleError extends Error {
  status: number;
  url: string;
  constructor(status: number, url: string) {
    super(`Bundle fetch failed (${status}): ${url}`);
    this.name = "BundleError";
    this.status = status;
    this.url = url;
  }
}

function baseUrl(): string {
  return (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
}

async function readFromDisk<T>(relUrl: string): Promise<T> {
  // Server-only path: dynamic imports + `process` are absent from client bundles via SSR guard.
  const fs = (await import(/* @vite-ignore */ "node:fs/promises")) as typeof import("node:fs/promises");
  const path = (await import(/* @vite-ignore */ "node:path")) as typeof import("node:path");
  const cwd = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
  const filepath = path.join(cwd, "public", relUrl);
  try {
    const raw = await fs.readFile(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const e = err as { code?: string };
    if (e?.code === "ENOENT") throw new BundleError(404, filepath);
    throw err;
  }
}

export async function fetchBundle<T>(
  resource: string,
  lang: Locale,
  slug: string,
  signal?: AbortSignal,
): Promise<T> {
  const relUrl = `ui-data/v1/${resource}/${lang}/${slug}.json`;
  if (import.meta.env.SSR) {
    return readFromDisk<T>(relUrl);
  }
  const url = `${baseUrl()}${relUrl}`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new BundleError(res.status, url);
  return (await res.json()) as T;
}

export async function fetchIndex<T>(resource: string, lang: Locale, signal?: AbortSignal): Promise<T> {
  return fetchBundle<T>(resource, lang, "_index", signal);
}
