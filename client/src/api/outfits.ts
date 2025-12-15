import { apiFetch } from './client';

export type OutfitPayload = {
  name?: string;
  top?: string;
  bottom?: string;
  dress?: string;
  outerwear?: string;
  shoes?: string;
};

export async function saveOutfit(payload: OutfitPayload) {
  return apiFetch('/api/outfits', {
    method: 'POST',
    // apiFetch will set JSON headers and stringify non-FormData bodies
    body: payload as unknown as BodyInit,
  });
}

export async function fetchOutfits() {
  return apiFetch('/api/outfits');
}

export async function deleteOutfit(id: string) {
  return apiFetch(`/api/outfits/${id}`, { method: 'DELETE', expectJson: false });
}
