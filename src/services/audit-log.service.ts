import { EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { AuditLog } from "../entities/AuditLog";

type AuditPayload = Record<string, unknown> | null | undefined;

export type CreateAuditLogInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: AuditPayload;
  newValue?: AuditPayload;
};

const isEqual = (left: unknown, right: unknown) =>
  JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

const normalizePayload = (payload: AuditPayload) => {
  if (!payload) {
    return null;
  }

  return Object.keys(payload).length ? payload : null;
};

export const buildAuditDiff = (
  previous: Record<string, unknown>,
  next: Record<string, unknown>
) => {
  const oldValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};

  for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    const previousValue = previous[key] ?? null;
    const nextValue = next[key] ?? null;

    if (isEqual(previousValue, nextValue)) {
      continue;
    }

    oldValue[key] = previousValue;
    newValue[key] = nextValue;
  }

  const normalizedOldValue = normalizePayload(oldValue);
  const normalizedNewValue = normalizePayload(newValue);

  return {
    hasChanges: Boolean(normalizedOldValue || normalizedNewValue),
    oldValue: normalizedOldValue,
    newValue: normalizedNewValue,
  };
};

export class AuditLogService {
  async log(input: CreateAuditLogInput, manager?: EntityManager) {
    const repository = (manager ?? AppDataSource.manager).getRepository(AuditLog);

    const entry = repository.create({
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: normalizePayload(input.oldValue),
      newValue: normalizePayload(input.newValue),
    });

    return repository.save(entry);
  }
}

export const auditLogService = new AuditLogService();
