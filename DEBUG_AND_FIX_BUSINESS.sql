-- ====================================================================
-- ULTIMATE FIX: Check what's wrong and create test data
-- ====================================================================
-- This will diagnose the exact problem and fix it
-- ====================================================================

-- ====================================================================
-- STEP 1: Check what businesses actually exist
-- ====================================================================
SELECT 
    'BUSINESSES IN YOUR DATABASE:' as status,
    COUNT(*) as total_count
FROM public."Business";

SELECT 
    id,
    name,
    category,
    is_open,
    'Copy this ID for testing ↑' as note
FROM public."Business"
ORDER BY created_at DESC
LIMIT 10;

-- ====================================================================
-- STEP 2: Check admins table (alternative business source)
-- ====================================================================
SELECT 
    'BUSINESS OWNERS IN ADMINS TABLE:' as status,
    COUNT(*) as total_count
FROM public.admins 
WHERE role = 'business_owner';

SELECT 
    id,
    business_name,
    business_type,
    is_approved,
    'You can also use this ID ↑' as note
FROM public.admins
WHERE role = 'business_owner'
ORDER BY created_at DESC
LIMIT 10;

-- ====================================================================
-- STEP 3: Create test business if none exist
-- ====================================================================
-- Only creates if no businesses exist

DO $$
DECLARE
    business_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO business_count FROM public."Business";
    
    IF business_count = 0 THEN
        INSERT INTO public."Business" (
            id,
            name,
            category,
            latitude,
            longitude,
            queue_length,
            wait_time,
            rating,
            is_open,
            created_at,
            updated_at
        ) VALUES (
            'test-business-12345-abcde-67890-fghij',
            'Test Coffee Shop',
            'Restaurant',
            40.7128,
            -74.0060,
            0,
            '5 min',
            4.5,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created test business with ID: test-business-12345-abcde-67890-fghij';
    ELSE
        RAISE NOTICE 'Businesses already exist - no need to create test data';
    END IF;
END $$;

-- ====================================================================
-- STEP 4: Show final results
-- ====================================================================
SELECT 
    '🎯 USE THIS BUSINESS ID IN YOUR APP:' as instruction,
    id as business_id_to_copy,
    name as business_name,
    category,
    is_open
FROM public."Business"
ORDER BY created_at DESC
LIMIT 1;

-- ====================================================================
-- STEP 5: Verify foreign keys exist
-- ====================================================================
SELECT 
    'FOREIGN KEY STATUS:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'queues' 
            AND constraint_name = 'queues_business_id_fkey'
        ) 
        THEN '✅ Foreign key exists'
        ELSE '❌ Foreign key missing - run FIX_DATABASE_RELATIONSHIPS.sql'
    END as status;

-- ====================================================================
-- SUCCESS MESSAGE
-- ====================================================================
SELECT 
    '🚀 NEXT STEPS:' as step,
    'Copy the business_id from above and paste it in your app manual entry' as instruction;

-- ====================================================================