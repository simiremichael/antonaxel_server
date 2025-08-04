import  { Router } from 'express';
import https from 'https';
import supabase from "../config/supabase.js";

const router = Router();

// Function to verify payment with Paystack
const verifyPaystackPayment = (reference) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    paystackReq.on('error', (error) => {
      reject(new Error(`Paystack request error: ${error.message}`));
    });

    paystackReq.end();
  });
};

// Verify Paystack payment
router.post('/', async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference is required' });
  }

  try {
    const response = await verifyPaystackPayment(reference);

    if (response.status && response.data.status === 'success') {
      const orderId = response.data.metadata.orderId;

      const { data, error } = await supabase
        .from("orders")
        .update({
          paymentStatus: "Paid", // Corrected typo
          status: "successful" // Corrected typo
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }

      res.json({
        status: 'success',
        message: 'Payment verified successfully',
        data: response.data
      });
    } else {
      res.status(400).json({
        status: 'failed',
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;