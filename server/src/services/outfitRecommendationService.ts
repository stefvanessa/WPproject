import type { Types } from "mongoose";
import type { IProduct } from "../models/Product";

type ProductDoc = IProduct & {
  _id: Types.ObjectId;
};

export interface OutfitSuggestionOptions {
  temperature?: string;
  style?: string;
  count?: number;
  pinnedProductIds?: string[];
}

export interface OutfitSuggestion {
  score: number;
  reasons: string[];
  top?: ProductDoc;
  bottom?: ProductDoc;
  dress?: ProductDoc;
  outerwear?: ProductDoc;
  shoes?: ProductDoc;
}

const neutrals = new Set([
  "black",
  "white",
  "gray",
  "silver",
  "charcoal",
  "brown",
  "beige",
  "cream",
  "tan",
  "khaki",
  "taupe",
  "navy",
]);

const warmColors = new Set([
  "red",
  "maroon",
  "burgundy",
  "crimson",
  "rose",
  "orange",
  "peach",
  "coral",
  "rust",
  "yellow",
  "mustard",
  "gold",
  "pink",
  "hot_pink",
  "magenta",
  "blush",
]);

const coolColors = new Set([
  "green",
  "olive",
  "mint",
  "lime",
  "forest_green",
  "sage",
  "blue",
  "sky_blue",
  "teal",
  "turquoise",
  "cobalt",
  "purple",
  "lavender",
  "violet",
  "lilac",
]);

const complementaryColors: Record<string, string[]> = {
  red: ["green", "olive", "forest_green", "sage"],
  orange: ["blue", "navy", "cobalt"],
  yellow: ["purple", "violet", "lavender"],
  green: ["red", "burgundy", "rose"],
  blue: ["orange", "rust", "coral"],
  purple: ["yellow", "mustard", "gold"],
  pink: ["green", "olive", "sage"],
};

const dominantPatterns = new Set([
  "animal_print",
  "camouflage",
  "floral",
  "geometric",
  "checked",
  "tie_dye",
  "graphic",
  "abstract",
  "polkadots",
  "striped",
]);

const relaxedFits = new Set(["relaxed", "loose", "oversized", "baggy", "wide_leg"]);
const fittedFits = new Set(["slim", "tight", "skinny", "tapered"]);

const coldWeather = new Set(["cold", "freezing", "snowy", "rainy"]);

const byCategory = (products: ProductDoc[], category: string) =>
  products.filter((product) => product.category === category);

const sharesValue = (left: string[], right: string[]) =>
  left.some((value) => right.includes(value));

const hasTemperature = (product: ProductDoc, temperature?: string) =>
  !temperature || product.temperature.includes(temperature);

const hasStyle = (product: ProductDoc, style?: string) =>
  !style || product.style.includes(style);

const colorFamily = (color: string) => {
  if (neutrals.has(color)) return "neutral";
  if (warmColors.has(color)) return "warm";
  if (coolColors.has(color)) return "cool";
  return "accent";
};

const baseColor = (color: string) => {
  if (color.includes("_")) return color.split("_").pop() ?? color;
  return color;
};

const colorScore = (left: ProductDoc, right: ProductDoc) => {
  const leftColor = left.color;
  const rightColor = right.color;

  if (leftColor === rightColor) {
    return { score: 12, reason: `monochrome ${leftColor} palette` };
  }

  if (neutrals.has(leftColor) || neutrals.has(rightColor)) {
    return { score: 18, reason: "neutral color anchors the outfit" };
  }

  const leftBase = baseColor(leftColor);
  const rightBase = baseColor(rightColor);
  if (complementaryColors[leftBase]?.includes(rightColor) || complementaryColors[rightBase]?.includes(leftColor)) {
    return { score: 16, reason: `${leftColor} and ${rightColor} are complementary colors` };
  }

  if (colorFamily(leftColor) === colorFamily(rightColor)) {
    return { score: 10, reason: `both colors are in the ${colorFamily(leftColor)} family` };
  }

  return { score: 4, reason: `${leftColor} and ${rightColor} add contrast` };
};

const patternScore = (left: ProductDoc, right: ProductDoc) => {
  if (left.pattern === "plain" && right.pattern === "plain") {
    return { score: 14, reason: "plain pieces create a clean base" };
  }

  if (left.pattern === "plain" || right.pattern === "plain") {
    const patterned = left.pattern === "plain" ? right.pattern : left.pattern;
    return { score: 16, reason: `plain piece balances the ${patterned} pattern` };
  }

  if (left.pattern === right.pattern && !dominantPatterns.has(left.pattern)) {
    return { score: 8, reason: `matching ${left.pattern} patterns stay cohesive` };
  }

  return { score: -12, reason: `${left.pattern} and ${right.pattern} patterns may compete` };
};

const styleScore = (left: ProductDoc, right: ProductDoc, requestedStyle?: string) => {
  const commonStyles = left.style.filter((style) => right.style.includes(style));
  let score = commonStyles.length * 8;
  const reasons: string[] = [];

  if (commonStyles.length > 0) {
    reasons.push(`shared ${commonStyles.slice(0, 2).join(", ")} style`);
  }

  if (requestedStyle && left.style.includes(requestedStyle) && right.style.includes(requestedStyle)) {
    score += 10;
    reasons.push(`matches requested ${requestedStyle} style`);
  }

  return { score, reasons };
};

const fitScore = (left: ProductDoc, right: ProductDoc) => {
  if (relaxedFits.has(left.fit) && fittedFits.has(right.fit)) {
    return { score: 10, reason: "relaxed top balances a fitted bottom" };
  }

  if (fittedFits.has(left.fit) && relaxedFits.has(right.fit)) {
    return { score: 10, reason: "fitted top balances a relaxed bottom" };
  }

  if (left.fit === right.fit) {
    return { score: 4, reason: `consistent ${left.fit} fit` };
  }

  return { score: 6, reason: "mixed fits add shape without clashing" };
};

const weatherScore = (items: ProductDoc[], temperature?: string) => {
  if (!temperature) return { score: 0, reasons: [] };

  const missing = items.filter((item) => !item.temperature.includes(temperature));
  if (missing.length > 0) {
    return { score: -30 * missing.length, reasons: [`${missing.length} item(s) do not match ${temperature} weather`] };
  }

  return { score: 16, reasons: [`all pieces match ${temperature} weather`] };
};

const pairScore = (left: ProductDoc, right: ProductDoc, requestedStyle?: string) => {
  const color = colorScore(left, right);
  const pattern = patternScore(left, right);
  const style = styleScore(left, right, requestedStyle);
  const fit = fitScore(left, right);

  return {
    score: color.score + pattern.score + style.score + fit.score,
    reasons: [color.reason, pattern.reason, ...style.reasons, fit.reason],
  };
};

const uniqueByItems = (suggestions: OutfitSuggestion[]) => {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = [
      suggestion.top?._id,
      suggestion.bottom?._id,
      suggestion.dress?._id,
      suggestion.outerwear?._id,
      suggestion.shoes?._id,
    ]
      .filter(Boolean)
      .map(String)
      .join(":");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const suggestionProductIds = (suggestion: OutfitSuggestion) =>
  [
    suggestion.top?._id,
    suggestion.bottom?._id,
    suggestion.dress?._id,
    suggestion.outerwear?._id,
    suggestion.shoes?._id,
  ]
    .filter(Boolean)
    .map(String);

const includesPinnedProducts = (suggestion: OutfitSuggestion, pinnedProductIds?: string[]) => {
  if (!pinnedProductIds || pinnedProductIds.length === 0) return true;

  const suggestionIds = new Set(suggestionProductIds(suggestion));
  return pinnedProductIds.every((id) => suggestionIds.has(id));
};

export const buildOutfitSuggestions = (
  products: ProductDoc[],
  options: OutfitSuggestionOptions = {}
): OutfitSuggestion[] => {
  const count = Math.min(Math.max(options.count ?? 5, 1), 20);
  const wardrobe = products.filter(
    (product) => hasTemperature(product, options.temperature) && hasStyle(product, options.style)
  );

  const tops = byCategory(wardrobe, "tops");
  const bottoms = byCategory(wardrobe, "bottoms");
  const dresses = byCategory(wardrobe, "dresses");
  const outerwear = byCategory(wardrobe, "outerwear");
  const shoes = byCategory(wardrobe, "footwear");
  const suggestions: OutfitSuggestion[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      const pair = pairScore(top, bottom, options.style);
      const shoeChoices = shoes.length > 0 ? shoes : [undefined];

      for (const shoe of shoeChoices) {
        const items = [top, bottom, shoe].filter(Boolean) as ProductDoc[];
        const weather = weatherScore(items, options.temperature);
        let score = pair.score + weather.score;
        const reasons = [...pair.reasons, ...weather.reasons];

        if (shoe) {
          const shoePair = pairScore(bottom, shoe, options.style);
          score += Math.round(shoePair.score / 2);
          reasons.push(...shoePair.reasons.slice(0, 2));
        }

        const needsOuterwear = options.temperature ? coldWeather.has(options.temperature) : false;
        const outerwearChoices = outerwear.length > 0 ? [undefined, ...outerwear] : [undefined];

        for (const coat of outerwearChoices) {
          let finalScore = score;
          const finalReasons = [...reasons];

          if (coat) {
            const coatPair = pairScore(top, coat, options.style);
            finalScore += Math.round(coatPair.score / 2) + (needsOuterwear ? 8 : 2);
            finalReasons.push(
              needsOuterwear ? "outerwear added for colder weather" : "outerwear adds structure",
              ...coatPair.reasons.slice(0, 2)
            );
          }

          suggestions.push({
            score: finalScore,
            reasons: Array.from(new Set(finalReasons)).slice(0, 6),
            top,
            bottom,
            outerwear: coat,
            shoes: shoe,
          });
        }
      }
    }
  }

  for (const dress of dresses) {
    const shoeChoices = shoes.length > 0 ? shoes : [undefined];

    for (const shoe of shoeChoices) {
      const items = [dress, shoe].filter(Boolean) as ProductDoc[];
      const weather = weatherScore(items, options.temperature);
      let score = 30 + weather.score;
      const reasons = ["dress creates a complete base", ...weather.reasons];

      if (shoe) {
        const shoePair = pairScore(dress, shoe, options.style);
        score += Math.round(shoePair.score / 2);
        reasons.push(...shoePair.reasons.slice(0, 3));
      }

      const needsOuterwear = options.temperature ? coldWeather.has(options.temperature) : false;
      const outerwearChoices = outerwear.length > 0 ? [undefined, ...outerwear] : [undefined];

      for (const coat of outerwearChoices) {
        let finalScore = score;
        const finalReasons = [...reasons];

        if (coat) {
          const coatPair = pairScore(dress, coat, options.style);
          const dressBlazerBonus = dress.type === "dress" && coat.type === "blazer" ? 12 : 0;
          finalScore += Math.round(coatPair.score / 2) + (needsOuterwear ? 8 : 4) + dressBlazerBonus;
          finalReasons.push(
            needsOuterwear ? "outerwear added for colder weather" : "outerwear adds structure",
            ...coatPair.reasons.slice(0, 2)
          );

          if (dressBlazerBonus > 0) {
            finalReasons.push("blazer sharpens a simple dress");
          }
        }

        suggestions.push({
          score: finalScore,
          reasons: Array.from(new Set(finalReasons)).slice(0, 6),
          dress,
          outerwear: coat,
          shoes: shoe,
        });
      }
    }
  }

  return uniqueByItems(suggestions)
    .filter((suggestion) => includesPinnedProducts(suggestion, options.pinnedProductIds))
    .sort((left, right) => right.score - left.score)
    .slice(0, count);
};
