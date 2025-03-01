-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = check_table_exists.table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Function to get columns of a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  columns TEXT[];
BEGIN
  SELECT array_agg(column_name::TEXT) INTO columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = get_table_columns.table_name;
  
  RETURN columns;
END;
$$;

-- Function to get database version
CREATE OR REPLACE FUNCTION version()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  version_info TEXT;
BEGIN
  SELECT version() INTO version_info;
  RETURN version_info;
END;
$$; 