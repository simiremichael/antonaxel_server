import  { Router } from 'express';
import https from 'https';


const router = Router();
// Initialize Paystack payment
router.post('/', async (req, res) => {
  try {
    const { orderId, email, amount, callback_url, metadata } = req.body;

    const params = JSON.stringify({
      email,
      amount: amount * 100,
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

export default router;