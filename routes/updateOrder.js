import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();


router.put("/", async(req, res) => {
    
    const {status} = req.body;

if(!status) return res.status(400).json({error: "Status is required"});

    try {
        const { data, error } = supabase
        .from("order")
        .update([
            {
                status: status,
            }
        ]);

        if (error) throw error;

        await sendStatusConfirmation(data)
        .then(result => {
            if(!result.success) {
                throw new Error(result.error)
            }
        })
        .catch(e => console.log(e))


        res.status(201).json({success: true, message: "Order updated successfully"});
        
    } catch (error) {
        
    }
});

export default router;