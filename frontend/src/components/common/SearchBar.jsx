import { Search, X } from 'lucide-react'

function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  label,
}) {
  return (
    <div className="ui-search">

      <Search
        className="ui-search-icon"
        size={16}
        aria-hidden="true"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder.replace(/\.+$/, '')}
      />

      {value && (
        <button
          type="button"
          className="ui-search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}

    </div>
  )
}

export default SearchBar
