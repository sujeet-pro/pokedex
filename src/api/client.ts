const BASE = "https://pokeapi.co/api/v2";

export class ApiError extends Error {
  status: number;
  path: string;
  constructor(status: number, path: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new ApiError(res.status, path, `Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: request,
};

export function extractIdFromUrl(url: string): number | null {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}
