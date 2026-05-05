import { API_URL } from "./config";

async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface ConnectResponse {
  token: string;
  user: MobileUser;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  type: string;
  color: string;
  imageUrl?: string;
}

export function connectWithCode(code: string): Promise<ConnectResponse> {
  return request<ConnectResponse>("/api/pair/connect", null, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function fetchProducts(token: string): Promise<Product[]> {
  return request<Product[]>("/api/products", token);
}
