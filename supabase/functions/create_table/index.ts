import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Create a Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  // Parse the request body
  const { table_name, table_schema, indexes } = await req.json()

  try {
    // Create the table
    const { data, error: tableError } = await supabase.rpc('create_table_if_not_exists', {
      table_name,
      table_schema,
      indexes
    })

    if (tableError) {
      return new Response(JSON.stringify({ error: tableError }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
