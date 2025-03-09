import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Supabase URLs and keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';

// Create a singleton instance for the browser client
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

// Function to get the browser client (singleton pattern)
export function getSupabaseBrowserClient() {
  if (browserClient === null && typeof window !== 'undefined') {
    console.log('Creating new Supabase browser client');
    // Use a consistent storage key to avoid multiple instances
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'wct-app-auth-storage',
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return browserClient;
}

// Admin client with service role for server-side operations
// Only create this on the server side to avoid leaking service role key
const supabaseAdmin = typeof window === 'undefined' 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey)
  : null;

// Default export for backward compatibility
// Use a function to ensure we're not creating the admin client on the client side
export default function getSupabaseClient() {
  // If we're on the server, return the admin client
  if (typeof window === 'undefined') {
    return supabaseAdmin;
  }
  
  // If we're in the browser, return the browser client
  return getSupabaseBrowserClient();
}
