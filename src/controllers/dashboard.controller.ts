import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

const resolveRequestRole = (req: AuthRequest): string | null => {
  if (typeof req.user?.role === "string") {
    return req.user.role;
  }

  if (Array.isArray(req.user?.["cognito:groups"])) {
    return req.user["cognito:groups"][0];
  }
  return null;
};

export async function getDashboardMetrics(req: AuthRequest, res: Response) {
  try {
    const role = resolveRequestRole(req);
    const userId = typeof req.user?.id === "string" ? req.user.id : undefined;
    const userEmail = req.user?.email || null;
    const userName =
      typeof req.user?.username === "string"
        ? req.user.username
        : typeof req.user?.["cognito:username"] === "string"
        ? req.user["cognito:username"]
        : undefined;

    if (!role || !userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const metrics = await dashboardService.getMetrics(
      role,
      userId || "",
      userEmail || undefined
    );
    res.status(200).json(metrics);
  } catch (error: any) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard metrics";

    if (message.toLowerCase().includes("not assigned")) {
      return res.status(400).json({ message });
    }

    res.status(500).json({ message });
  }
}
