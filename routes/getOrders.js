import { Router } from "express"
import supabase from "../config/supabase.js";

const router = Router();

router.get("/", async (req, res) => {

try {

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

        res.status(200).json({
            success: true,
            data: data || []
        });

        if (error) throw error
    
} catch (error) {
    res.status(500).json({
        success: false,
        error: "Failed to fetch orders",
        details: error.message
    });
}

});

export default router;