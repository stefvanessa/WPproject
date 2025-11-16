import "./HomePage.scss";
import Navbar from "../../components/navbar/Navbar";
import ClothingCard from "../../components/clothing-card/ClothingCard";

import hoodieImg from "../../assets/hoodie.png";
import pantsImg from "../../assets/pants.png";
import dressImg from "../../assets/dress.png";

import { useState } from "react";

export default function HomePage() {
  const [twoPiece, setTwoPiece] = useState(true); // default TWO PIECE

  return (
    <div className="home-page">
      <Navbar activeTab="generate" />

      <div className="layout">
        
        {/* LEFT SIDEBAR */}
        <div
          className="piece-sidebar"
          onClick={() => setTwoPiece(!twoPiece)}
        >
          <span className="sidebar-text">
            {twoPiece ? "ONE PIECE" : "TWO PIECE"}
          </span>
        </div>

        {/* LEFT COLUMN (dynamic cards) */}
        <div className="left-column">
          {twoPiece ? (
            <>
              <ClothingCard
                label="HOODIE"
                image={hoodieImg}
                onPrev={() => {}}
                onNext={() => {}}
              />
              <ClothingCard
                label="PANTS"
                image={pantsImg}
                onPrev={() => {}}
                onNext={() => {}}
              />
            </>
          ) : (
            <ClothingCard
              label="DRESS"
              image={dressImg}
              tall={true}
              onPrev={() => {}}
              onNext={() => {}}
            />
          )}
        </div>

        {/* FIXED RIGHT SIDE */}
        <div className="right-column">
          <ClothingCard
            label="JACKET"
            // image={jacketImg}
            onPrev={() => {}}
            onNext={() => {}}
          />

          <ClothingCard
            label="SHOES"
            // image={shoesImg}
            onPrev={() => {}}
            onNext={() => {}}
          />
        </div>

      </div>
    </div>
  );
}
