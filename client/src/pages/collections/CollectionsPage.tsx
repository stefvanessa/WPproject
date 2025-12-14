import "./CollectionsPage.scss";
import Navbar from "../../components/navbar/Navbar";
import WardrobeSection from "../../components/wardrobe/WardrobeSection";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchProductMeta, type Product, type ProductMeta } from "../../api/products";

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchProducts(), fetchProductMeta()])
      .then(([items, metaData]) => {
        if (!mounted) return;
        setProducts(items);
        setMeta(metaData);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message ?? "Failed to load collections");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return map;
  }, [products]);

  return (
    <div className="collections-page">
      <Navbar activeTab="collections" />
      <div className="collections-container">
        <div className="header">
          <h2>My Collections</h2>
        
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="error-text">{error}</div>}

        {!loading && !error && meta && (
          <>
            {Object.keys(meta.clothingCategories).map((category) => {
              const items = grouped.get(category) ?? [];
              if (items.length === 0) return null;
              return (
                <WardrobeSection
                  key={category}
                title={category}
                items={items}
                meta={meta}
                onUpdated={(updated) =>
                  setProducts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)))
                }
                onDeleted={(id) =>
                  setProducts((prev) => prev.filter((p) => p._id !== id))
                }
              />
            );
          })}
            {products.length === 0 && <div className="empty-state">No items yet.</div>}
          </>
        )}
      </div>
    </div>
  );
}
