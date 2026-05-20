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

export interface ProductMeta {
  clothingCategories: Record<string, string[]>;
  clothingColors: string[];
  clothingPatterns: string[];
  clothingFits: string[];
  clothingStyles: string[];
  clothingWeather: string[];
}

export function fetchProducts(token: string): Promise<Product[]> {
  return request<Product[]>("/api/products", token);
}

export function fetchMeta(token: string): Promise<ProductMeta> {
  return request<ProductMeta>("/api/products/meta/options", token);
}

export async function createProduct(
  token: string,
  photoUri: string,
  data: {
    name: string;
    category: string;
    type: string;
    color: string;
    pattern: string;
    fit: string;
    style: string[];
    temperature: string[];
  }
): Promise<Product> {
  const form = new FormData();
  // React Native FormData accepts { uri, type, name } objects for files
  form.append("image", { uri: photoUri, type: "image/jpeg", name: "photo.jpg" } as any);
  form.append("name", data.name);
  form.append("category", data.category);
  form.append("type", data.type);
  form.append("color", data.color);
  form.append("pattern", data.pattern);
  form.append("fit", data.fit);
  data.style.forEach((s) => form.append("style", s));
  data.temperature.forEach((t) => form.append("temperature", t));

  const res = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    // No Content-Type — fetch sets multipart boundary automatically
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed: ${res.status}`);
  }
  return res.json();
}
