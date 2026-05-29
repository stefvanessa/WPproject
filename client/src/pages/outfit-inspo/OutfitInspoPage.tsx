import { useMemo, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import { analyzeOutfitInspo, type OutfitInspoResult } from "../../api/outfitInspo";
import "./OutfitInspoPage.scss";

export default function OutfitInspoPage() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<OutfitInspoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  const analyze = async () => {
    if (!image) {
      setError("Choose an outfit inspo image first");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(await analyzeOutfitInspo(image));
    } catch (err: any) {
      setError(err.message ?? "Failed to analyze outfit inspo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outfit-inspo-page">
      <Navbar activeTab="inspo" />

      <main className="inspo-layout">
        <section className="inspo-input">
          <div className="inspo-preview">
            {previewUrl ? <img src={previewUrl} alt="Outfit inspiration preview" /> : <span>No image selected</span>}
          </div>

          <div className="inspo-actions">
            <label className="file-btn">
              Choose inspo image
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setImage(event.target.files?.[0] ?? null);
                  setResult(null);
                  setError(null);
                }}
              />
            </label>
            <button className="analyze-btn" onClick={analyze} disabled={loading}>
              {loading ? "Analyzing..." : "Recreate from wardrobe"}
            </button>
          </div>

          {error && <div className="inspo-error">{error}</div>}
        </section>

        <section className="inspo-results">
          {result && (
            <>
              <div className="analysis-summary">
                <h2>AI read</h2>
                <p>{result.analysis.outfitSummary}</p>
              </div>

              <div className="match-grid">
                {result.matches.map((match, index) => (
                  <div className="match-card" key={`${match.target.category}-${index}`}>
                    <div className="target-meta">
                      <span>{match.target.category}</span>
                      <strong>{match.target.color} {match.target.type}</strong>
                    </div>

                    <div className="matched-image">
                      {match.product?.imageUrl ? (
                        <img src={match.product.imageUrl} alt={match.product.name} />
                      ) : (
                        <span>No close match</span>
                      )}
                    </div>

                    <div className="matched-name">{match.product?.name ?? "Missing wardrobe piece"}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
