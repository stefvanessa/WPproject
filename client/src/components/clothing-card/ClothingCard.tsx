import "./ClothingCard.scss";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type ClothingCardProps = {
  image?: string;
  label: string;
  tall?: boolean;       // NEW: for long items (dresses)
  onPrev?: () => void;
  onNext?: () => void;
  onAdd?: () => void;
};

export default function ClothingCard({
  image,
  label,
  tall = false,
  onPrev,
  onNext,
  onAdd,
}: ClothingCardProps) {
  return (
    <div className={`clothing-card ${tall ? "tall" : ""}`}>

      {image ? (
        <>
          <FiChevronLeft className="arrow left" onClick={onPrev} />
          <img src={image} alt={label} className="clothing-image" />
          <FiChevronRight className="arrow right" onClick={onNext} />
        </>
      ) : (
        <button className="add-btn" onClick={onAdd}>
          + ADD {label}
        </button>
      )}

    </div>
  );
}
