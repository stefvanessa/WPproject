import "./GenerateOutfitPage.scss";
import Navbar from "../../components/navbar/Navbar";
import ClothingCard from "../../components/clothing-card/ClothingCard";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "../../api/products";
import { generateOutfitSuggestion, saveOutfit } from "../../api/outfits";

type CategoryKey = "tops" | "bottoms" | "outerwear" | "dresses" | "footwear";
const categoryKeys: CategoryKey[] = ["tops", "bottoms", "outerwear", "dresses", "footwear"];

function nextItem(list: Product[], currentId?: string | null) {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  const others = currentId ? list.filter((p) => p._id !== currentId) : list;
  if (others.length === 0) return list[0];
  const idx = Math.floor(Math.random() * others.length);
  return others[idx];
}

export default function GenerateOutfitPage() {
  const [twoPiece, setTwoPiece] = useState(true);
  const [animClass, setAnimClass] = useState("fade-enter-active");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [outfitReasons, setOutfitReasons] = useState<string[]>([]);

  const [top, setTop] = useState<Product | null>(null);
  const [bottom, setBottom] = useState<Product | null>(null);
  const [dress, setDress] = useState<Product | null>(null);
  const [outerwear, setOuterwear] = useState<Product | null>(null);
  const [shoes, setShoes] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchProducts()
      .then((items) => {
        if (!mounted) return;
        setProducts(items);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message ?? "Failed to load wardrobe");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<CategoryKey, Product[]>();
    categoryKeys.forEach((key) => map.set(key, []));
    products.forEach((p) => {
      const key = p.category as CategoryKey;
      if (map.has(key)) {
        map.get(key)!.push(p);
      }
    });
    return map;
  }, [products]);

  useEffect(() => {
    const tops = byCategory.get("tops") ?? [];
    const bottoms = byCategory.get("bottoms") ?? [];
    const dresses = byCategory.get("dresses") ?? [];
    const jackets = byCategory.get("outerwear") ?? [];
    const footwear = byCategory.get("footwear") ?? [];

    setTop((prev) => prev ?? (tops[0] ?? null));
    setBottom((prev) => prev ?? (bottoms[0] ?? null));
    setDress((prev) => prev ?? (dresses[0] ?? null));
    setOuterwear((prev) => prev ?? (jackets[0] ?? null));
    setShoes((prev) => prev ?? (footwear[0] ?? null));
  }, [byCategory]);

  const toggle = () => {
    if (!twoPiece) {
      setAnimClass("split-start");
      setTimeout(() => {
        setTwoPiece(true);
        setAnimClass("split-left-right");
      }, 300);
    } else {
      setAnimClass("merge-center");
      setTimeout(() => {
        setTwoPiece(false);
        setAnimClass("merge-final");
      }, 300);
    }
  };

  const shuffleTop = () => {
    const tops = byCategory.get("tops") ?? [];
    setTop(nextItem(tops, top?._id));
  };
  const shuffleBottom = () => {
    const bottoms = byCategory.get("bottoms") ?? [];
    setBottom(nextItem(bottoms, bottom?._id));
  };
  const shuffleDress = () => {
    const dresses = byCategory.get("dresses") ?? [];
    setDress(nextItem(dresses, dress?._id));
  };
  const shuffleOuterwear = () => {
    const jackets = byCategory.get("outerwear") ?? [];
    setOuterwear(nextItem(jackets, outerwear?._id));
  };
  const shuffleShoes = () => {
    const footwear = byCategory.get("footwear") ?? [];
    setShoes(nextItem(footwear, shoes?._id));
  };

  const showSnackbar = (message: string) => {
    setSnackbar(message);
    setTimeout(() => setSnackbar(null), 2500);
  };

  const generateOutfit = async () => {
    try {
      setGenerating(true);
      setError(null);

      const data = await generateOutfitSuggestion({ count: 10 });
      if (data.suggestions.length === 0) {
        showSnackbar("Add more wardrobe items first");
        return;
      }

      const suggestion = data.suggestions[Math.floor(Math.random() * data.suggestions.length)];

      setTwoPiece(!suggestion.dress);
      setTop(suggestion.top ?? null);
      setBottom(suggestion.bottom ?? null);
      setDress(suggestion.dress ?? null);
      setOuterwear(suggestion.outerwear ?? null);
      setShoes(suggestion.shoes ?? null);
      setOutfitReasons(suggestion.reasons ?? []);
      showSnackbar("Outfit generated");
    } catch (err: any) {
      showSnackbar(err.message ?? "Failed generating outfit");
    } finally {
      setGenerating(false);
    }
  };

  const saveCurrentOutfit = async () => {
    try {
      const payload: any = { name: '' };

      // Use UI mode to decide: if twoPiece UI is active, save top+bottom; if not, save dress
      if (twoPiece) {
        // Require both top and bottom
        if (!(top && bottom)) {
          setSnackbar('Select both top and bottom before saving');
          setTimeout(() => setSnackbar(null), 2500);
          return;
        }
        payload.top = top!._id;
        payload.bottom = bottom!._id;
      } else {
        // Require a dress when in single-piece mode
        if (!dress) {
          setSnackbar('Select a dress before saving');
          setTimeout(() => setSnackbar(null), 2500);
          return;
        }
        payload.dress = dress._id;
      }

      if (outerwear) payload.outerwear = outerwear._id;
      if (shoes) payload.shoes = shoes._id;

      await saveOutfit(payload);
      setSnackbar('Outfit saved');
      setTimeout(() => setSnackbar(null), 2500);
    } catch (err: any) {
      setSnackbar('Failed saving outfit');
      setTimeout(() => setSnackbar(null), 2500);
    }
  };

  return (
    <div className="home-page">
      <Navbar activeTab="generate" />

      <div className="layout">
        <div className="piece-sidebar" onClick={toggle}>
          <span className="sidebar-text">
            {twoPiece ? "ONE PIECE" : "TWO PIECE"}
          </span>
        </div>

        <div className="left-column">
          {loading && <div>Loading your wardrobe...</div>}
          {error && <div className="error-text">{error}</div>}

          {!loading && !error && (
            <div className="transitionWrapper">
              {!twoPiece && (
                <div
                  className={`card ${animClass === "split-start" ? "split-start" : ""
                    } ${animClass === "merge-final" ? "merge-final" : ""}`}
                >
                  <ClothingCard
                    label={dress?.name ?? "DRESS"}
                    image={dress?.imageUrl}
                    tall={true}
                    onShuffle={shuffleDress}
                    onNext={shuffleDress}
                    onPrev={shuffleDress}
                    onAdd={shuffleDress}
                  />
                </div>
              )}

              {twoPiece && (
                <div className="twoPieceGroup">
                  <div
                    className={`card ${animClass === "split-left" ? "split-left" : ""
                      } ${animClass === "merge-center" ? "merge-center" : ""}`}
                  >
                    <ClothingCard
                      label={top?.name ?? "TOP"}
                      image={top?.imageUrl}
                      onShuffle={shuffleTop}
                      onNext={shuffleTop}
                      onPrev={shuffleTop}
                      onAdd={shuffleTop}
                    />
                  </div>

                  <div
                    className={`card ${animClass === "split-left-right" ? "split-right" : ""
                      } ${animClass === "merge-center" ? "merge-center" : ""}`}
                  >
                    <ClothingCard
                      label={bottom?.name ?? "BOTTOM"}
                      image={bottom?.imageUrl}
                      onShuffle={shuffleBottom}
                      onNext={shuffleBottom}
                      onPrev={shuffleBottom}
                      onAdd={shuffleBottom}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="right-column">
          <ClothingCard
            label={outerwear?.name ?? "OUTERWEAR"}
            image={outerwear?.imageUrl}
            onAdd={shuffleOuterwear}
            onNext={shuffleOuterwear}
            onPrev={shuffleOuterwear}
            onRemove={() => setOuterwear(null)}
            onShuffle={shuffleOuterwear}
          />

          <ClothingCard
            label={shoes?.name ?? "SHOES"}
            image={shoes?.imageUrl}
            onAdd={shuffleShoes}
            onNext={shuffleShoes}
            onPrev={shuffleShoes}
            onRemove={() => setShoes(null)}
            onShuffle={shuffleShoes}
          />
        </div>

        <div className="save-outfit-wrap">
          <button className="generate-outfit-btn" onClick={generateOutfit} disabled={generating || loading}>
            {generating ? "Generating..." : "Generate outfit"}
          </button>
          <button className="save-outfit-btn" onClick={saveCurrentOutfit}>Save outfit</button>
        </div>

        {outfitReasons.length > 0 && (
          <div className="outfit-reasons">
            {outfitReasons.slice(0, 3).map((reason) => (
              <span key={reason}>{reason}</span>
            ))}
          </div>
        )}

        {snackbar && (
          <div className="snackbar">{snackbar}</div>
        )}
      </div>
    </div>
  );
}
