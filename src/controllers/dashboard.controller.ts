import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { DashboardService } from "../services/dashboard.service";
import { getRequestIdentity, getRequestRole } from "../utils/request";

const dashboardService = new DashboardService();

export async function getDashboardMetrics(req: AuthRequest, res: Response) {
  try {
    const role = getRequestRole(req);
    const { id, email, username } = getRequestIdentity(req);
    const userIdentifier = id || username || email;

    if (!role || !userIdentifier) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const metrics = await dashboardService.getMetrics(
      role,
      userIdentifier,
      email || undefined
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
