-- ====================================================================
-- SIMPLE FIX: Reset ALL Business IDs to new working UUIDs
-- ====================================================================
-- This will give all your businesses fresh new IDs that will work
-- ====================================================================

-- ====================================================================
-- STEP 1: Show current businesses (before reset)
-- ====================================================================
SELECT 
    'CURRENT BUSINESSES (Before reset):' as status,
    id,
    name,
    category
FROM public."Business"
ORDER BY name;

-- ====================================================================
-- STEP 2: Clean up ALL queue entries first (IMPORTANT!)
-- ====================================================================
-- Delete all existing queue entries so we can safely update business IDs

DELETE FROM public.queues;

SELECT 
    'QUEUES CLEARED:' as status,
    'All old queue entries removed' as message;

-- ====================================================================
-- STEP 3: Reset ALL business IDs to new UUIDs
-- ====================================================================
-- Now we can safely give every business a fresh new UUID

UPDATE public."Business" 
SET 
    id = gen_random_uuid(),
    updated_at = NOW();

-- ====================================================================
-- STEP 4: Show updated businesses with new IDs
-- ====================================================================
SELECT 
    '✅ NEW WORKING BUSINESS IDs:' as status,
    id as new_business_id,
    name,
    category,
    'Copy this ID for your app ↑' as note
FROM public."Business"
ORDER BY updated_at DESC;

-- ====================================================================
-- STEP 5: Verify everything is clean
-- ====================================================================
SELECT 
    'FINAL STATUS:' as check_type,
    COUNT(*) as total_businesses,
    'All have fresh new IDs' as note
FROM public."Business";

SELECT 
    'QUEUES TABLE:' as check_type,
    COUNT(*) as queue_entries,
    'Clean slate - ready for new queues' as note
FROM public.queues;

-- ====================================================================
-- SUCCESS MESSAGE
-- ====================================================================
SELECT 
    '🎯 ALL DONE!' as result,
    'All businesses now have fresh new IDs that will work in your app' as message;

SELECT 
    '📋 NEXT STEPS:' as instruction,
    '1. Copy any business ID from above' as step1,
    '2. Use it in your app manual entry' as step2,
    '3. Join queue - it will work! 🎉' as step3;