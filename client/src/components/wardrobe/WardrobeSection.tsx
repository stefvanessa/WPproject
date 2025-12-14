import WardrobeCard from "./WardrobeCard";
import "./WardrobeSection.scss";
import type { Product, ProductMeta } from "../../api/products";

interface Props {
  title: string;
  items: Product[];
  meta: ProductMeta | null;
  onUpdated: (product: Product) => void;
  onDeleted: (id: string) => void;
}

export default function WardrobeSection({ title, items, meta, onUpdated, onDeleted }: Props) {
  return (
    <div className="wardrobe-section">
      <div className="section-header">
        <h3>{title}</h3>
        <span>({items.length})</span>
      </div>

      <div className="section-grid">
        {items.map((item) => (
          <WardrobeCard key={item._id} item={item} meta={meta} onUpdated={onUpdated} onDeleted={onDeleted} />
        ))}
      </div>
    </div>
  );
}
