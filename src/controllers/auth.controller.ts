import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await authService.signIn(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const getCurrentAuthUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.syncUser({
      id: req.user?.id,
      email: req.user?.email,
    });

    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const syncAuthUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.syncUser({
      id: req.user?.id,
      email: req.user?.email,
    });

    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const resetPasswordDirect = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    const result = await authService.resetPasswordDirect(
      email,
      newPassword
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
