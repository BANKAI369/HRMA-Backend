import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth.middleware";

const buildCurrentUserLookup = (req: AuthRequest) => {
  const userId = typeof req.user?.id === "string" ? req.user.id.trim() : "";
  const email =
    typeof req.user?.email === "string" ? req.user.email.trim().toLowerCase() : "";
  const cognitoSub =
    typeof req.user?.sub === "string" ? req.user.sub.trim() : "";

  return [
    userId ? { id: userId } : null,
    email ? { email } : null,
    cognitoSub ? { cognitoSub } : null,
  ].filter(Boolean) as Array<{
    id?: string;
    email?: string;
    cognitoSub?: string;
  }>;
};

export const resolveAuthenticatedUser = async (
  req: AuthRequest,
  relations: string[] = []
) => {
  const where = buildCurrentUserLookup(req);

  if (!where.length) {
    return null;
  }

  const userRepo = AppDataSource.getRepository(User);
  return userRepo.findOne({
    where,
    relations,
  });
};

export const resolveActorUserId = async (req: AuthRequest) =>
  (await resolveAuthenticatedUser(req))?.id ?? null;
