import "./GenerateOutfitPage.scss";
import Navbar from "../../components/navbar/Navbar";
import ClothingCard from "../../components/clothing-card/ClothingCard";

import jacketImg from "../../assets/jacket.png";
import shoesImg from "../../assets/shoes.png";
import hoodieImg from "../../assets/hoodie.png";
import pantsImg from "../../assets/pants.png";
import dressImg from "../../assets/dress.png";

import { useState } from "react";

export default function GenerateOutfitPage() {
  const [twoPiece, setTwoPiece] = useState(true);
  const [animClass, setAnimClass] = useState("fade-enter-active");

  const [jacket, setJacket] = useState<string | null>(null);
  const [shoes, setShoes] = useState<string | null>(null);

  const toggle = () => {
    if (!twoPiece) {
      // ONE → TWO
      setAnimClass("split-start");

      setTimeout(() => {
        setTwoPiece(true);
        setAnimClass("split-left-right");
      }, 300);
    } else {
      // TWO → ONE
      setAnimClass("merge-center");

      setTimeout(() => {
        setTwoPiece(false);
        setAnimClass("merge-final");
      }, 300);
    }
  };

  return (
    <div className="home-page">
      <Navbar activeTab="generate" />

      <div className="layout">
        <div className="piece-sidebar" onClick={toggle}>
          <span className="sidebar-text">
            {twoPiece ? "ONE PIECE" : "TWO PIECE"}
          </span>
        </div>

        {/* LEFT COLUMN (dynamic cards) */}
        <div className="left-column">
          <div className="transitionWrapper">
            {!twoPiece && (
              <div
                className={`card ${animClass === "split-start" ? "split-start" : ""
                  } ${animClass === "merge-final" ? "merge-final" : ""}`}
              >
                <ClothingCard
                  label="DRESS"
                  image={dressImg}
                  tall={true}
                  onPrev={() => { }}
                  onNext={() => { }}
                  onShuffle={() => console.log("shuffle dress")}
                />
              </div>
            )}

            {twoPiece && (
              <div className="twoPieceGroup">
                <div
                  className={`card ${animClass === "split-left" ? "split-left" : ""
                    } ${animClass === "merge-center" ? "merge-center" : ""}`}
                >
                  <ClothingCard
                    label="HOODIE"
                    image={hoodieImg}
                    onPrev={() => { }}
                    onNext={() => { }}
                    onShuffle={() => console.log("shuffle hoodie")}
                  />
                </div>

                <div
                  className={`card ${animClass === "split-left-right" ? "split-right" : ""
                    } ${animClass === "merge-center" ? "merge-center" : ""}`}
                >
                  <ClothingCard
                    label="PANTS"
                    image={pantsImg}
                    onPrev={() => { }}
                    onNext={() => { }}
                    onShuffle={() => console.log("shuffle pants")}
                  />{" "}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FIXED RIGHT SIDE */}
        <div className="right-column">
          <ClothingCard
            label="JACKET"
            image={jacket ?? undefined}
            onAdd={() => setJacket(jacketImg)}
            onRemove={() => setJacket(null)}
            onShuffle={() => console.log("shuffle jacket")}

          />

          <ClothingCard
            label="SHOES"
            image={shoes ?? undefined}
            onAdd={() => setShoes(shoesImg)}
            onRemove={() => setShoes(null)}
            onShuffle={() => console.log("shuffle shoes")}
          />
        </div>
      </div>
    </div>
  );
}
