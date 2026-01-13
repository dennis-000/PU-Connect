import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  next();
});

app.options('*', (req, res) => {
  res.send('ok');
});

app.post('/verify-paystack-payment', async (req, res) => {
  try {
    const { reference, seller_id } = req.body;

    if (!reference || !seller_id) {
      return res.status(400).json({ error: 'Missing reference or seller_id' });
    }

    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({ error: 'Paystack not configured' });
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
      return res.status(400).json({ error: 'Payment verification failed', details: verifyData });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate subscription dates (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() + 3); // Add 3 days (1 month and 3 days)

    // Record payment in subscription_payments table
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        seller_id,
        amount: verifyData.data.amount / 100, // Convert from kobo to cedis
        currency: verifyData.data.currency,
        payment_reference: reference,
        payment_status: 'success',
        payment_method: 'paystack',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        metadata: verifyData.data,
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      return res.status(500).json({ error: 'Failed to record payment', details: paymentError });
    }

    // Update seller profile with subscription info
    const { error: updateError } = await supabase
      .from('seller_profiles')
      .update({
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        last_payment_date: startDate.toISOString(),
        last_payment_amount: verifyData.data.amount / 100,
        payment_reference: reference,
      })
      .eq('user_id', seller_id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription', details: updateError });
    }

    // Update seller application status to approved if pending
    await supabase
      .from('seller_applications')
      .update({ status: 'approved' })
      .eq('user_id', seller_id)
      .eq('status', 'pending');

    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription_end_date: endDate.toISOString(),
      amount: verifyData.data.amount / 100,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});