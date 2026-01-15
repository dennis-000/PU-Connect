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
    const { reference, seller_id } = await req.json()

    if (!reference || !seller_id) {
      return new Response(JSON.stringify({ error: 'Missing reference or seller_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Paystack Secret Key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment verification failed', details: verifyData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const metadata = verifyData.data.metadata || {};
    const amount = verifyData.data.amount / 100;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (metadata.type === 'sms_topup') {
      // HANDLE SMS TOPUP
      const { error: smsError } = await supabase
        .from('sms_topups')
        .insert({
          user_id: metadata.admin_id || seller_id,
          amount: amount,
          units: metadata.units,
          payment_reference: reference,
          status: 'success'
        });

      if (smsError) throw smsError;

      return new Response(JSON.stringify({
        success: true,
        type: 'sms_topup',
        message: `Successfully purchased ${metadata.units} SMS units!`,
        units: metadata.units,
        amount: amount
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // DEFAULT: HANDLE SELLER SUBSCRIPTION
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() + 3);

      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          seller_id,
          amount: amount,
          currency: verifyData.data.currency,
          payment_reference: reference,
          payment_status: 'success',
          payment_method: 'paystack',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          metadata: verifyData.data,
        });

      if (paymentError) throw paymentError;

      await supabase
        .from('seller_profiles')
        .update({
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          last_payment_date: startDate.toISOString(),
          last_payment_amount: amount,
          payment_reference: reference,
        })
        .eq('user_id', seller_id);

      await supabase
        .from('seller_applications')
        .update({ status: 'approved' })
        .eq('user_id', seller_id)
        .eq('status', 'pending');

      return new Response(JSON.stringify({
        success: true,
        type: 'subscription',
        message: 'Payment verified and subscription activated',
        subscription_end_date: endDate.toISOString(),
        amount: amount,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})