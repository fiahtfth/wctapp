import path from 'path';

// Application-wide configuration
export const APP_CONFIG = {
    DATABASE: {
        PATH: process.env.DB_PATH || path.join(process.cwd(), 'src', 'lib', 'database', 'questions.db'),
        MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    },
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 50,
    },
    FILTERS: {
        MAX_FILTER_VALUES: 50,
    },
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        ENABLE_CONSOLE: process.env.ENABLE_CONSOLE_LOGS !== 'false',
    },
    SECURITY: {
        PASSWORD_SALT_ROUNDS: 10,
        JWT_SECRET: process.env.JWT_SECRET || 'default_secret_please_change',
    }
};

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
