-- FINDING ALL REFERENCES TO A SPECIFIC USER
-- This script helps identify why a user cannot be deleted by checking all tables for that user_id.

DO $$
DECLARE
    uid UUID := '996f212b-dd58-4862-aecf-8ccf728398d2';
    row_count INT;
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns 
        WHERE column_name IN ('user_id', 'id', 'author_id', 'seller_id', 'buyer_id', 'reviewed_by')
        AND table_schema = 'public'
    LOOP
        EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = %L', 
            rec.table_schema, rec.table_name, rec.column_name, uid) INTO row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE 'Found % records in %.%', row_count, rec.table_schema, rec.table_name;
        END IF;
    END LOOP;
END $$;
