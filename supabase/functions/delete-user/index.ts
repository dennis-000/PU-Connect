import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId } = await req.json()

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Create Supabase admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Step 1: Force cleanup of all public tables that might reference this user
        // We delete in an order that respects typical FK structures if any are legacy.
        // This handles tables where user_id might be TEXT or UUID (supporting sys_admin_001 feature).
        const tables = [
            { name: 'poll_votes', col: 'user_id' },
            { name: 'poll_options', col: 'poll_id', subQuery: 'polls', subCol: 'created_by' },
            { name: 'polls', col: 'created_by' },
            { name: 'support_tickets', col: 'user_id' },
            { name: 'scheduled_sms', col: 'created_by' },
            { name: 'activity_logs', col: 'user_id' },
            { name: 'notifications', col: 'user_id' },
            { name: 'saved_items', col: 'user_id' },
            { name: 'messages', col: 'sender_id' },
            { name: 'messages', col: 'receiver_id' },
            { name: 'campus_news', col: 'author_id' },
            { name: 'products', col: 'seller_id' },
            { name: 'seller_profiles', col: 'user_id' },
            { name: 'seller_applications', col: 'user_id' }
        ];

        for (const table of tables) {
            try {
                if (table.subQuery) {
                    const { data: subItems } = await supabaseAdmin
                        .from(table.subQuery)
                        .select('id')
                        .eq(table.subCol, userId);

                    if (subItems && subItems.length > 0) {
                        await supabaseAdmin
                            .from(table.name)
                            .delete()
                            .in(table.col, subItems.map(i => i.id));
                    }
                } else {
                    await supabaseAdmin
                        .from(table.name)
                        .delete()
                        .eq(table.col, userId);
                }
            } catch (err) {
                console.error(`Error cleaning up table ${table.name}:`, err);
                // Continue with other tables even if one fails
            }
        }

        // Step 2: Delete the profile
        await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        // Step 3: Delete from auth system (The absolute removal)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            return new Response(JSON.stringify({ error: deleteError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'User account and all related data purged successfully.'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
