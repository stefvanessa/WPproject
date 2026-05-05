import { apiFetch } from './client';
import type { Product } from './products';

export type OutfitPayload = {
  name?: string;
  top?: string;
  bottom?: string;
  dress?: string;
  outerwear?: string;
  shoes?: string;
};

export type OutfitSuggestion = {
  score: number;
  reasons: string[];
  top?: Product;
  bottom?: Product;
  dress?: Product;
  outerwear?: Product;
  shoes?: Product;
};

export type OutfitSuggestionPayload = {
  temperature?: string;
  style?: string;
  count?: number;
};

export async function saveOutfit(payload: OutfitPayload) {
  return apiFetch('/api/outfits', {
    method: 'POST',
    // apiFetch will set JSON headers and stringify non-FormData bodies
    body: payload as unknown as BodyInit,
  });
}

export async function fetchOutfits() {
  return apiFetch<any[]>('/api/outfits');
}

export async function generateOutfitSuggestion(payload: OutfitSuggestionPayload = {}) {
  return apiFetch<{
    filters: { temperature?: string; style?: string };
    count: number;
    suggestions: OutfitSuggestion[];
  }>('/api/outfits/suggestions', {
    method: 'POST',
    body: payload as unknown as BodyInit,
  });
}

export async function deleteOutfit(id: string) {
  return apiFetch(`/api/outfits/${id}`, { method: 'DELETE', expectJson: false });
}
