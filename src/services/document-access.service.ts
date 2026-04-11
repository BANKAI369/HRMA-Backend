import { AppDataSource } from "../config/data-source";
import { Document } from "../entities/Document";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { User } from "../entities/User";
import { DocumentStatus } from "../utils/document-status.enum";

const profileRepo = AppDataSource.getRepository(EmployeeProfile);

const DOCUMENT_ADMIN_ROLE_NAMES = new Set(["admin", "hr", "hr manager"]);

const normalizeRoleName = (roleName?: string | null) =>
  roleName?.trim().toLowerCase() ?? "";

export const hasDocumentAdminAccess = (actor: User | null) =>
  Boolean(
    actor?.isActive && DOCUMENT_ADMIN_ROLE_NAMES.has(normalizeRoleName(actor.role?.name))
  );

export const isDocumentManager = (actor: User | null) =>
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

export const canAccessUserDocuments = async (
  actor: User | null,
  targetUserId: string
) => {
  if (!actor?.isActive) {
    return false;
  }

  if (hasDocumentAdminAccess(actor) || actor.id === targetUserId) {
    return true;
  }

  if (!isDocumentManager(actor)) {
    return false;
  }

  const managedUserIds = await getManagedUserIds(actor.id);
  return managedUserIds.includes(targetUserId);
};

export const canAccessDocument = async (
  actor: User | null,
  document: Document
) => canAccessUserDocuments(actor, document.userId);

export const canReviewDocuments = (actor: User | null) =>
  hasDocumentAdminAccess(actor);

export const canDeleteDocument = async (
  actor: User | null,
  document: Document
) => {
  if (hasDocumentAdminAccess(actor)) {
    return true;
  }

  if (document.status === DocumentStatus.VERIFIED) {
    return false;
  }

  return canAccessDocument(actor, document);
};

export const getAccessibleDocumentUserIds = async (actor: User | null) => {
  if (!actor?.isActive) {
    return [];
  }

  if (hasDocumentAdminAccess(actor)) {
    return null;
  }

  if (!isDocumentManager(actor)) {
    return [actor.id];
  }

  const managedUserIds = await getManagedUserIds(actor.id);
  return Array.from(new Set([actor.id, ...managedUserIds]));
};
