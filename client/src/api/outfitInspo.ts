import { apiFetch } from "./client";
import type { Product } from "./products";

export type InspoItem = {
  category: string;
  type: string;
  color: string;
  pattern: string;
  fit: string;
  style: string[];
  notes: string;
};

export type OutfitInspoResult = {
  analysis: {
    outfitSummary: string;
    styleKeywords: string[];
    items: InspoItem[];
  };
  matches: Array<{
    target: InspoItem;
    product?: Product;
    score: number;
    reasons: string[];
  }>;
};

export async function analyzeOutfitInspo(image: File): Promise<OutfitInspoResult> {
  const formData = new FormData();
  formData.append("image", image);

  return apiFetch<OutfitInspoResult>("/api/outfit-inspo/analyze", {
    method: "POST",
    body: formData,
  });
}
