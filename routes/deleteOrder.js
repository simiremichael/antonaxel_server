import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

// Router endpoint for DELETE requests
router.delete("/", async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({
            error: "Order ID is required"
        });
    }

    try {
       const { data, error } =  await supabase
       .from("orders")
       .delete()
       .eq('id', orderId)
       .select();

       if (error) throw error;
        
        res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });
        
    } catch (error) {
        console.error('Delete order route error:', error);
        res.status(500).json({
            error: 'Failed to delete order',
            details: error.message
        });
    }
});

export default router;
