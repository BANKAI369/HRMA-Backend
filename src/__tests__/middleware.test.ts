export {};

const mockVerify = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: mockVerify,
  },
}));

import { authenticate } from "../middleware/auth.middleware";
import { errorHandler } from "../middleware/error.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authenticate middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when the authorization header is missing", () => {
    const req: any = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns 401 when jwt verification fails", () => {
    const req: any = { headers: { authorization: "Bearer abc123" } };
    const res = createResponse();
    const next = jest.fn();

    mockVerify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the decoded user when the token is valid", () => {
    const req: any = { headers: { authorization: "Bearer abc123" } };
    const res = createResponse();
    const next = jest.fn();
    const decodedUser = {
      id: "user-1",
      email: "jane@example.com",
      role: "Admin",
    };

    mockVerify.mockReturnValue(decodedUser);

    authenticate(req, res, next);

    expect(req.user).toEqual(decodedUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("authorizeRoles", () => {
  it("returns 403 when req.user is missing", () => {
    const middleware = authorizeRoles("Admin");
    const req: any = {};
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the request role does not match", () => {
    const middleware = authorizeRoles("Admin");
    const req: any = {
      user: {
        role: "Employee",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the request role matches one of the allowed roles", () => {
    const middleware = authorizeRoles("Admin", "Manager");
    const req: any = {
      user: {
        role: "manager",
      },
    };
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("errorHandler", () => {
  it("returns the provided status and message", () => {
    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    errorHandler(
      { status: 418, message: "teapot" },
      req,
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ message: "teapot" });
  });
});
