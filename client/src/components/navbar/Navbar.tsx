import React, { useEffect, useState } from "react";
import "./Navbar.scss";

interface NavbarProps {
  activeTab: "generate" | "wardrobe" | "collections";
}

const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="tabs">
        <div
          className={`tab ${activeTab === "generate" ? "active" : ""}`}
          onClick={() => console.log("generate")}
        >
          Generate outfit
        </div>
        <div
          className={`tab ${activeTab === "wardrobe" ? "active" : ""}`}
          onClick={() => console.log("wardrobe")}
        >
          My wardrobe
        </div>
        <div
          className={`tab ${activeTab === "collections" ? "active" : ""}`}
          onClick={() => console.log("collections")}
        >
          Collections
        </div>
      </div>
    </div>
  );
};

export default Navbar;