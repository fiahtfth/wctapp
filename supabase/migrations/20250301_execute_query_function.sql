-- Create a function to execute raw SQL queries with parameters
CREATE OR REPLACE FUNCTION execute_query_internal(query TEXT, params JSONB[] DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate input
  IF query IS NULL OR trim(query) = '' THEN
    RAISE EXCEPTION 'Invalid query: Query cannot be empty';
  END IF;

  -- Prepare and execute the dynamic query
  EXECUTE query USING VARIADIC (
    SELECT array_agg(
      CASE 
        WHEN p->>'type' = 'text' THEN p->>'value'
        WHEN p->>'type' = 'integer' THEN (p->>'value')::integer
        WHEN p->>'type' = 'numeric' THEN (p->>'value')::numeric
        WHEN p->>'type' = 'boolean' THEN (p->>'value')::boolean
        ELSE p->>'value'
      END
    )
    FROM unnest(params) p
  );

  -- Return the result as JSONB
  RETURN to_jsonb(result);
EXCEPTION 
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution error: %', SQLERRM;
END;
$$;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION execute_query_internal(TEXT, JSONB[]) TO authenticated, service_role;
