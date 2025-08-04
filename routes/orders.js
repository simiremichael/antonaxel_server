import { Router } from 'express';
const router = Router();
import supabase from '../config/supabase.js';
import { sendOrderConfirmation } from '../config/mailer.js';

router.post('/', async (req, res) => {
  const orderData = req.body;
// console.log(orderData)
  // Validate required fields
  // if (!orderData.email || !orderData.items || !orderData.total_price) {
  //   return res.status(400).json({ error: 'Missing required fields' });
  // }

  if (!orderData.email || !orderData.items || typeof orderData.total_price !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Insert into Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        status: 'processing'
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Send confirmation email (async - don't await)
    await sendOrderConfirmation(order)  
      .then(result => {
        if (!result.success) {
          console.error('Email failed for order:', order.id);
          throw new Error(result.error);
        }
      })
      .catch(e => console.error('Email error:', e));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id
    });

  } catch (error) {
    console.error('Order Error:', error);
    res.status(500).json({
      error: 'Failed to process order',
      details: error.message
    });
  }
});

export default router;





// // Add these fields to your existing Order model
// const orderSchema = new mongoose.Schema({
//   // ... existing fields ...
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed'],
//     default: 'pending'
//   },
//   paymentType: {
//     type: String,
//     enum: ['pay now', 'pay small small'],
//     required: true
//   },
//   paymentReference: {
//     type: String,
//     sparse: true // Only for 'pay now' orders
//   },
//   paymentData: {
//     type: Object, // Store Paystack response data
//     default: null
//   }
//   // ... existing fields ...
// });