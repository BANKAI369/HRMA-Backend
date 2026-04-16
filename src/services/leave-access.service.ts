import { AppDataSource } from "../config/data-source";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { LeaveRequest } from "../entities/LeaveRequest";
import { User } from "../entities/User";

const profileRepo = AppDataSource.getRepository(EmployeeProfile);

const LEAVE_ADMIN_ROLE_NAMES = new Set(["admin", "hr", "hr manager"]);

const normalizeRoleName = (roleName?: string | null) =>
  roleName?.trim().toLowerCase() ?? "";

export const hasLeaveAdminAccess = (actor: User | null) =>
  Boolean(
    actor?.isActive &&
      LEAVE_ADMIN_ROLE_NAMES.has(normalizeRoleName(actor.role?.name))
  );

export const isLeaveManager = (actor: User | null) =>
  Boolean(actor?.isActive && normalizeRoleName(actor.role?.name) === "manager");

const getManagedUserIds = async (managerUserId: string) => {
  const profiles = await profileRepo.find({
    select: {
      userId: true,
    },
    where: { managerUserId },
  });

  return profiles.map((profile) => profile.userId);
};

export const canAccessUserLeaves = async (
  actor: User | null,
  targetUserId: string
) => {
  if (!actor?.isActive) {
    return false;
  }

  if (hasLeaveAdminAccess(actor) || actor.id === targetUserId) {
    return true;
  }

  if (!isLeaveManager(actor)) {
    return false;
  }

  const managedUserIds = await getManagedUserIds(actor.id);
  return managedUserIds.includes(targetUserId);
};

export const canAccessLeaveRequest = async (
  actor: User | null,
  leaveRequest: LeaveRequest
) => canAccessUserLeaves(actor, leaveRequest.userId);

export const canReviewLeaveRequest = async (
  actor: User | null,
  leaveRequest: LeaveRequest
) => {
  if (hasLeaveAdminAccess(actor)) {
    return true;
  }

  if (!isLeaveManager(actor) || !actor) {
    return false;
  }

  const managedUserIds = await getManagedUserIds(actor.id);
  return managedUserIds.includes(leaveRequest.userId);
};

export const getAccessibleLeaveUserIds = async (actor: User | null) => {
  if (!actor?.isActive) {
    return [];
  }

  if (hasLeaveAdminAccess(actor)) {
    return null;
  }

  if (!isLeaveManager(actor)) {
    return [actor.id];
  }

  const managedUserIds = await getManagedUserIds(actor.id);
  return Array.from(new Set([actor.id, ...managedUserIds]));
};
