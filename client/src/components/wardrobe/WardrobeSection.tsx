import WardrobeCard from "./WardrobeCard";
import "./WardrobeSection.scss";

export default function WardrobeSection({ title, items }) {
  return (
    <div className="wardrobe-section">
      <div className="section-header">
        <h3>{title}</h3>
        <span>({items.length})</span>
      </div>

      <div className="section-grid">
        {items.map(item => (
          <WardrobeCard key={item.id} item={item}/>
        ))}
      </div>
    </div>
  );
}
