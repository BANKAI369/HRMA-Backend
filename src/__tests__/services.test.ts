export {};

const mockHash = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();
const mockFind = jest.fn();
const mockMerge = jest.fn();
const mockRoleFindOne = jest.fn();
const mockRoleCreate = jest.fn();
const mockRoleSave = jest.fn();

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: (...args: unknown[]) => mockHash(...args),
  },
}));

const loadUserService = async () => {
  jest.resetModules();

  const mockUserRepo = {
    findOne: mockFindOne,
    create: mockCreate,
    save: mockSave,
    find: mockFind,
    merge: mockMerge,
  };
  const mockRoleRepo = {
    findOne: mockRoleFindOne,
    create: mockRoleCreate,
    save: mockRoleSave,
  };

  jest.doMock("../config/data-source", () => ({
    AppDataSource: {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockRoleRepo),
    },
  }));

  return import("../services/user.service");
};

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("creates a local user with a hashed temporary password when one is not provided", async () => {
    const { UserService } = await loadUserService();
    const employeeRole = { id: "role-1", name: "Employee" };
    const createdUser = { id: "user-1" };

    mockFindOne.mockResolvedValue(null);
    mockRoleFindOne.mockResolvedValue(employeeRole);
    mockHash.mockResolvedValue("hashed-temp");
    mockCreate.mockReturnValue(createdUser);
    mockSave.mockResolvedValue(createdUser);

    const result = await new UserService().create({
      username: "jane",
      email: "jane@example.com",
    });

    expect(mockHash).toHaveBeenCalledWith(expect.any(String), 10);
    expect(mockCreate).toHaveBeenCalledWith({
      username: "jane",
      email: "jane@example.com",
      password: "hashed-temp",
      mustChangePassword: true,
      role: employeeRole,
    });
    expect(result).toEqual({
      user: createdUser,
      temporaryPassword: expect.any(String),
    });
  });

  it("updates and hashes a new password when one is provided", async () => {
    const { UserService } = await loadUserService();
    const existingUser = {
      id: "user-1",
      username: "jane",
      password: "old-hash",
      mustChangePassword: true,
    };

    mockFindOne.mockResolvedValue(existingUser);
    mockMerge.mockImplementation((target, data) => Object.assign(target, data));
    mockHash.mockResolvedValue("hashed-password");
    mockSave.mockResolvedValue(existingUser);

    await new UserService().update("user-1", {
      username: "jane-2",
      password: "secret123",
    });

    expect(mockMerge).toHaveBeenCalledWith(existingUser, {
      username: "jane-2",
    });
    expect(existingUser.password).toBe("hashed-password");
    expect(existingUser.mustChangePassword).toBe(false);
    expect(mockSave).toHaveBeenCalledWith(existingUser);
  });
});
