-- Function to create a table if it doesn't exist
CREATE OR REPLACE FUNCTION create_table_if_not_exists(
  table_name TEXT, 
  table_schema TEXT, 
  indexes TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  EXECUTE format('SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = %L)', table_name) INTO table_exists;

  -- Create table if it doesn't exist
  IF NOT table_exists THEN
    EXECUTE format('CREATE TABLE %I %s', table_name, table_schema);
    
    -- Create indexes if provided
    FOREACH indexes IN ARRAY indexes LOOP
      EXECUTE indexes;
    END LOOP;
    
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
