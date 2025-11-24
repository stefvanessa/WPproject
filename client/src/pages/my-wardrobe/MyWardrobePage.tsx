import Navbar from "../../components/navbar/Navbar";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";
import WardrobeSection from "../../components/wardrobe/WardrobeSection";

import jacketImg from "../../assets/jacket.png";
import shoesImg from "../../assets/shoes.png";
import hoodieImg from "../../assets/hoodie.png";
import pantsImg from "../../assets/pants.png";
import dressImg from "../../assets/dress.png";
import "./MyWardrobePage.scss";
import { useState } from "react";
import UploadPhotoModal from "../../components/upload-modal/UploadModal";

const MyWardrobePage = () => {
  const [openUpload, setOpenUpload] = useState(false);


  const wardrobe = {
    tops: [{ id: 1, name: "Red T-Shirt", image: hoodieImg }, { id: 2, name: "Blue Shirt", image: hoodieImg }, { id: 3, name: "Green Blouse", image: hoodieImg }, { id: 4, name: "Yellow Tank Top", image: hoodieImg }, { id: 5, name: "Black Sweater", image: hoodieImg }],
    bottoms: [{ id: 1, name: "Jeans", image: pantsImg }, { id: 2, name: "Chinos", image: pantsImg }, { id: 3, name: "Shorts", image: pantsImg }, { id: 4, name: "Skirt", image: pantsImg }],
    dresses: [{ id: 1, name: "Summer Dress", image: dressImg }, { id: 2, name: "Evening Gown", image: dressImg }],
    jackets: [{ id: 1, name: "Leather Jacket", image: jacketImg }, { id: 2, name: "Denim Jacket", image: jacketImg }],
    shoes: [{ id: 1, name: "White Sneakers", image: shoesImg }, { id: 2, name: "Black Boots", image: shoesImg }, { id: 3, name: "Running Shoes", image: shoesImg }],
  };

  return (
    <div className="wardrobe-page">
      <Navbar activeTab="wardrobe" />

      <div className="wardrobe-container">
        <SearchFilterBar />
        <button className="add-item-btn" onClick={() => setOpenUpload(true)}>
            + Add Item
          </button>
        <WardrobeSection title="Tops" items={wardrobe.tops} />
        <WardrobeSection title="Bottoms" items={wardrobe.bottoms} />
        <WardrobeSection title="Dresses" items={wardrobe.dresses} />
        <WardrobeSection title="Jackets" items={wardrobe.jackets} />
        <WardrobeSection title="Shoes" items={wardrobe.shoes} />
      </div>


      <UploadPhotoModal open={openUpload} onClose={() => setOpenUpload(false)} />

    </div>
  );
};

export default MyWardrobePage;
