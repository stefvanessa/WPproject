import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLogOut, FiSmartphone } from "react-icons/fi";
import PairModal from "../pair-modal/PairModal";

interface NavbarProps {
  activeTab: "generate" | "wardrobe" | "collections" | "calendar" | "inspo";
}

const TABS = [
  { key: "generate",    label: "Generate"    },
  { key: "wardrobe",    label: "Wardrobe"    },
  { key: "collections", label: "Collections" },
  { key: "calendar",    label: "Calendar"    },
  { key: "inspo",       label: "Outfit inspo" },
] as const;

const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      {/* Logo */}
      <div className="brand" onClick={() => navigate("/wardrobe")}>
        <img src="/logo.png" alt="Fitly" className="brand-logo" />
      </div>

      {/* Nav tabs */}
      <div className="tabs">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab${activeTab === key ? " active" : ""}`}
            onClick={() => navigate(`/${key}`)}
          >
            {label}
            {activeTab === key && <span className="tab-indicator" />}
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div className="nav-actions">
        {user && (
          <>
            <button
              className="connect-btn"
              onClick={() => setPairOpen(true)}
              title="Connect mobile app"
            >
              <FiSmartphone size={17} />
            </button>
            <button
              className="logout-btn"
              onClick={async () => {
                try { await logout(); } finally { navigate("/login"); }
              }}
              title="Log out"
            >
              <FiLogOut size={15} />
              <span>Log out</span>
            </button>
          </>
        )}
      </div>

      <PairModal open={pairOpen} onClose={() => setPairOpen(false)} />
    </nav>
  );
};

export default Navbar;
