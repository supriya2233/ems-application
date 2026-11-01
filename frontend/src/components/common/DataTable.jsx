/*
 * Simple data table.
 *
 *   columns     [{ key, label, render?(row) }]
 *   data        array of rows
 *   loading     shows skeleton rows
 *   onRowClick  makes rows clickable (and keyboard-reachable)
 *   emptyState  custom element when there are no rows
 */
function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No records found.',
  emptyState,
  loading = false,
  onRowClick,
  caption,
}) {
  const getRowKey = (row, index) =>
    row._id || row.id || index

  return (
    <div className="ui-table-wrapper">

      <table className="ui-table">

        {caption && (
          <caption className="visually-hidden">{caption}</caption>
        )}

        <thead>
          <tr>

            {columns.map((column) => (
              <th key={column.key || column.label} scope="col">
                {column.label}
              </th>
            ))}

          </tr>
        </thead>

        <tbody aria-busy={loading || undefined}>

          {loading ? (

            [1, 2, 3].map((placeholder) => (
              <tr key={placeholder} aria-hidden="true">
                {columns.map((column) => (
                  <td key={column.key || column.label}>
                    <span className="ui-skeleton" />
                  </td>
                ))}
              </tr>
            ))

          ) : data.length === 0 ? (

            <tr>
              <td
                colSpan={columns.length}
                className="ui-table-empty"
              >
                {emptyState || emptyMessage}
              </td>
            </tr>

          ) : (

            data.map((row, rowIndex) => (

              <tr
                key={getRowKey(row, rowIndex)}
                className={onRowClick ? 'ui-table-row-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter') onRowClick(row)
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
              >

                {columns.map((column) => (

                  <td key={column.key || column.label}>

                    {column.render
                      ? column.render(row)
                      : row[column.key] ?? '—'
                    }

                  </td>

                ))}

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  )
}

export default DataTable
