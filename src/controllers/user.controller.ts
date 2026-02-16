import { Request, Response } from "express";
import { userService } from "../services/user.service";

export const getUsers = (req: Request, res: Response) => {
  res.json(userService.getAll());
};
