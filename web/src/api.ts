let cachedCsrfToken: string | null = null;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; needsCsrf?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, needsCsrf = false } = options;

  if (needsCsrf && !cachedCsrfToken) {
    await fetchCsrfToken();
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (needsCsrf && cachedCsrfToken) headers["X-CSRF-Token"] = cachedCsrfToken;

  const res = await fetch(path, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Error ${res.status}`, res.status, data);
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function fetchCsrfToken(): Promise<string> {
  const data = await request<{ csrfToken: string }>("/api/auth/csrf");
  cachedCsrfToken = data.csrfToken;
  return data.csrfToken;
}

export function setCsrfToken(token: string) {
  cachedCsrfToken = token;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, needsCsrf = true) =>
    request<T>(path, { method: "POST", body, needsCsrf }),
  put: <T>(path: string, body?: unknown, needsCsrf = true) =>
    request<T>(path, { method: "PUT", body, needsCsrf }),
  patch: <T>(path: string, body?: unknown, needsCsrf = true) =>
    request<T>(path, { method: "PATCH", body, needsCsrf }),
  async upload(path: string, file: File): Promise<{ url: string }> {
    if (!cachedCsrfToken) await fetchCsrfToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: cachedCsrfToken ? { "X-CSRF-Token": cachedCsrfToken } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data?.error || "Error al subir archivo", res.status, data);
    return data;
  },
};
