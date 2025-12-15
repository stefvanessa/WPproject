import "./CollectionsPage.scss";
import Navbar from "../../components/navbar/Navbar";
import OutfitCard from "../../components/outfit/OutfitCard";
import { useEffect, useState } from "react";
import { fetchOutfits } from "../../api/outfits";

export default function CollectionsPage() {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchOutfits()
      .then((data) => {
        if (!mounted) return;
        setOutfits(data as any[]);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message ?? "Failed to load outfits");
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
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="error-text">{error}</div>}

        {!loading && !error && (
          <>
            {outfits.length > 0 ? (
              <div className="wardrobe-section">
                <div className="section-header">
                  <h3>Saved outfits</h3>
                  <span>({outfits.length})</span>
                </div>

                <div className="outfits-grid">
                  {outfits.map((o) => (
                    <OutfitCard key={o._id} outfit={o} onDeleted={(id:string) => setOutfits((prev)=>prev.filter(x=>x._id!==id))} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">No saved outfits yet.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
