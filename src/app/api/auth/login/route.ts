import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { SignJWT } from 'jose';
import path from 'path';
import crypto from 'crypto';

// Configure detailed logging
const LOG_LEVEL = 'debug'; // 'error', 'warn', 'info', 'debug'

function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
        console[level](logMessage, JSON.stringify(data, null, 2));
    } else {
        console[level](logMessage);
    }
}

// Secure and consistent JWT secret generation
function generateJwtSecret(): string {
    // Use a consistent method to generate a secure secret
    return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
    let db;
    try {
        // Resolve database path from environment variable
        const databaseUrl = process.env.DATABASE_URL || '';
        const dbPath = databaseUrl.replace('file:', '');
        const resolvedDbPath = path.resolve(process.cwd(), dbPath || './dev.db');

        // Ensure JWT secret is available and consistent
        const jwtSecret = process.env.JWT_SECRET || generateJwtSecret();
        
        log('debug', 'Database Path', { resolvedDbPath });
        log('debug', 'JWT Secret', { 
            secretAvailable: !!jwtSecret,
            secretLength: jwtSecret.length
        });

        // Log full request details
        log('debug', 'Received login request', {
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers),
        });

        // Validate request method
        if (request.method !== 'POST') {
            log('error', 'Invalid HTTP method');
            return NextResponse.json(
                { error: 'Method Not Allowed', details: 'Only POST method is supported' }, 
                { status: 405 }
            );
        }

        // Check content type explicitly
        const contentType = request.headers.get('content-type');
        log('debug', 'Content Type', { contentType });

        if (!contentType || !contentType.includes('application/json')) {
            log('error', 'Invalid content type', { contentType });
            return NextResponse.json(
                { 
                    error: 'Unsupported Media Type', 
                    details: 'Content-Type must be application/json' 
                }, 
                { status: 415 }
            );
        }

        // Safe JSON parsing with detailed error handling
        let body;
        try {
            body = await request.json();
            log('debug', 'Parsed request body', body);
        } catch (parseError) {
            log('error', 'JSON parsing error', { 
                errorName: parseError.name, 
                errorMessage: parseError.message 
            });
            return NextResponse.json(
                { 
                    error: 'Bad Request', 
                    details: 'Invalid JSON in request body',
                    rawError: parseError.message 
                }, 
                { status: 400 }
            );
        }

        const { email, password } = body;

        // Comprehensive input validation
        if (!email || !password) {
            log('error', 'Missing credentials', { email: !!email, password: !!password });
            return NextResponse.json(
                { 
                    error: 'Validation Failed', 
                    details: 'Email and password are required' 
                }, 
                { status: 422 }
            );
        }

        // Database connection with error handling
        try {
            db = new Database(resolvedDbPath, { readonly: true });
        } catch (dbError) {
            log('error', 'Database connection failed', { 
                errorName: dbError.name, 
                errorMessage: dbError.message,
                dbPath: resolvedDbPath
            });
            return NextResponse.json(
                { 
                    error: 'Internal Server Error', 
                    details: 'Database connection failed',
                    dbPath: resolvedDbPath
                }, 
                { status: 500 }
            );
        }

        // User lookup with detailed logging
        let user;
        try {
            const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
            user = stmt.get(email) as { 
                id: number, 
                email: string,
                password: string, 
                role: 'admin' | 'user' 
            } | undefined;

            log('debug', 'User lookup result', { 
                userFound: !!user, 
                email: user?.email 
            });
        } catch (lookupError) {
            log('error', 'User lookup error', { 
                errorName: lookupError.name, 
                errorMessage: lookupError.message 
            });
            return NextResponse.json(
                { 
                    error: 'Internal Server Error', 
                    details: 'User lookup failed' 
                }, 
                { status: 500 }
            );
        } finally {
            db.close();
        }

        if (!user) {
            log('warn', 'User not found', { email });
            return NextResponse.json(
                { 
                    error: 'Authentication Failed', 
                    details: 'Invalid credentials' 
                }, 
                { status: 401 }
            );
        }

        // Validate role
        if (!['admin', 'user'].includes(user.role)) {
            log('error', 'Invalid user role', { role: user.role });
            return NextResponse.json(
                { 
                    error: 'Forbidden', 
                    details: 'Invalid user role' 
                }, 
                { status: 403 }
            );
        }

        // Password verification
        let isPasswordValid;
        try {
            isPasswordValid = await bcrypt.compare(password, user.password);
            log('debug', 'Password verification', { isPasswordValid });
        } catch (compareError) {
            log('error', 'Password comparison error', { 
                errorName: compareError.name, 
                errorMessage: compareError.message 
            });
            return NextResponse.json(
                { 
                    error: 'Internal Server Error', 
                    details: 'Authentication system error' 
                }, 
                { status: 500 }
            );
        }

        if (!isPasswordValid) {
            log('warn', 'Invalid password', { email });
            return NextResponse.json(
                { 
                    error: 'Authentication Failed', 
                    details: 'Invalid credentials' 
                }, 
                { status: 401 }
            );
        }

        // Token generation
        let token;
        try {
            // Detailed logging for JWT token generation
            log('debug', 'Attempting JWT token generation', {
                userId: user.id,
                email: user.email,
                role: user.role,
                secretLength: jwtSecret.length
            });

            const secret = new TextEncoder().encode(jwtSecret);
            token = await new SignJWT({ 
                userId: user.id, 
                email: user.email,
                role: user.role,
                username: user.email  // Add username for compatibility
            })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1h')
            .sign(secret);

            log('debug', 'Token generated successfully', { 
                tokenLength: token.length 
            });
        } catch (tokenError) {
            log('error', 'Token generation error', { 
                errorName: tokenError.name, 
                errorMessage: tokenError.message,
                stack: tokenError.stack
            });
            return NextResponse.json(
                { 
                    error: 'Internal Server Error', 
                    details: 'Token generation failed',
                    errorDetails: tokenError.message
                }, 
                { status: 500 }
            );
        }

        // Successful login response
        log('info', 'Successful login', { email: user.email });
        return NextResponse.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email,
                role: user.role
            } 
        }, { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (unexpectedError) {
        log('error', 'Unexpected error in login process', { 
            errorName: unexpectedError.name, 
            errorMessage: unexpectedError.message,
            stack: unexpectedError.stack
        });
        return NextResponse.json(
            { 
                error: 'Critical Server Error', 
                details: 'An unexpected error occurred' 
            }, 
            { status: 500 }
        );
    }
}
