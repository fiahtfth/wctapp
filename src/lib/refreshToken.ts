import { supabaseAdmin } from '@/lib/database/supabaseClient';
import crypto from 'crypto';

// Generate a secure random token
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

// Save a refresh token to the database
export async function saveRefreshToken(userId: number, token: string, expiresInDays: number = 30): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString(),
        revoked: false
      });
    
    if (error) {
      console.error('Error saving refresh token:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error saving refresh token:', error);
    return false;
  }
}

// Verify a refresh token
export async function verifyRefreshToken(token: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('refresh_tokens')
      .select('user_id, expires_at, revoked')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
    
    // Check if token is expired or revoked
    if (data.revoked || new Date(data.expires_at) < new Date()) {
      console.warn('Refresh token is expired or revoked');
      return null;
    }
    
    return data.user_id;
  } catch (error) {
    console.error('Unexpected error verifying refresh token:', error);
    return null;
  }
}

// Revoke a refresh token
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('token', token);
    
    if (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error revoking refresh token:', error);
    return false;
  }
}

// Revoke all refresh tokens for a user
export async function revokeAllUserRefreshTokens(userId: number): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error revoking user refresh tokens:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error revoking user refresh tokens:', error);
    return false;
  }
}

// Clean up expired tokens (can be run periodically)
export async function cleanupExpiredTokens(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Error cleaning up expired tokens:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error cleaning up expired tokens:', error);
    return false;
  }
} 