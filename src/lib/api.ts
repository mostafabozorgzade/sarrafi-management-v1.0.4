"use client";

async function fetchAPI(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "خطا");
  }
  return res.json();
}

export const api = {
  get: (url: string) => fetchAPI(url),
  post: (url: string, body: unknown) => fetchAPI(url, { method: "POST", body: JSON.stringify(body) }),
  put: (url: string, body: unknown) => fetchAPI(url, { method: "PUT", body: JSON.stringify(body) }),
  patch: (url: string, body: unknown) => fetchAPI(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (url: string) => fetchAPI(url, { method: "DELETE" }),
};
