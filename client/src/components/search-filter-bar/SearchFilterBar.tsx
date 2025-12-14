import "./SearchFilterBar.scss";
import { FiSearch, FiFilter } from "react-icons/fi";
import { useState } from "react";
import FilterModal, { type AdvancedFilters } from "./FilterModal";

export interface WardrobeFilters {
  query: string;
}

interface Props {
  filters: WardrobeFilters;
  onChange: (next: WardrobeFilters) => void;
  meta?: any;
  onAdvancedChange?: (next: AdvancedFilters) => void;
  advancedFilters?: AdvancedFilters;
}

const SearchFilterBar = ({ filters, onChange, meta, onAdvancedChange, advancedFilters }: Props) => {
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  return (
    <div className="search-filter-bar">
      {/* SEARCH FIELD */}
      <div className="search-wrapper">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search your closet..."
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </div>

      {/* ADVANCED FILTER BUTTON */}
      {meta && onAdvancedChange && advancedFilters !== undefined && (
        <>
          <button className="filter-btn" onClick={() => setFilterModalOpen(true)}>
            <FiFilter /> Filters
          </button>
          <FilterModal
            open={filterModalOpen}
            onClose={() => setFilterModalOpen(false)}
            meta={meta}
            initial={advancedFilters}
            onApply={(next) => onAdvancedChange(next)}
          />
        </>
      )}
    </div>
  );
};

export default SearchFilterBar;
