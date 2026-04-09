import { AuthRequest } from "../middleware/auth.middleware";

export type RequestIdentity = {
  id: string | null;
  email: string | null;
  username: string | null;
};

export function getRequestRole(req: AuthRequest): string | null {
  return req.user?.role || null;
}

export function getRequestIdentity(req: AuthRequest): RequestIdentity {
  return {
    id: req.user?.id || null,
    email: req.user?.email || null,
    username: req.user?.username || null,
  };
}
