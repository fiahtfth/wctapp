type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private isProd = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitize(data),
    };
  }

  private sanitize(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    if (typeof data === 'object') {
      return Object.keys(data).reduce((acc, key) => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          acc[key] = '[REDACTED]';
        } else if (typeof data[key] === 'object') {
          acc[key] = this.sanitize(data[key]);
        } else {
          acc[key] = data[key];
        }
        return acc;
      }, {} as any);
    }
    return data;
  }

  info(message: string, data?: any) {
    const log = this.formatLog('info', message, data);
    if (!this.isProd) console.log(JSON.stringify(log));
    // In production, you would typically send this to a logging service
  }

  warn(message: string, data?: any) {
    const log = this.formatLog('warn', message, data);
    console.warn(JSON.stringify(log));
  }

  error(message: string, error?: Error | any) {
    const log = this.formatLog('error', message, {
      error: error?.message,
      stack: error?.stack,
    });
    console.error(JSON.stringify(log));
    // In production, you would typically send this to an error tracking service
  }
}

export const logger = Logger.getInstance(); 