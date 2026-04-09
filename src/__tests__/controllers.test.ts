export {};

const mockRegister = jest.fn();
const mockSignIn = jest.fn();
const mockSyncUser = jest.fn();
const mockResetPasswordDirect = jest.fn();
const mockGetMetrics = jest.fn();

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const loadAuthController = async () => {
  jest.resetModules();

  jest.doMock("../services/auth.service", () => ({
    AuthService: jest.fn().mockImplementation(() => ({
      register: mockRegister,
      signIn: mockSignIn,
      syncUser: mockSyncUser,
      resetPasswordDirect: mockResetPasswordDirect,
    })),
  }));

  return import("../controllers/auth.controller");
};

const loadDashboardController = async () => {
  jest.resetModules();

  jest.doMock("../services/dashboard.service", () => ({
    DashboardService: jest.fn().mockImplementation(() => ({
      getMetrics: mockGetMetrics,
    })),
  }));

  return import("../controllers/dashboard.controller");
};

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("register returns 201 on success", async () => {
    const { register } = await loadAuthController();
    const req: any = {
      body: {
        username: "admin",
        email: "admin@hrma.local",
        password: "Admin@123",
      },
    };
    const res = createResponse();
    const payload = { token: "jwt-token" };

    mockRegister.mockResolvedValue(payload);

    await register(req, res);

    expect(mockRegister).toHaveBeenCalledWith(
      "admin",
      "admin@hrma.local",
      "Admin@123"
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it("signIn returns 401 when authentication fails", async () => {
    const { signIn } = await loadAuthController();
    const req: any = {
      body: {
        email: "admin@hrma.local",
        password: "wrong-password",
      },
    };
    const res = createResponse();

    mockSignIn.mockRejectedValue(new Error("Invalid email or password"));

    await signIn(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid email or password",
    });
  });

  it("getCurrentAuthUser returns the synced user", async () => {
    const { getCurrentAuthUser } = await loadAuthController();
    const req: any = {
      user: {
        id: "user-1",
        email: "admin@hrma.local",
      },
    };
    const res = createResponse();
    const user = { id: "user-1", role: { name: "Admin" } };

    mockSyncUser.mockResolvedValue(user);

    await getCurrentAuthUser(req, res);

    expect(mockSyncUser).toHaveBeenCalledWith({
      id: "user-1",
      email: "admin@hrma.local",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });
});

describe("dashboard.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("returns 403 when role or identity is missing", async () => {
    const { getDashboardMetrics } = await loadDashboardController();
    const req: any = { user: {} };
    const res = createResponse();

    await getDashboardMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  it("passes the local request identity to the dashboard service", async () => {
    const { getDashboardMetrics } = await loadDashboardController();
    const req: any = {
      user: {
        id: "user-1",
        username: "admin",
        email: "admin@hrma.local",
        role: "Admin",
      },
    };
    const res = createResponse();
    const metrics = { totalUsers: 4 };

    mockGetMetrics.mockResolvedValue(metrics);

    await getDashboardMetrics(req, res);

    expect(mockGetMetrics).toHaveBeenCalledWith(
      "Admin",
      "user-1",
      "admin@hrma.local"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(metrics);
  });
});
