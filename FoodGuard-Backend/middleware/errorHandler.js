/**
 * Global error handler. Translates common library errors into proper HTTP
 * status codes so client mistakes never surface as a generic 500, and never
 * leaks a stack trace outside development.
 */
module.exports = (err, _req, res, _next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';

  // Mongoose validation (e.g. password too short, required field missing) -> 400
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join(', ') || message;
  }
  // Malformed ObjectId in a query/param -> 400 (not 500)
  else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }
  // Duplicate key (e.g. email already registered) -> 409
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }
  // Bad/expired JWT -> 401
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Not authorized, token failed';
  }
  // Multer upload problems (file too large, unexpected field, etc.) -> 400
  else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image is too large (max 10MB).'
      : `Upload error: ${err.message}`;
  }

  // Never report a 4xx client error as a 500.
  if (status === 500 && process.env.NODE_ENV !== 'test') console.error(err);

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
