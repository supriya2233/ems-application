/*
 * One place that turns errors into JSON responses.
 *
 * Controllers can simply `throw` (Express 5 forwards errors from
 * async handlers here automatically). Mongoose errors are turned
 * into messages a person can act on, instead of a generic
 * "Failed to create ..." text.
 */

export class AppError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `No API route for ${req.method} ${req.originalUrl}`,
  })
}

// Express recognises an error handler by its four parameters.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let status = error.status || 500
  let message = error.message || 'Something went wrong'

  if (error.name === 'ValidationError') {
    // "department: Path `department` is required." → "department is required"
    status = 400
    message = Object.values(error.errors)
      .map((item) =>
        item.kind === 'required'
          ? `${item.path} is required`
          : item.kind === 'enum'
            ? `${item.value} is not a valid ${item.path}`
            : item.message,
      )
      .join(', ')
  } else if (error.name === 'CastError') {
    status = 400
    message = `Invalid ${error.path}: ${error.value}`
  } else if (error.code === 11000) {
    status = 409
    const [field, value] = Object.entries(error.keyValue || {})[0] || []
    message = field
      ? `A record with ${field} "${value}" already exists`
      : 'This record already exists'
  }

  if (status >= 500) {
    console.error(error)
  }

  res.status(status).json({
    success: false,
    message,
  })
}
