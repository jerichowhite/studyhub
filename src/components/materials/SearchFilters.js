// Search bar + filter dropdowns for the Materials page.
// Props:
//   searchTerm    – string
//   onSearch      – fn(value)
//   filters       – { course, type, level, sortBy }
//   onFilterChange – fn(key, value)
//   courses       – array of course strings from user profile
//   totalCount    – number of results shown
//   uploadedCount – number of materials current user uploaded

const MATERIAL_TYPES = [
  'Lecture Notes',
  'Assignments',
  'Past Papers',
  'Slides/Presentations',
  'Study Guides',
  'Books/Textbooks',
  'Practice Questions',
  'Other',
];

const LEVELS = ['100', '200', '300', '400', '500'];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Most Recent' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'title',    label: 'A – Z' },
];

const FilterSelect = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
      focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
      appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
  >
    <option value="all">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value ?? o} value={o.value ?? o}>
        {o.label ?? o}
      </option>
    ))}
  </select>
);

const SearchFilters = ({
  searchTerm,
  onSearch,
  filters,
  onFilterChange,
  courses = [],
  totalCount = 0,
  uploadedCount = 0,
}) => {
  const activeFilters = Object.entries(filters).filter(
    ([k, v]) => v !== 'all' && k !== 'sortBy'
  );

  const filterLabel = (key, val) => {
    if (key === 'course') return val;
    if (key === 'type')   return val;
    if (key === 'level')  return `Level ${val}`;
    return val;
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by title, course, or topic…"
          className="w-full pl-12 pr-10 py-3 text-sm rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
            placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSelect
          value={filters.course}
          onChange={(v) => onFilterChange('course', v)}
          placeholder="All Courses"
          options={courses.map((c) => {
            const code = c.split(' - ')[0]?.trim() || c;
            return { value: code, label: c };
          })}
        />

        <FilterSelect
          value={filters.type}
          onChange={(v) => onFilterChange('type', v)}
          placeholder="All Types"
          options={MATERIAL_TYPES.map((t) => ({ value: t, label: t }))}
        />

        <FilterSelect
          value={filters.level}
          onChange={(v) => onFilterChange('level', v)}
          placeholder="All Levels"
          options={LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))}
        />

        <div className="ml-auto">
          <FilterSelect
            value={filters.sortBy}
            onChange={(v) => onFilterChange('sortBy', v)}
            placeholder="Sort by"
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* Active filter chips + stats */}
      <div className="flex flex-wrap items-center gap-2 min-h-[24px]">
        {/* Stats */}
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {totalCount} material{totalCount !== 1 ? 's' : ''} found
          {uploadedCount > 0 && ` · You uploaded ${uploadedCount}`}
        </span>

        {/* Active filter pills */}
        {activeFilters.map(([key, val]) => (
          <span
            key={key}
            className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            {filterLabel(key, val)}
            <button
              onClick={() => onFilterChange(key, 'all')}
              className="hover:text-blue-900 ml-0.5"
              aria-label={`Remove ${key} filter`}
            >
              ×
            </button>
          </span>
        ))}

        {activeFilters.length > 1 && (
          <button
            onClick={() => {
              onFilterChange('course', 'all');
              onFilterChange('type', 'all');
              onFilterChange('level', 'all');
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
