import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { PayrollService } from "../services/payroll.service";

const service = new PayrollService();

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED"]),
  paymentReference: z
    .union([z.string().trim(), z.literal(""), z.null()])
    .optional(),
  paidAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const getSalaryComponents = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listSalaryComponents());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch salary components";
    return res.status(500).json({ message });
  }
};

export const getPayGroups = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listPayGroups());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pay groups";
    return res.status(500).json({ message });
  }
};

export const getPayCycles = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listPayCycles());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pay cycles";
    return res.status(500).json({ message });
  }
};

export const getPayRegister = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listPayRegister());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pay register";
    return res.status(500).json({ message });
  }
};

export const getPayBatches = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listPayBatches());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pay batches";
    return res.status(500).json({ message });
  }
};

export const getBatchPayments = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listBatchPayments());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch batch payments";
    return res.status(500).json({ message });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  const parsed = updatePaymentStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res
      .status(200)
      .json(await service.updatePaymentStatus(req.params.paymentId, parsed.data));
  } catch (error: any) {
    return res.status(error?.statusCode ?? 400).json({
      message: error?.message ?? "Failed to update payment status",
    });
  }
};

export const getPayGrades = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listPayGrades());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pay grades";
    return res.status(500).json({ message });
  }
};

export const getPayBands = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listPayBands());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pay bands";
    return res.status(500).json({ message });
  }
};

export const getEmployeeSalaries = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listEmployeeSalaries());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch employee salaries";
    return res.status(500).json({ message });
  }
};

export const getEmployeeFnfDetails = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listEmployeeFnfDetails());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch FnF details";
    return res.status(500).json({ message });
  }
};

export const getBonusTypes = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listBonusTypes());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bonus types";
    return res.status(500).json({ message });
  }
};

