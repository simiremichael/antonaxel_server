import { Router } from 'express';
import supabase from '../config/supabase.js';
import { sendStatusConfirmation } from '../config/mailer.js';

const router = Router();

router.patch("/", async(req, res) => {
    const {status, orderId} = req.body;

    if(!status) return res.status(400).json({error: "Status is required"});
    if(!orderId) return res.status(400).json({error: "Order ID is required"});

    try {
        // Correct Supabase update syntax
        const { data, error } = await supabase
            .from("orders") // Fixed table name (should match your other files)
            .update({
                status: status, // Fixed typo: was "staus"
            })
            .eq('id', orderId) // Fixed filter method
            .select('*') // Return updated data
            .single();

        if (error) throw error;

        // Send status confirmation email
        await sendStatusConfirmation(data)
            .then(result => {
                if(!result.success) {
                    throw new Error(result.error)
                }
            })
            .catch(e => console.log('Email error:', e));

        res.status(200).json({success: true, message: "Order updated successfully", data});
        
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            error: 'Failed to update order',
            details: error.message
        });
    }
});

export default router;