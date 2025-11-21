import React from 'react';
import { Search } from 'lucide-react';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters: Array<{
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    label: string;
  }>;
  viewToggle?: {
    view: string;
    onViewChange: (view: string) => void;
    options: Array<{ value: string; label: string; icon: React.ReactNode }>;
  };
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  viewToggle
}) => (
  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
    <div className="flex flex-col sm:flex-row gap-4 flex-1">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
      
      <div className="flex gap-2">
        {filters.map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-32"
          >
            {filter.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>

    {viewToggle && (
      <div className="flex bg-gray-100 rounded-lg p-1">
        {viewToggle.options.map(option => (
          <button
            key={option.value}
            onClick={() => viewToggle.onViewChange(option.value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              viewToggle.view === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    )}
  </div>
);