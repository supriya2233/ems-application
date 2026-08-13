function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
}) {
  return (
    <div className="ui-search">

      <span className="ui-search-icon">
        ⌕
      </span>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />

    </div>
  )
}

export default SearchBar