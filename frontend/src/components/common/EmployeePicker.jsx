import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

import { getEmployees } from '../../services/employeeService'
import { getAvatarColor, getInitials } from '../../utils/avatar'

/*
 * Searchable employee select (an accessible "combobox").
 *
 *   <EmployeePicker
 *     id="employee"                 matches <label htmlFor="employee">
 *     value={form.employeeId}       e.g. "EMP001" or ''
 *     onChange={(employee) => …}    the whole employee, or null
 *     required
 *     allowUnassigned               shows an "Unassigned" option
 *   />
 *
 * Type to filter by name, ID or department. Keyboard: ↑/↓ to move,
 * Enter to pick, Escape to close the list.
 */
function EmployeePicker({
  id,
  value = '',
  onChange,
  required = false,
  disabled = false,
  allowUnassigned = false,
  placeholder = 'Search by name or ID…',
}) {
  const [employees, setEmployees] = useState([])
  const [loadError, setLoadError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const listId = useId()
  const listRef = useRef(null)

  useEffect(() => {
    let ignore = false

    getEmployees()
      .then((data) => {
        if (!ignore) setEmployees(data)
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.message)
      })

    // If the form closes before the request finishes, skip the update.
    return () => {
      ignore = true
    }
  }, [])

  const selected = employees.find((employee) => employee.employeeId === value)

  const options = useMemo(() => {
    const text = query.trim().toLowerCase()

    const matches = employees.filter((employee) =>
      !text ||
      [employee.name, employee.employeeId, employee.department]
        .some((field) => String(field || '').toLowerCase().includes(text)),
    )

    // "Unassigned" only while not searching for someone
    return allowUnassigned && !text ? [null, ...matches] : matches
  }, [employees, query, allowUnassigned])

  // Keep the highlighted option visible while using the arrow keys.
  useEffect(() => {
    if (!isOpen) return
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, isOpen])

  const open = () => {
    setIsOpen(true)
    setQuery('')
    const current = options.findIndex((employee) => employee?.employeeId === value)
    setActiveIndex(Math.max(current, 0))
  }

  const choose = (employee) => {
    onChange?.(employee)
    setIsOpen(false)
    setQuery('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        open()
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => Math.min(Math.max(index + step, 0), options.length - 1))
    } else if (event.key === 'Enter' && isOpen) {
      event.preventDefault() // don't submit the form
      if (options[activeIndex] !== undefined) choose(options[activeIndex])
    } else if (event.key === 'Escape' && isOpen) {
      event.stopPropagation() // close the list, not the whole dialog
      setIsOpen(false)
    }
  }

  // Text shown in the box: what the user is typing, or the selection.
  const displayValue = isOpen
    ? query
    : selected
      ? `${selected.name} · ${selected.employeeId}`
      : value // an ID we couldn't find stays visible instead of vanishing

  return (
    <div className={`ui-picker ${isOpen ? 'ui-picker-open' : ''}`}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && options.length > 0 ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        placeholder={selected ? `${selected.name} · ${selected.employeeId}` : placeholder}
        value={displayValue}
        required={required}
        disabled={disabled}
        onFocus={open}
        onClick={() => !isOpen && open()}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          if (!isOpen) setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
      />

      {value && !required && !disabled ? (
        <button
          type="button"
          className="ui-picker-clear"
          aria-label="Clear employee"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => choose(null)}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : (
        <ChevronDown className="ui-picker-chevron" size={16} aria-hidden="true" />
      )}

      {isOpen && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="ui-picker-list"
          // Keep focus in the input while clicking an option.
          onMouseDown={(event) => event.preventDefault()}
        >
          {loadError && <li className="ui-picker-empty">{loadError}</li>}

          {!loadError && options.length === 0 && (
            <li className="ui-picker-empty">No employees match “{query}”</li>
          )}

          {options.map((employee, index) => (
            <li
              key={employee?.employeeId ?? 'unassigned'}
              id={`${listId}-${index}`}
              data-index={index}
              role="option"
              aria-selected={(employee?.employeeId ?? '') === value}
              className={`ui-picker-option ${index === activeIndex ? 'ui-picker-option-active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(employee)}
            >
              {employee ? (
                <>
                  <span
                    className="ui-picker-avatar"
                    style={{ background: getAvatarColor(employee.name) }}
                    aria-hidden="true"
                  >
                    {getInitials(employee.name)}
                  </span>
                  <span className="ui-picker-text">
                    <strong>{employee.name}</strong>
                    <small>
                      {employee.employeeId} · {employee.department}
                    </small>
                  </span>
                </>
              ) : (
                <span className="ui-picker-text">
                  <strong>Unassigned</strong>
                  <small>Nobody holds this</small>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default EmployeePicker
