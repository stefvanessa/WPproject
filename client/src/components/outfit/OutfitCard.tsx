import './OutfitCard.scss';
import type { Product } from '../../api/products';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { deleteOutfit as apiDeleteOutfit, type Outfit } from '../../api/outfits';
import CreateOutfitModal from './CreateOutfitModal';

interface Props {
  outfit: Outfit;
  onDeleted?: (id: string) => void;
  onUpdated?: (outfit: Outfit) => void;
}

export default function OutfitCard({ outfit: initialOutfit, onDeleted, onUpdated }: Props) {
  const [outfit, setOutfit] = useState(initialOutfit);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setOutfit(initialOutfit); }, [initialOutfit]);

  const items: (Product | null)[] = [
    outfit.top ?? null,
    outfit.bottom ?? null,
    outfit.dress ?? null,
    outfit.outerwear ?? null,
    outfit.shoes ?? null,
  ];

  const [urls, setUrls] = useState<(string | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    let mounted = true;

    async function ensureUrls() {
      const next = [...urls];
      await Promise.all(
        items.map(async (it, idx) => {
          if (!it) return;
          // Prefer imageUrl provided by server
          if (it.imageUrl) {
            next[idx] = it.imageUrl;
            return;
          }
          // If server didn't include imageUrl but imageKey exists, request signed URL
          if (it.imageKey) {
            try {
              const data = await apiFetch<{ url: string }>(`/api/image/${encodeURIComponent(it.imageKey)}`);
              if (mounted) next[idx] = data.url;
            } catch {
              // ignore
            }
          }
        })
      );

      if (mounted) setUrls(next);
    }

    ensureUrls();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit]);

  // Use first non-null image as main preview
  const isDress = !!(items[2]);
  const isTwoPiece = !!(items[0] && items[1]);

  const outerwearItem = items[3];
  const shoesItem = items[4];
  const smallItems = [outerwearItem, shoesItem];

  const mainImg = (() => {
    if (isDress) return urls[2] ?? null;
    if (isTwoPiece) return null; // two-piece will render its own combined preview
    return urls.find((u) => !!u) ?? null;
  })();

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiDeleteOutfit(outfit._id);
      if (onDeleted) onDeleted(outfit._id);
    } catch (err) {
      console.error('Failed deleting outfit', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <div className="outfit-card">
      <div className="card-actions">
        <button className="edit-btn" onClick={() => setEditOpen(true)}>Edit</button>
        <button className="delete-btn" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div className="main-preview">
        {isTwoPiece ? (
          <div className="two-piece-preview">
            <div className="two-top">{urls[0] ? <img className="preview-img" src={urls[0] as string} alt="top" /> : <div className="no-preview small">—</div>}</div>
            <div className="two-bottom">{urls[1] ? <img className="preview-img" src={urls[1] as string} alt="bottom" /> : <div className="no-preview small">—</div>}</div>
          </div>
        ) : mainImg ? (
          <img className="preview-img" src={mainImg as string} alt="preview" />
        ) : (
          <div className="no-preview">No preview</div>
        )}
      </div>

      <div className="item-stack">
        {smallItems.map((it, idx) => (
          <div className="small-card" key={idx}>
            {it && urls[3 + idx] ? (
              <img className="small-img" src={urls[3 + idx] as string} alt={it?.name} />
            ) : (
              <div className="small-placeholder">—</div>
            )}
          </div>
        ))}
      </div>

      <div className="meta">
        <h4 className="meta-title">{outfit.name || 'Saved outfit'}</h4>
        <p className="meta-sub">{outfit.createdAt ? new Date(outfit.createdAt).toLocaleString() : ''}</p>
      </div>
    </div>

    <CreateOutfitModal
      open={editOpen}
      onClose={() => setEditOpen(false)}
      outfit={outfit}
      onCreated={(updated) => {
        setOutfit(updated);
        onUpdated?.(updated);
        setEditOpen(false);
      }}
    />
    </>
  );
}
