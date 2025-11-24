import "./SearchFilterBar.scss";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { useState } from "react";

const SearchFilterBar = () => {
  const [colorOpen, setColorOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);

  return (
    <div className="search-filter-bar">

      {/* SEARCH FIELD */}
      <div className="search-wrapper">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search your closet..." />
      </div>

      {/* COLOR DROPDOWN */}
      <div
        className="filter-dropdown"
        onClick={() => setColorOpen(!colorOpen)}
      >
        <span>Color</span>
        <FiChevronDown className={`chevron ${colorOpen ? "open" : ""}`} />

        {colorOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item">Black</div>
            <div className="dropdown-item">White</div>
            <div className="dropdown-item">Beige</div>
            <div className="dropdown-item">Brown</div>
          </div>
        )}
      </div>

      {/* SEASON DROPDOWN */}
      <div
        className="filter-dropdown"
        onClick={() => setSeasonOpen(!seasonOpen)}
      >
        <span>Season</span>
        <FiChevronDown className={`chevron ${seasonOpen ? "open" : ""}`} />

        {seasonOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item">Summer</div>
            <div className="dropdown-item">Winter</div>
            <div className="dropdown-item">Spring</div>
            <div className="dropdown-item">Fall</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
