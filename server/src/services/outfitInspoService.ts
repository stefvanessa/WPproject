import type { Types } from "mongoose";
import type { IProduct } from "../models/Product";

type ProductDoc = IProduct & {
  _id: Types.ObjectId;
};

export interface InspoItem {
  category: string;
  type: string;
  color: string;
  pattern: string;
  fit: string;
  style: string[];
  notes: string;
  closestWardrobeProductId?: string;
}

export interface InspoAnalysis {
  outfitSummary: string;
  styleKeywords: string[];
  items: InspoItem[];
}

export interface InspoMatch {
  target: InspoItem;
  product?: ProductDoc;
  score: number;
  reasons: string[];
}

const categoryAliases: Record<string, string> = {
  top: "tops",
  tops: "tops",
  shirt: "tops",
  blouse: "tops",
  sweater: "tops",
  bottom: "bottoms",
  bottoms: "bottoms",
  pants: "bottoms",
  jeans: "bottoms",
  skirt: "bottoms",
  dress: "dresses",
  dresses: "dresses",
  outerwear: "outerwear",
  jacket: "outerwear",
  blazer: "outerwear",
  coat: "outerwear",
  shoes: "footwear",
  footwear: "footwear",
};

const neutralColors = new Set(["black", "white", "gray", "charcoal", "brown", "beige", "cream", "tan", "khaki", "taupe", "navy"]);
const warmColors = new Set(["red", "maroon", "burgundy", "crimson", "rose", "orange", "peach", "coral", "rust", "yellow", "mustard", "gold", "pink", "hot_pink", "magenta", "blush"]);
const coolColors = new Set(["green", "olive", "mint", "lime", "forest_green", "sage", "blue", "sky_blue", "teal", "turquoise", "cobalt", "purple", "lavender", "violet", "lilac"]);

const normalize = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "_");

const normalizeCategory = (category: string) => {
  const key = normalize(category);
  return categoryAliases[key] ?? key;
};

const isPresentTarget = (target: InspoItem) => {
  const values = [target.category, target.type, target.color, target.pattern, target.fit].map(normalize);
  return !values.some((value) => ["none", "no", "not_visible", "missing", "unknown_item"].includes(value));
};

const colorFamily = (color: string) => {
  if (neutralColors.has(color)) return "neutral";
  if (warmColors.has(color)) return "warm";
  if (coolColors.has(color)) return "cool";
  return "other";
};

const scoreProductForTarget = (product: ProductDoc, target: InspoItem) => {
  let score = 0;
  const reasons: string[] = [];

  if (product.category === normalizeCategory(target.category)) {
    score += 35;
    reasons.push("same clothing category");
  } else {
    score -= 25;
  }

  if (product.type === normalize(target.type)) {
    score += 24;
    reasons.push("same item type");
  }

  const targetColor = normalize(target.color);
  if (product.color === targetColor) {
    score += 24;
    reasons.push(`same ${product.color} color`);
  } else if (colorFamily(product.color) === colorFamily(targetColor)) {
    score += 10;
    reasons.push(`similar ${colorFamily(product.color)} color family`);
  } else if (neutralColors.has(product.color) || neutralColors.has(targetColor)) {
    score += 6;
    reasons.push("neutral color can substitute");
  }

  if (product.pattern === normalize(target.pattern)) {
    score += 16;
    reasons.push(`matching ${product.pattern} pattern`);
  } else if (product.pattern === "plain" || normalize(target.pattern) === "plain") {
    score += 6;
    reasons.push("plain pattern is easy to substitute");
  }

  if (product.fit === normalize(target.fit)) {
    score += 10;
    reasons.push(`similar ${product.fit} fit`);
  }

  const targetStyles = target.style.map(normalize);
  const productStyles = product.style.map((style) => String(style));
  const sharedStyles = productStyles.filter((style) => targetStyles.includes(style));
  if (sharedStyles.length > 0) {
    score += sharedStyles.length * 8;
    reasons.push(`shared ${sharedStyles.slice(0, 2).join(", ")} style`);
  }

  return { score, reasons };
};

export const matchInspoToWardrobe = (analysis: InspoAnalysis, products: ProductDoc[]) => {
  const usedProductIds = new Set<string>();

  return analysis.items.filter(isPresentTarget).map((target) => {
    const aiSelectedProduct = target.closestWardrobeProductId
      ? products.find((product) => String(product._id) === target.closestWardrobeProductId)
      : undefined;

    if (aiSelectedProduct && !usedProductIds.has(String(aiSelectedProduct._id))) {
      const selectedScore = scoreProductForTarget(aiSelectedProduct, target);
      if (selectedScore.score >= 20) {
        usedProductIds.add(String(aiSelectedProduct._id));
        return {
          target,
          product: aiSelectedProduct,
          score: selectedScore.score + 8,
          reasons: ["AI selected this wardrobe item", ...selectedScore.reasons.slice(0, 3)],
        };
      }
    }

    const candidates = products
      .filter((product) => !usedProductIds.has(String(product._id)))
      .map((product) => ({
        product,
        ...scoreProductForTarget(product, target),
      }))
      .sort((left, right) => right.score - left.score);

    const best = candidates[0];
    if (!best || best.score < 20) {
      return {
        target,
        score: best?.score ?? 0,
        reasons: ["no close wardrobe match found"],
      };
    }

    usedProductIds.add(String(best.product._id));
    return {
      target,
      product: best.product,
      score: best.score,
      reasons: best.reasons.slice(0, 4),
    };
  });
};

const parseAnalysisResponse = (data: any): InspoAnalysis => {
  const text =
    data.output_text ??
    data.output?.flatMap((item: any) => item.content ?? [])
      ?.find((content: any) => content.type === "output_text")?.text;

  if (!text) {
    throw new Error("AI response did not include outfit analysis text");
  }

  return JSON.parse(text) as InspoAnalysis;
};

const wardrobePrompt = (products?: ProductDoc[]) => {
  if (!products || products.length === 0) return "";

  const wardrobe = products.map((product) => ({
    id: String(product._id),
    name: product.name,
    category: product.category,
    type: product.type,
    color: product.color,
    pattern: product.pattern,
    fit: product.fit,
    style: product.style.map((style) => String(style)),
  }));

  return `Available wardrobe items, choose closestWardrobeProductId from this list when there is a similar piece: ${JSON.stringify(wardrobe)}.`;
};

const buildAnalysisPrompt = (products?: ProductDoc[]) =>
  [
    "Analyze this outfit inspiration image item by item.",
    "Return only valid JSON, no markdown.",
    "Return one item for each visible clothing piece on the person's outfit: top, bottom, dress, outerwear, and footwear only when actually visible.",
    "Do not return categories or pieces that are absent, hidden, not worn, or only implied.",
    "Never return none, no, missing, not_visible, or unknown as an item.",
    "Ignore handbags, phones, rooms, hair, body, jewelry, and background.",
    "Use these app categories when possible: tops, bottoms, dresses, outerwear, footwear.",
    "Use concise lowercase values with underscores.",
    "For each visible clothing item, compare it to the available wardrobe list and set closestWardrobeProductId to the most similar wardrobe item id. If no similar wardrobe item exists, use an empty string.",
    wardrobePrompt(products),
    "JSON shape:",
    '{ "outfitSummary": "string", "styleKeywords": ["string"], "items": [{ "category": "string", "type": "string", "color": "string", "pattern": "string", "fit": "string", "style": ["string"], "notes": "string", "closestWardrobeProductId": "string" }] }',
  ].join(" ");

const analyzeWithOllama = async (file: Express.Multer.File, products?: ProductDoc[]): Promise<InspoAnalysis> => {
  const model = process.env.OLLAMA_VISION_MODEL ?? "llava:latest";
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const imageBase64 = file.buffer.toString("base64");

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: buildAnalysisPrompt(products),
      images: [imageBase64],
      format: "json",
      stream: false,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Ollama request failed with ${response.status}`);
  }

  const data = await response.json();
  if (!data.response) {
    throw new Error("Ollama response did not include outfit analysis text");
  }

  return JSON.parse(data.response) as InspoAnalysis;
};

const analyzeWithOpenAI = async (file: Express.Multer.File, products?: ProductDoc[]): Promise<InspoAnalysis> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini";
  const imageBase64 = file.buffer.toString("base64");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildAnalysisPrompt(products),
            },
            {
              type: "input_image",
              image_url: `data:${file.mimetype};base64,${imageBase64}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "outfit_inspo_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              outfitSummary: { type: "string" },
              styleKeywords: {
                type: "array",
                items: { type: "string" },
              },
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    category: { type: "string" },
                    type: { type: "string" },
                    color: { type: "string" },
                    pattern: { type: "string" },
                    fit: { type: "string" },
                    style: {
                      type: "array",
                      items: { type: "string" },
                    },
                    notes: { type: "string" },
                    closestWardrobeProductId: { type: "string" },
                  },
                  required: ["category", "type", "color", "pattern", "fit", "style", "notes", "closestWardrobeProductId"],
                },
              },
            },
            required: ["outfitSummary", "styleKeywords", "items"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `OpenAI request failed with ${response.status}`);
  }

  return parseAnalysisResponse(await response.json());
};

export const analyzeInspoImage = async (file: Express.Multer.File, products?: ProductDoc[]): Promise<InspoAnalysis> => {
  const provider = process.env.OUTFIT_INSPO_PROVIDER ?? "openai";

  if (provider === "ollama") {
    return analyzeWithOllama(file, products);
  }

  return analyzeWithOpenAI(file, products);
};
