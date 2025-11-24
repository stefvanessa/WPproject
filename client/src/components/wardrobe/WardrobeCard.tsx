import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import EditModal from "../modal/Modal";
import "./WardrobeCard.scss";

export default function WardrobeCard({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="wardrobe-item-card">
        <div className="edit-btn" onClick={() => setOpen(true)}>
          <FiEdit />
        </div>

        <img src={item.image} alt={item.name} />
        <h4>{item.name}</h4>
      </div>

      <EditModal open={open} title="Edit Item" onClose={() => setOpen(false)}>
        EDIT MODAL CONTENT HERE
      </EditModal>
    </>
  );
}
