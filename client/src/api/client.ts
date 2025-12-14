const DEFAULT_API_URL = "http://localhost:3000";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_URL;

type ApiOptions = RequestInit & {
  /** Set to false to skip JSON parsing (rarely needed). */
  expectJson?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { expectJson = true, headers, body, ...rest } = options;

  const isFormData = body instanceof FormData;
  const finalHeaders = new Headers(headers || {});

  // Only set JSON headers when sending a JSON body
  if (!isFormData && body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const payload =
    body && !isFormData && typeof body !== "string"
      ? JSON.stringify(body)
      : body;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: finalHeaders,
    body: payload,
    ...rest,
  });

  if (!res.ok) {
    const message = await safeReadText(res);
    throw new Error(message || `Request failed with ${res.status}`);
  }

  if (!expectJson || res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}

async function safeReadText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
