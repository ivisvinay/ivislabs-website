import React from "react";

const CategoryFilter = ({ categories, active, onChange, label = "Filter by Domain" }) => {
  return (
    <nav className="lg:w-56 flex-shrink-0 mb-10 lg:mb-0">
      <div className="lg:sticky lg:top-28">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
          {label}
        </h3>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === cat
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 bg-gray-50 lg:bg-transparent hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default CategoryFilter;
