import { Request, Response } from "express";
import { PmsService } from "../services/pms.service";

const service = new PmsService();

export class PmsController {
    async getTimeFrames(req: Request, res: Response) {
        const data = await service.getTimeFrames();
        res.json(data);
    }

    async getGoals(req: Request, res: Response) {
        const data = await service.getGoals();
        res.json(data);
    }

    async updateGoalProgress(req: Request, res: Response) {
        try{
            const {progress} = req.body;
            const goal = await service.updateGoalProgress(req.params.id, progress);
            res.json(goal);
        } catch (error) {
            res.status(500).json({ error: "Failed to update goal progress" });
        }
    }
    async getBadges(req:Request,  res:Response) {
        const data = await service.getBadges();
        res.json(data);
    }

    async getPraises(req:Request, res:Response) {
        const data = await service.getPraises();
        res.json(data);
    }
    async createPraise(req:Request, res:Response){
        try{
            const praise = await service.createPraise(req.body);
            res.status(201).json(praise);
        } catch (e) {
            res.status(500).json({message: (e as Error).message});
        }
    }
}