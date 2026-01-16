-- CHECK FOR PENDING SELLER APPLICATIONS
SELECT 
    sa.id,
    sa.business_name,
    sa.business_type,
    sa.created_at,
    p.full_name as applicant_name,
    p.email as applicant_email
FROM seller_applications sa
JOIN profiles p ON sa.user_id = p.id
WHERE sa.status = 'pending'
ORDER BY sa.created_at DESC;
