-- ====================================================================
-- DIAGNOSE: Why existing business IDs don't work
-- ====================================================================
-- This will show the exact difference between working and non-working IDs
-- ====================================================================

-- ====================================================================
-- STEP 1: Show the working test business (the one that works)
-- ====================================================================
SELECT 
    '✅ WORKING BUSINESS (Test):' as status,
    id,
    name,
    pg_typeof(id) as id_data_type,
    length(id::text) as id_length,
    id::text as id_as_text
FROM public."Business"
WHERE name LIKE '%Test%' OR name LIKE '%Coffee%'
LIMIT 1;

-- ====================================================================
-- STEP 2: Show your existing businesses (the ones that don't work)
-- ====================================================================
SELECT 
    '❌ EXISTING BUSINESSES (Not working):' as status,
    id,
    name,
    pg_typeof(id) as id_data_type,
    length(id::text) as id_length,
    id::text as id_as_text
FROM public."Business"
WHERE name NOT LIKE '%Test%' AND name NOT LIKE '%Coffee%'
ORDER BY created_at
LIMIT 5;

-- ====================================================================
-- STEP 3: Check for data type issues
-- ====================================================================
SELECT 
    'DATA TYPE CHECK:' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Business' 
AND column_name = 'id';

-- ====================================================================
-- STEP 4: Check for UUID format issues
-- ====================================================================
SELECT 
    'UUID FORMAT CHECK:' as check_type,
    id,
    name,
    CASE 
        WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN '✅ Valid UUID format'
        ELSE '❌ Invalid UUID format'
    END as uuid_validity
FROM public."Business"
ORDER BY created_at;

-- ====================================================================
-- STEP 5: Convert your existing business IDs to proper format
-- ====================================================================
-- This will fix any format issues with your existing businesses

UPDATE public."Business" 
SET id = gen_random_uuid()
WHERE name NOT LIKE '%Test%' 
AND name NOT LIKE '%Coffee%'
AND (
    NOT (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    OR length(id::text) != 36
);

-- ====================================================================
-- STEP 6: Show your fixed businesses with new valid IDs
-- ====================================================================
SELECT 
    '🎯 UPDATED BUSINESS IDs (Now should work):' as status,
    id,
    name,
    category,
    '← Copy these IDs for testing' as note
FROM public."Business"
ORDER BY updated_at DESC;

-- ====================================================================
-- ALTERNATIVE: Create copies of your businesses with proper IDs
-- ====================================================================
-- If you want to keep original data and create working copies:

-- INSERT INTO public."Business" (
--     id, name, category, latitude, longitude, 
--     queue_length, wait_time, rating, is_open, created_at, updated_at
-- )
-- SELECT 
--     gen_random_uuid(),
--     name || ' (Fixed)',
--     category,
--     latitude,
--     longitude,
--     queue_length,
--     wait_time,
--     rating,
--     is_open,
--     NOW(),
--     NOW()
-- FROM public."Business"
-- WHERE name NOT LIKE '%Test%' AND name NOT LIKE '%Coffee%' AND name NOT LIKE '%(Fixed)%';

-- ====================================================================
-- SUCCESS MESSAGE
-- ====================================================================
SELECT 
    '🚀 SOLUTION:' as step,
    'Your business IDs have been fixed. Use the IDs shown above in your app!' as instruction;