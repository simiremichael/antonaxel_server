const express = require('express');
const router = express.Router();
const https = require('https');

// Initialize Paystack payment
router.post('/', async (req, res) => {
  try {
    const { orderId, email, amount, callback_url, metadata } = req.body;

    const params = JSON.stringify({
      email,
      amount,
      callback_url,
      metadata: {
        ...metadata,
        orderId
      }
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        const response = JSON.parse(data);
        if (response.status) {
          res.json(response.data);
        } else {
          res.status(400).json({ error: response.message });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error('Paystack request error:', error);
      res.status(500).json({ error: 'Payment initialization failed' });
    });

    paystackReq.write(params);
    paystackReq.end();

  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Paystack payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { reference } = req.body;

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

      paystackRes.on('end', async () => {
        const response = JSON.parse(data);
        
        if (response.status && response.data.status === 'success') {
          // Update order status in database
          const orderId = response.data.metadata.orderId;
          
          try {
            // Update your order in the database
            // await updateOrderPaymentStatus(orderId, 'paid', response.data);
            
            res.json({
              status: 'success',
              message: 'Payment verified successfully',
              data: response.data
            });
          } catch (dbError) {
            console.error('Database update error:', dbError);
            res.status(500).json({ error: 'Payment verified but database update failed' });
          }
        } else {
          res.status(400).json({
            status: 'failed',
            message: 'Payment verification failed'
          });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error('Paystack verification error:', error);
      res.status(500).json({ error: 'Payment verification failed' });
    });

    paystackReq.end();

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;