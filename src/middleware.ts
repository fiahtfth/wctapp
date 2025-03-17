import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/cart',
  '/tests',
  '/questions',
  '/users',
  '/add-question',
];

// Define routes that should be accessible only to admins
const adminRoutes = [
  '/admin',
  '/users',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/me',
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`Middleware processing: ${pathname}`);
  
  // Skip middleware for public routes and static files
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/') || // Skip all API routes
    pathname.includes('.') // Skip files with extensions
  ) {
    console.log(`Skipping middleware for public route or API: ${pathname}`);
    return NextResponse.next();
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    console.log(`Protected route detected: ${pathname}`);
    
    // Get the token from cookies first, then Authorization header
    const cookies = request.cookies;
    const accessTokenCookie = cookies.get('accessToken');
    
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    // Check localStorage via client-side cookie
    const localStorageToken = cookies.get('ls_token');
    
    let token = null;
    
    // Try to get token from different sources
    if (accessTokenCookie) {
      token = accessTokenCookie.value;
      console.log('Token found in cookies');
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Token found in Authorization header');
    } else if (localStorageToken) {
      token = localStorageToken.value;
      console.log('Token found in localStorage cookie');
    } else {
      console.log('No token found in any source');
    }
    
    // If no token, redirect to login
    if (!token) {
      console.log(`No token found, redirecting to login from ${pathname}`);
      const url = new URL('/login', request.url);
      // Store the current URL to redirect back after login
      url.searchParams.set('redirect', encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }
    
    try {
      // Verify the token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT secret not configured');
      }
      
      console.log('Verifying token...');
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
      const userRole = payload.role as string;
      
      console.log(`Token verified, user role: ${userRole}`);
      
      // Check if user has admin role for admin routes
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
      
      if (isAdminRoute && userRole !== 'admin') {
        console.log(`Admin route access denied for non-admin user, redirecting to dashboard`);
        // Redirect non-admin users trying to access admin routes
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Token is valid, proceed
      console.log(`Access granted to ${pathname}`);
      
      // For the users page specifically, we'll bypass any further middleware
      if (pathname === '/users') {
        console.log('Users page detected, bypassing further middleware');
        return NextResponse.next();
      }
      
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification failed:', error);
      // Token is invalid or expired, redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', encodeURIComponent(pathname));
      url.searchParams.set('expired', 'true');
      return NextResponse.redirect(url);
    }
  }
  
  // For non-protected routes, proceed
  console.log(`Non-protected route: ${pathname}, proceeding`);
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
