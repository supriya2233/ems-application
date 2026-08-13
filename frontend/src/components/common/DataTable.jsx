function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No records found.',
}) {
  return (
    <div className="ui-table-wrapper">

      <table className="ui-table">

        <thead>
          <tr>

            {columns.map((column) => (
              <th key={column.key || column.label}>
                {column.label}
              </th>
            ))}

          </tr>
        </thead>

        <tbody>

          {data.length === 0 ? (

            <tr>
              <td
                colSpan={columns.length}
                className="ui-table-empty"
              >
                {emptyMessage}
              </td>
            </tr>

          ) : (

            data.map((row, rowIndex) => (

              <tr key={row.id || rowIndex}>

                {columns.map((column) => (

                  <td key={column.key}>

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