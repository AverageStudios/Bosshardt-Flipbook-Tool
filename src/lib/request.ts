/**
 * Small fetch wrapper for the dashboard's own API routes. Browser-side only:
 * it never touches Supabase directly, so no keys are involved — every
 * privileged read/write happens server-side in /api/*.
 */
export async function apiRequest<T = unknown>(
  url: string,
  init: RequestInit,
  fallback: string,
): Promise<T | null> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? fallback);
  }
  if (response.status === 204) return null;
  return (await response.json().catch(() => null)) as T | null;
}

const json = (method: string, payload: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const postJson = <T>(url: string, payload: unknown, fallback: string) =>
  apiRequest<T>(url, json("POST", payload), fallback);

export const patchJson = <T>(url: string, payload: unknown, fallback: string) =>
  apiRequest<T>(url, json("PATCH", payload), fallback);

export const del = (url: string, fallback: string) =>
  apiRequest(url, { method: "DELETE" }, fallback);
