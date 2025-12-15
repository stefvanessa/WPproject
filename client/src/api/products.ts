import { apiFetch } from "./client";

export interface Product {
  _id: string;
  name: string;
  category: string;
  type: string;
  color: string;
  pattern: string;
  style: string[];
  temperature: string[];
  fit: string;
  imageKey: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products");
}

export async function createProduct(formData: FormData): Promise<Product> {
  return apiFetch<Product>("/api/products", {
    method: "POST",
    body: formData,
  });
}

export interface ProductMeta {
  clothingCategories: Record<string, string[]>;
  clothingPatterns: string[];
  clothingWeather: string[];
  clothingColors: string[];
  clothingStyles: string[];
  clothingFits: string[];
}

export async function fetchProductMeta(): Promise<ProductMeta> {
  return apiFetch<ProductMeta>("/api/products/meta/options");
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "_id" | "imageKey" | "imageUrl">>
): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/products/${id}`, { method: "DELETE", expectJson: false });
}
