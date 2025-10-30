class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class ServerError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorLog = {
    timestamp,
    name: error.name,
    message: error.message,
    statusCode: error.statusCode || 500,
    context,
    ...(isDevelopment && { stack: error.stack })
  };

  console.error('❌ Error:', errorLog);
  return errorLog;
};

const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ServerError,
  logError,
  handleAsyncError
};
