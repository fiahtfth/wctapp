import { createClient } from '@supabase/supabase-js';
import { Database } from './schema';

// Ensure environment variables are defined for testing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-supabase-anon-key';
}

// Create a custom Supabase client with enhanced type safety
const createEnhancedClient = () => {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Create a proxy to enhance type safety and error handling
  return new Proxy(supabase, {
    get(target, prop, receiver) {
      const originalMethod = Reflect.get(target, prop, receiver);

      if (prop === 'function') {
        return async function(...args: any[]) {
          try {
            const result = await originalMethod.apply(target, args);
            return result;
          } catch (error) {
            console.error(`Error in Supabase method ${String(prop)}:`, error);
            throw error;
          }
        };
      }

      return originalMethod;
    }
  });
};

const supabase = createEnhancedClient();

export default supabase;

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'
);
