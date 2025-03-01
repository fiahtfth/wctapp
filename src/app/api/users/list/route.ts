import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import path from 'path';
import fs from 'fs';
import { User } from '@/types/user';
import { supabaseAdmin } from '@/lib/database/supabaseClient';

// Function to check if we should use mock data
function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

// Mock users data for development/testing
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@nextias.com',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@example.com',
    role: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 3,
    username: 'user2',
    email: 'user2@example.com',
    role: 'user',
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null
  }
];

function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    console[level](logMessage, JSON.stringify(data, null, 2));
  } else {
    console[level](logMessage);
  }
  // Optional: Log to file for persistent debugging
  try {
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'users_list.log');
    fs.appendFileSync(
      logFile,
      `${logMessage}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`
    );
  } catch (fileLogError) {
    console.error('Error logging to file:', fileLogError);
  }
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'email' in obj &&
    'role' in obj &&
    typeof (obj as User).email === 'string' &&
    typeof (obj as User).role === 'string'
  );
}

function isUserArray(arr: unknown): arr is User[] {
  return Array.isArray(arr) && arr.every(isUser);
}

export async function GET(request: NextRequest) {
  try {
    // Log incoming request details
    log('debug', 'Incoming user list request', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    });
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      log('warn', 'No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      log('warn', 'No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      log('error', 'JWT_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    let decoded;
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
      // Validate payload structure
      if (!payload.role || !payload.userId) {
        throw new Error('Invalid token payload');
      }
      decoded = payload as {
        userId: number;
        role: string;
        email: string;
        username?: string;
        exp: number;
      };
      log('debug', 'Token verification successful', {
        userId: decoded.userId,
        role: decoded.role,
      });
    } catch (verifyError) {
      log('error', 'Token verification error', verifyError);
      return NextResponse.json(
        {
          error: 'Invalid token',
          details:
            verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        },
        { status: 401 }
      );
    }
    // Only admins can list users
    if (decoded.role !== 'admin') {
      log('warn', 'Unauthorized access attempt', { role: decoded.role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if we should use mock data
    if (shouldUseMockData()) {
      log('info', 'Using mock users data');
      return NextResponse.json(
        {
          users: mockUsers,
          total: mockUsers.length,
          timestamp: new Date().toISOString(),
          message: 'Mock users retrieved successfully',
          isMockData: true
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch users from Supabase
    try {
      log('debug', 'Fetching users from Supabase');
      
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, username, email, role, is_active, last_login, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        log('error', 'Supabase query error', error);
        
        // If Supabase query fails and mock data is enabled, fall back to mock data
        if (shouldUseMockData()) {
          log('info', 'Falling back to mock users data after Supabase error');
          return NextResponse.json(
            {
              users: mockUsers,
              total: mockUsers.length,
              timestamp: new Date().toISOString(),
              message: 'Mock users retrieved successfully (fallback)',
              isMockData: true,
              originalError: error.message
            },
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
        
        return NextResponse.json(
          {
            error: 'Failed to retrieve users',
            details: error.message,
            suggestedAction: 'Check Supabase connection and user table',
          },
          { status: 500 }
        );
      }

      // Log detailed information about retrieved users
      log('debug', 'Users retrieval details', {
        userCount: users ? users.length : 0,
        usersType: typeof users,
        usersIsArray: Array.isArray(users),
      });

      // Validate users
      let validUsers: User[] = [];
      if (isUserArray(users)) {
        validUsers = users;
      } else if (Array.isArray(users)) {
        const typedUsers = users as any[];
        validUsers = typedUsers.filter(isUser);
        log('warn', 'Some retrieved users did not match the User type', {
          totalRetrieved: typedUsers.length,
          validUsersCount: validUsers.length,
        });
      }

      // Optional: Add a default user if no users exist (for testing/development)
      if (validUsers.length === 0) {
        log('warn', 'No users found in database. Adding a default admin user.');
        
        // Use a hashed password for the default admin
        const hashedPassword = '$2a$10$ExampleHashedPasswordForDevelopment';
        
        try {
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              username: 'default_admin',
              email: 'default_admin@example.com',
              password_hash: hashedPassword,
              role: 'admin',
              is_active: true
            })
            .select('id, username, email, role, is_active, last_login, created_at, updated_at')
            .single();
          
          if (insertError) {
            log('error', 'Failed to insert default admin user', insertError);
          } else if (newUser) {
            log('info', 'Default admin user created', { insertedId: newUser.id });
            validUsers = [newUser];
          }
        } catch (insertError) {
          log('error', 'Failed to insert default admin user', insertError);
        }
      }

      // Return users with additional metadata
      return NextResponse.json(
        {
          users: validUsers as User[],
          total: validUsers.length,
          timestamp: new Date().toISOString(),
          message: validUsers.length === 0 ? 'No users found' : 'Users retrieved successfully',
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (queryError) {
      log('error', 'User query error', queryError);
      return NextResponse.json(
        {
          error: 'Failed to retrieve users',
          details: queryError instanceof Error ? queryError.message : 'Unknown error',
          suggestedAction: 'Check database connection and user table',
        },
        { status: 500 }
      );
    }
  } catch (unexpectedError) {
    log('error', 'Unexpected error in user listing', unexpectedError);
    return NextResponse.json(
      {
        error: 'Critical server error',
        details: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
