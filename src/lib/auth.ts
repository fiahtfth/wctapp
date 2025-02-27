import { jwtVerify } from 'jose';

export async function verifyJwtToken(token: string) {
  try {
    // Get the JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables');
      throw new Error('JWT secret not configured');
    }

    // Verify the token
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return payload as { userId: number, email: string };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}
