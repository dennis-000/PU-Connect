import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, amount, metadata } = await req.json()

    console.log('Payment initialization request:', { email, amount, metadata });

    // Validation
    if (!email || typeof email !== 'string') {
      console.error('Invalid or missing email');
      return new Response(JSON.stringify({
        error: 'Customer email is required and must be a valid string'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid or missing amount:', amount);
      return new Response(JSON.stringify({
        error: 'Payment amount is required and must be a positive number'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY environment variable not set');
      return new Response(JSON.stringify({
        error: 'Payment gateway is not configured. Please contact support.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Initializing Paystack payment for ${email} - Amount: GHS ${amount}`);

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo/pesewas
        currency: 'GHS',
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Service Type",
              variable_name: "service_type",
              value: metadata?.type || "general"
            }
          ]
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    console.log('Paystack API response:', {
      status: paystackData.status,
      message: paystackData.message
    });

    if (!paystackData.status || !paystackData.data) {
      console.error('Paystack initialization failed:', paystackData);
      return new Response(JSON.stringify({
        error: 'Payment initialization failed',
        details: paystackData.message || 'Unknown error from payment gateway'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Payment initialized successfully. Reference:', paystackData.data.reference);

    return new Response(JSON.stringify({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function Error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({
        error: 'Invalid request format. Please check your request data.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})