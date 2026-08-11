import { useMemo, useState } from 'react'

function ModuleDashboard({
  eyebrow,
  title,
  description,
  actionLabel,
  summary = [],
  sections = [],
}) {
  const [search, setSearch] = useState('')

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections

    return sections.map((section) => ({
      ...section,
      items: section.items?.filter((item) =>
        JSON.stringify(item)
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    }))
  }, [sections, search])

  const handleAction = () => {
    alert(
      `${actionLabel || 'This action'} will be connected to the backend later.`,
    )
  }

  return (
    <div className="module-page reusable-module-page">

      {/* HEADER */}

      <div className="module-header">

        <div>
          <span className="module-eyebrow">
            {eyebrow}
          </span>

          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>
        </div>

        {actionLabel && (
          <button
            className="primary-button"
            onClick={handleAction}
          >
            + {actionLabel}
          </button>
        )}

      </div>


      {/* SUMMARY */}

      {summary.length > 0 && (
        <section className="generic-summary-grid">

          {summary.map((item) => (
            <div
              className="generic-summary-card"
              key={item.title}
            >

              <div className="generic-summary-top">

                <span>
                  {item.title}
                </span>

                <div className="generic-summary-icon">
                  {item.icon || '•'}
                </div>

              </div>

              <strong>
                {item.value}
              </strong>

              <small>
                {item.description}
              </small>

            </div>
          ))}

        </section>
      )}


      {/* SEARCH */}

      <div className="generic-search-bar">

        <input
          type="search"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

      </div>


      {/* SECTIONS */}

      <div className="generic-sections">

        {filteredSections.map((section) => (

          <section
            className="content-card generic-section"
            key={section.title}
          >

            <div className="section-heading">

              <div>

                <h2>
                  {section.title}
                </h2>

                {section.description && (
                  <p>
                    {section.description}
                  </p>
                )}

              </div>

              {section.badge && (
                <span className="generic-section-badge">
                  {section.badge}
                </span>
              )}

            </div>


            {section.type === 'table' ? (

              <div className="generic-table-wrapper">

                <table className="generic-table">

                  <thead>

                    <tr>
                      {section.columns.map((column) => (
                        <th key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>

                  </thead>

                  <tbody>

                    {section.items?.map((item, index) => (

                      <tr key={item.id || index}>

                        {section.columns.map((column) => {

                          const key = column
                            .toLowerCase()
                            .replaceAll(' ', '')

                          const value =
                            item[key] ??
                            item[column] ??
                            '—'

                          return (
                            <td key={column}>
                              {column === 'Status' ? (
                                <span
                                  className={`generic-status ${String(
                                    value,
                                  )
                                    .toLowerCase()
                                    .replaceAll(' ', '-')}`}
                                >
                                  {value}
                                </span>
                              ) : (
                                value
                              )}
                            </td>
                          )
                        })}

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="generic-item-grid">

                {section.items?.map((item, index) => (

                  <div
                    className="generic-item"
                    key={item.id || index}
                  >

                    <div className="generic-item-icon">
                      {item.icon || '•'}
                    </div>

                    <div className="generic-item-content">

                      <div className="generic-item-title-row">

                        <strong>
                          {item.title || item.name}
                        </strong>

                        {item.status && (
                          <span
                            className={`generic-status ${item.status
                              .toLowerCase()
                              .replaceAll(' ', '-')}`}
                          >
                            {item.status}
                          </span>
                        )}

                      </div>

                      {item.subtitle && (
                        <span className="generic-item-subtitle">
                          {item.subtitle}
                        </span>
                      )}

                      {item.description && (
                        <p>
                          {item.description}
                        </p>
                      )}

                      {item.meta && (
                        <small>
                          {item.meta}
                        </small>
                      )}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        ))}

      </div>

    </div>
  )
}

export default ModuleDashboard