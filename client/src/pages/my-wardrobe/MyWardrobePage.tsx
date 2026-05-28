import Navbar from "../../components/navbar/Navbar";
import SearchFilterBar, { type WardrobeFilters } from "../../components/search-filter-bar/SearchFilterBar";
import WardrobeSection from "../../components/wardrobe/WardrobeSection";
import "./MyWardrobePage.scss";
import { useEffect, useMemo, useState } from "react";
import UploadPhotoModal from "../../components/upload-modal/UploadModal";
import { fetchProducts, fetchProductMeta, type Product, type ProductMeta } from "../../api/products";
import type { AdvancedFilters } from "../../components/search-filter-bar/FilterModal";

const MyWardrobePage = () => {
  const [openUpload, setOpenUpload] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WardrobeFilters>({
    query: "",
  });
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});

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
        setError(err.message ?? "Failed to load wardrobe");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    const lcQuery = filters.query.trim().toLowerCase();

    products.forEach((p) => {
      if (advancedFilters.category && p.category !== advancedFilters.category) return;
      if (advancedFilters.type && p.type !== advancedFilters.type) return;
      if (advancedFilters.pattern && p.pattern !== advancedFilters.pattern) return;
      if (advancedFilters.fit && p.fit !== advancedFilters.fit) return;
      if (advancedFilters.style && !(p.style ?? []).includes(advancedFilters.style)) return;
      if (lcQuery) {
        const haystack = p.name.toLowerCase();
        if (!haystack.includes(lcQuery)) return;
      }
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return map;
  }, [products, filters, advancedFilters]);

  const handleCreated = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleUpdated = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
  };

  const handleDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="wardrobe-page">
      <Navbar activeTab="wardrobe" />

      <div className="wardrobe-container">
        {meta && (
          <SearchFilterBar
            filters={filters}
            onChange={setFilters}
            meta={meta}
            advancedFilters={advancedFilters}
            onAdvancedChange={setAdvancedFilters}
          />
        )}
        <button className="add-item-btn" onClick={() => setOpenUpload(true)}>
            + Add Item
          </button>
        {loading && <div>Loading wardrobe...</div>}
        {error && <div className="error-text">{error}</div>}
        {!loading &&
          !error &&
          meta &&
          Object.keys(meta.clothingCategories).map((category) => {
            const items = grouped.get(category) ?? [];
            if (items.length === 0) return null;
            return (
              <WardrobeSection
                key={category}
                title={category}
                items={items}
                meta={meta}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            );
          })}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state">No items yet. Add your first piece!</div>
        )}
      </div>


      <UploadPhotoModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onCreated={handleCreated}
        meta={meta}
      />

    </div>
  );
};

export default MyWardrobePage;
