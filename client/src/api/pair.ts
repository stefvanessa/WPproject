import { apiFetch } from "./client";

export interface PairCode {
  code: string;
  expiresAt: string;
}

export async function generatePairCode(): Promise<PairCode> {
  return apiFetch<PairCode>("/api/pair/generate", { method: "POST" });
}
