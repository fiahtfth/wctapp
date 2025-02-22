// Centralized Error Handling

export class AppError extends Error {
  status: number;
  isOperational: boolean;
  originalError?: Error | unknown;

  constructor(message: string, status: number, originalError?: Error | unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.isOperational = true;
    
    // Convert unknown error to Error if possible
    if (originalError) {
      this.originalError = originalError instanceof Error 
        ? originalError 
        : new Error(String(originalError));
    }

    // Ensures the stack trace is captured correctly
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = 'Bad Request') {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Forbidden') {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Not Found') {
    return new AppError(message, 404);
  }

  static internalServerError(message: string = 'Internal Server Error') {
    return new AppError(message, 500);
  }
}

// Global error logging function
export function logError(error: Error | AppError) {
  console.error(`[${new Date().toISOString()}] ${error.name}: ${error.message}`);
  
  if (error instanceof AppError && !error.isOperational) {
    // Log stack trace for unexpected errors
    console.error(error.stack);
  }
}

// Error handler for async functions
export function asyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(error instanceof AppError ? error : new AppError(errorMessage, 500));
      throw error;
    }
  }) as T;
}

// Example usage
export async function exampleAsyncFunction() {
  try {
    // Some async operation
    throw new AppError('Test error', 400);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(error instanceof AppError ? error : new AppError(errorMessage, 500));
    throw error;
  }
}
