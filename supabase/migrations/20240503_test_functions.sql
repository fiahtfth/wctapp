-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
    exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
    ) INTO exists;
    RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Create a function to execute arbitrary SQL
-- This is useful for our test script to create tables and run queries
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT) 
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE sql;
    -- Try to capture results if it's a SELECT query
    BEGIN
        EXECUTE 'WITH result AS (' || sql || ') SELECT jsonb_agg(row_to_json(result)) FROM result' INTO result;
    EXCEPTION WHEN OTHERS THEN
        -- If it's not a SELECT query or other error, return empty array
        result := '[]'::jsonb;
    END;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get database version (useful for connection test)
CREATE OR REPLACE FUNCTION version() 
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('server_version');
END;
$$ LANGUAGE plpgsql; 