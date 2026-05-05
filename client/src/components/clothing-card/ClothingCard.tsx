import "./ClothingCard.scss";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiTrash2 } from "react-icons/fi";

type ClothingCardProps = {
  image?: string;
  label: string;
  tall?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onAdd?: () => void;
  onShuffle?: () => void;
  onRemove?: () => void;
  hideEmptyLabel?: boolean;
};

export default function ClothingCard({
  image,
  label,
  tall = false,
  onPrev,
  onNext,
  onAdd,
  onShuffle,
  onRemove,
  hideEmptyLabel = false
}: ClothingCardProps) {
  return (
    <div className={`clothing-card ${tall ? "tall" : ""}`}>
      {image ? (
        <>
          <div className="icon left">
            <FiChevronLeft className="arrow" onClick={onPrev} />
          </div>
          <img src={image} alt={label} className="clothing-image" />
          <div className="icon right">
            <FiChevronRight className="arrow" onClick={onNext} />
          </div>

          <div className="action-buttons">
            {onShuffle && <div className="action-btn shuffle" onClick={onShuffle}>
              <FiRefreshCw />
              <span className="tooltip">Shuffle</span>
            </div>}

            {onRemove && <div className="action-btn remove" onClick={onRemove}>
              <FiTrash2 />
              <span className="tooltip">Remove</span>
            </div>
            }

          </div>
        </>
      ) : (
        hideEmptyLabel ? (
          <button className="empty-card-btn" onClick={onAdd} aria-label={`Add ${label}`} />
        ) : (
          <button className="add-btn" onClick={onAdd}>
            + ADD {label}
          </button>
        )
      )}
    </div>
  );
}
