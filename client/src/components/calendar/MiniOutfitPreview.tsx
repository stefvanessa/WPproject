import { useEffect, useState } from 'react';
import './MiniOutfitPreview.scss';
import { apiFetch } from '../../api/client';

interface Props {
  outfit: any;
  compact?: boolean;
  horizontal?: boolean;
}

async function resolveUrl(item: any): Promise<string | null> {
  if (!item) return null;
  if (item.imageUrl) return item.imageUrl;
  if (item.imageKey) {
    try {
      const data = await apiFetch<{ url: string }>(
        `/api/image/${encodeURIComponent(item.imageKey)}`
      );
      return data.url;
    } catch {
      return null;
    }
  }
  return null;
}

export default function MiniOutfitPreview({ outfit, compact = false, horizontal = false }: Props) {
  // [top, bottom, dress, outerwear, shoes]
  const [urls, setUrls] = useState<(string | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    if (!outfit) return;
    let mounted = true;
    const items = [outfit.top, outfit.bottom, outfit.dress, outfit.outerwear, outfit.shoes];
    Promise.all(items.map(resolveUrl)).then((resolved) => {
      if (mounted) setUrls(resolved);
    });
    return () => { mounted = false; };
  }, [outfit]);

  if (!outfit) return null;

  const isDress = !!outfit.dress;
  const isTwoPiece = !isDress && !!(outfit.top || outfit.bottom);

  const mainContent = isDress ? (
    urls[2] ? (
      <img className="mop-preview-img" src={urls[2]} alt="dress" />
    ) : (
      <span className="mop-empty">—</span>
    )
  ) : isTwoPiece ? (
    <div className="mop-two-piece">
      <div className="mop-half">
        {urls[0] ? <img className="mop-preview-img" src={urls[0]} alt="top" /> : <span className="mop-empty">—</span>}
      </div>
      <div className="mop-half">
        {urls[1] ? <img className="mop-preview-img" src={urls[1]} alt="bottom" /> : <span className="mop-empty">—</span>}
      </div>
    </div>
  ) : (
    <span className="mop-empty">No preview</span>
  );

  return (
    <div className={`mini-outfit-preview${compact ? ' compact' : ''}${horizontal ? ' horizontal' : ''}`}>
      <div className="mop-main">{mainContent}</div>
      <div className="mop-accessories">
        {[
          { url: urls[3], label: 'outerwear' },
          { url: urls[4], label: 'shoes' },
        ].map(({ url, label }) => (
          <div className="mop-small-card" key={label}>
            {url ? (
              <img className="mop-small-img" src={url} alt={label} />
            ) : (
              <span className="mop-small-empty">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
