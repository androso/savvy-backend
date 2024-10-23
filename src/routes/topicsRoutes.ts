import { Router } from "express";
import { authenticateToken } from "../middleware/authJWT";
import supabase from "../database/db";

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        //try get the user_id
        const user_id = req.user?.id;
        if (!user_id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        //get the current topic of client 
        const { data, error } = await supabase
            .from('courses')
            .select('course_id')
            .eq('user_id', user_id);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        if (!data || data.length === 0) {
            res.status(404).json({ error: 'No courses found for this user' });
            return;
        }
        //map courses to get their id's, and get every topic of course_id
        const courseIds = data.map((course: any) => course.course_id);
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .in('course_id', courseIds);
        if (topicsError) {
            res.status(500).json({ error: topicsError.message });
        }
        res.status(200).json({ data: topics });
    }
    catch (error) {
        res.status(500).json({ error });
    }

})

export default router