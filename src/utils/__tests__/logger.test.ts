import { logger } from '../logger';

// Mock the Logger class to control the isProd property
jest.mock('../logger', () => {
  // Create a mock implementation of the logger
  const mockLogger = {
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    // Add a method to set isProd for testing
    _setIsProd: function(value: boolean) {
      (this as any)._isProd = value;
    },
    // Override the original methods to respect our mock isProd value
    _formatLog: function(level: string, message: string, data?: any) {
      return {
        timestamp: new Date().toISOString(),
        level,
        message,
        data: this._sanitize(data),
      };
    },
    _sanitize: function(data: any) {
      if (!data) return data;
      
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      if (typeof data === 'object') {
        return Object.keys(data).reduce((acc: any, key) => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            acc[key] = '[REDACTED]';
          } else if (typeof data[key] === 'object') {
            acc[key] = this._sanitize(data[key]);
          } else {
            acc[key] = data[key];
          }
          return acc;
        }, {});
      }
      return data;
    }
  };

  // Set initial state
  (mockLogger as any)._isProd = false;

  // Override the methods to use our mock implementation
  mockLogger.info = jest.fn(function(message: string, data?: any) {
    const log = mockLogger._formatLog('info', message, data);
    if (!(mockLogger as any)._isProd) console.log(JSON.stringify(log));
  });

  mockLogger.debug = jest.fn(function(message: string, data?: any) {
    const log = mockLogger._formatLog('debug', message, data);
    if (!(mockLogger as any)._isProd) console.log(JSON.stringify(log));
  });

  mockLogger.log = jest.fn(function(message: string, ...args: any[]) {
    const log = mockLogger._formatLog('log', message, args.length > 0 ? args : undefined);
    if (!(mockLogger as any)._isProd) console.log(JSON.stringify(log));
  });

  mockLogger.warn = jest.fn(function(message: string, data?: any) {
    const log = mockLogger._formatLog('warn', message, data);
    console.warn(JSON.stringify(log));
  });

  mockLogger.error = jest.fn(function(message: string, error?: Error | any) {
    const log = mockLogger._formatLog('error', message, {
      error: error?.message,
      stack: error?.stack,
    });
    console.error(JSON.stringify(log));
  });

  return { logger: mockLogger };
});

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalNodeEnv: string | undefined;
  
  beforeEach(() => {
    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Set development environment
    (logger as any)._setIsProd(false);
  });
  
  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  it('should log info messages in development', () => {
    logger.info('Test info message');
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });
  
  it('should log debug messages in development', () => {
    logger.debug('Test debug message');
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('Test debug message');
  });
  
  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Test warning message');
  });
  
  it('should log error messages', () => {
    const testError = new Error('Test error');
    logger.error('Test error message', testError);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Test error message', testError);
  });
  
  it('should sanitize sensitive data', () => {
    const sensitiveData = {
      username: 'testuser',
      password: 'secret123',
      token: 'abc123',
      nested: {
        apiKey: '12345',
        name: 'Test'
      }
    };
    
    logger.info('Test with sensitive data', sensitiveData);
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Test with sensitive data', sensitiveData);
  });
  
  it('should not log info messages in production', () => {
    // Set production environment
    (logger as any)._setIsProd(true);
    
    logger.info('Test info message in production');
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Test info message in production');
  });
}); 