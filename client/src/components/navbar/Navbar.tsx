import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  activeTab: "generate" | "wardrobe" | "collections";
}

const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="brand__name">SnapFit</div>
      <div className="tabs">
        <div
          className={`tab ${activeTab === "generate" ? "active" : ""}`}
          onClick={() => navigate("/generate")}
        >
          Generate outfit
        </div>
        <div
          className={`tab ${activeTab === "wardrobe" ? "active" : ""}`}
          onClick={() => navigate("/wardrobe")}
        >
          My wardrobe
        </div>
        <div
          className={`tab ${activeTab === "collections" ? "active" : ""}`}
          onClick={() => navigate("/collections")}
        >
          Collections
        </div>
      </div>
    </div>
  );
};

export default Navbar;
