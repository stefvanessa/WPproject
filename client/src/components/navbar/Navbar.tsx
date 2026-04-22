import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLogOut } from "react-icons/fi";

interface NavbarProps {
  activeTab: "generate" | "wardrobe" | "collections" | "calendar";
}

const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
        <div
          className={`tab ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => navigate("/calendar")}
        >
          Calendar
        </div>
      </div>
      {/* Right-side actions (logout) */}
      <div className="nav-actions">
        {user && (
          <button
            className="logout-btn"
            onClick={async () => {
              try {
                await logout();
              } finally {
                navigate("/login");
              }
            }}
            title="Log out"
          >
            <FiLogOut />
            <span className="logout-text">Log out</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
