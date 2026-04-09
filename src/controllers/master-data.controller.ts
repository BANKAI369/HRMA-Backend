import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as service from "../services/master-data.service";

export async function getMasterData(req: AuthRequest, res: Response) {
  const masterData = await service.findAllMasterData();
  res.json(masterData);
}

export async function getDepartments(req: AuthRequest, res: Response) {
  const departments = await service.findAllDepartments();
  res.json(departments);
}

export async function getLocations(req: AuthRequest, res: Response) {
  res.json(await service.findAllLocations());
}

export async function getJobTitles(req: AuthRequest, res: Response) {
  res.json(await service.findAllJobTitles());
}

export async function getCurrencies(req: AuthRequest, res: Response) {
  res.json(await service.findAllCurrencies());
}

export async function getNoticePeriods(req: AuthRequest, res: Response) {
  res.json(await service.findAllNoticePeriods());
}

export async function getExitReasons(req: AuthRequest, res: Response) {
  res.json(await service.findAllExitReasons());
}

export async function getGroups(req: AuthRequest, res: Response) {
  res.json(await service.findAllGroups());
}

export async function getGroupTypes(req: AuthRequest, res: Response) {
  res.json(await service.findAllGroupTypes());
}
