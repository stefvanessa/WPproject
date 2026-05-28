import { useState } from "react";
import WardrobeCard from "./WardrobeCard";
import "./WardrobeSection.scss";
import type { Product, ProductMeta } from "../../api/products";
import { FiChevronDown } from "react-icons/fi";

interface Props {
  title: string;
  items: Product[];
  meta: ProductMeta | null;
  onUpdated: (product: Product) => void;
  onDeleted: (id: string) => void;
}

const fmt = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function WardrobeSection({ title, items, meta, onUpdated, onDeleted }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="wardrobe-section">
      <button
        className={`section-header${collapsed ? " collapsed" : ""}`}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="section-title-group">
          <FiChevronDown
            className={`section-chevron${collapsed ? " rotated" : ""}`}
            size={17}
          />
          <span className="section-title">{fmt(title)}</span>
          <span className="section-count">{items.length}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="section-grid">
          {items.map((item) => (
            <WardrobeCard
              key={item._id}
              item={item}
              meta={meta}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
