import { jwtVerify, decodeJwt, JWTPayload } from 'jose';

export interface JwtPayload extends JWTPayload {
  userId: number;
  email: string;
  role: string;
  username: string;
}

export async function verifyJwtToken(token: string): Promise<JwtPayload> {
  try {
    // Get the JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables');
      throw new Error('JWT secret not configured');
    }

    // Verify the token
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return payload as unknown as JwtPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return decodeJwt(token) as JwtPayload;
  } catch (error) {
    console.error('Token decoding failed:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Token expiration check failed:', error);
    return true;
  }
}

export function getTokenExpiryTime(token: string): number | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    return decoded.exp;
  } catch (error) {
    console.error('Failed to get token expiry time:', error);
    return null;
  }
}

// Calculate time remaining before token expires (in seconds)
export function getTokenTimeRemaining(token: string): number {
  try {
    const expiryTime = getTokenExpiryTime(token);
    if (!expiryTime) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = expiryTime - currentTime;
    
    return timeRemaining > 0 ? timeRemaining : 0;
  } catch (error) {
    console.error('Failed to calculate token time remaining:', error);
    return 0;
  }
}
