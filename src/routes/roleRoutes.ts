import {Router} from "express";

const router = Router();

router.post("/", (req, res) =>{
    const {name} = req.body;
    if(!name){
        return res.status(400).json({error: "Role name is required"});
    }

    res.status(201).json({
        id: Date.now(),
        name,
    });
});

export default router;