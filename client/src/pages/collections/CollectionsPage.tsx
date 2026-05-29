import "./CollectionsPage.scss";
import Navbar from "../../components/navbar/Navbar";
import OutfitCard from "../../components/outfit/OutfitCard";
import CreateOutfitModal from "../../components/outfit/CreateOutfitModal";
import { useEffect, useMemo, useState } from "react";
import { fetchOutfits, type Outfit } from "../../api/outfits";
import { FiChevronDown, FiPlus, FiSearch } from "react-icons/fi";

export default function CollectionsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const visibleOutfits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return outfits;
    return outfits.filter((o) => (o.name ?? "").toLowerCase().includes(q));
  }, [outfits, query]);

  useEffect(() => {
    let mounted = true;
    fetchOutfits()
      .then((data) => {
        if (!mounted) return;
        setOutfits(data);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load outfits");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="collections-page">
      <Navbar activeTab="collections" />
      <div className="collections-container">
        <div className="header">
          <h2>My Collections</h2>
          <button className="create-outfit-btn" onClick={() => setCreateOpen(true)}>
            <FiPlus size={16} />
            Create Outfit
          </button>
        </div>

        <div className="collections-search">
          <FiSearch className="collections-search-icon" size={15} />
          <input
            placeholder="Search outfits…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="error-text">{error}</div>}

        {!loading && !error && (
          <>
            {visibleOutfits.length > 0 ? (
              <div className="outfits-section">
                <button
                  className={`outfits-section-header${collapsed ? " collapsed" : ""}`}
                  onClick={() => setCollapsed((c) => !c)}
                >
                  <div className="outfits-title-group">
                    <FiChevronDown
                      className={`outfits-chevron${collapsed ? " rotated" : ""}`}
                      size={17}
                    />
                    <span className="outfits-title">Saved Outfits</span>
                    <span className="outfits-count">{visibleOutfits.length}</span>
                  </div>
                </button>

                {!collapsed && (
                  <div className="outfits-grid">
                    {visibleOutfits.map((o) => (
                      <OutfitCard
                        key={o._id}
                        outfit={o}
                        onDeleted={(id) => setOutfits((prev) => prev.filter((x) => x._id !== id))}
                        onUpdated={(updated) => setOutfits((prev) => prev.map((x) => x._id === updated._id ? updated : x))}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                {query.trim() ? "No outfits match your search." : "No saved outfits yet."}
              </div>
            )}
          </>
        )}
      </div>

      <CreateOutfitModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(outfit) => setOutfits((prev) => [outfit, ...prev])}
      />
    </div>
  );
}
