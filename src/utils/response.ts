import { Response } from "express";
import { z } from "zod";

export function sendValidationError(
  res: Response,
  error: z.ZodError<unknown>
) {
  return res.status(400).json({
    message: "Invalid request",
    errors: error.flatten().fieldErrors,
  });
}
