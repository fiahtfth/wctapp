// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Create a Supabase client with the Authorization header
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Check if the table exists
    const { data, error: tableCheckError } = await supabaseClient
      .rpc('check_table_exists', { table_name: 'questions' })

    if (tableCheckError) {
      console.error('Error checking table existence:', tableCheckError)
      return new Response(JSON.stringify({ 
        error: 'Failed to check table existence', 
        details: tableCheckError 
      }), { status: 500 })
    }

    // If table doesn't exist, create it
    if (!data) {
      const { error: createTableError } = await supabaseClient.rpc('create_questions_table')

      if (createTableError) {
        console.error('Error creating questions table:', createTableError)
        return new Response(JSON.stringify({ 
          error: 'Failed to create questions table', 
          details: createTableError 
        }), { status: 500 })
      }

      return new Response(JSON.stringify({ 
        message: 'Questions table created successfully' 
      }), { status: 200 })
    }

    // Table already exists
    return new Response(JSON.stringify({ 
      message: 'Questions table already exists' 
    }), { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ 
      error: 'Unexpected error', 
      details: err 
    }), { status: 500 })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create_questions_table' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
