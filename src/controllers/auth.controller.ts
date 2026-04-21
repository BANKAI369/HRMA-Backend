import { Request, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

const registerSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const handleValidationError = (
  res: Response,
  parsed: { error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }
) =>
  res.status(400).json({
    message: "Invalid request",
    errors: parsed.error.flatten().fieldErrors,
  });

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return handleValidationError(res, parsed);
  }

  try {
    return res.status(201).json(await authService.register(parsed.data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({ message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return handleValidationError(res, parsed);
  }

  try {
    return res.status(200).json(
      await authService.signIn(parsed.data.email, parsed.data.password)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({ message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return handleValidationError(res, parsed);
  }

  try {
    return res
      .status(200)
      .json(
        await authService.resetPasswordDirect(
          parsed.data.email,
          parsed.data.newPassword
        )
      );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reset password failed";
    return res.status(400).json({ message });
  }
}

export async function getCurrentAuthUser(req: AuthRequest, res: Response) {
  try {
    return res.status(200).json(
      await authService.syncUser({
        id: typeof req.user?.id === "string" ? req.user.id : undefined,
        email: typeof req.user?.email === "string" ? req.user.email : undefined,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch current user";
    return res.status(404).json({ message });
  }
}
