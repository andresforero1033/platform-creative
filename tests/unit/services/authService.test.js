const jwt = require("jsonwebtoken");

process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";

jest.mock("../../../repositories/userRepository", () => ({
  findByEmailLean: jest.fn(),
  createUser: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findByIdLean: jest.fn(),
}));

jest.mock("../../../repositories/revokedTokenRepository", () => ({
  findByTokenLean: jest.fn(),
  revokeToken: jest.fn(),
}));

const userRepository = require("../../../repositories/userRepository");
const authService = require("../../../services/authService");
const AppError = require("../../../utils/appError");

describe("authService unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("register genera access y refresh tokens", async () => {
    userRepository.findByEmailLean.mockResolvedValue(null);
    userRepository.createUser.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Test User",
      email: "test@example.com",
      role: "student",
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.register({
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      role: "student",
    });

    expect(result.statusCode).toBe(201);
    expect(result.data.accessToken).toBeTruthy();
    expect(result.data.refreshToken).toBeTruthy();

    const accessDecoded = jwt.verify(result.data.accessToken, process.env.JWT_ACCESS_SECRET);
    const refreshDecoded = jwt.verify(result.data.refreshToken, process.env.JWT_REFRESH_SECRET);

    expect(accessDecoded.type).toBe("access");
    expect(refreshDecoded.type).toBe("refresh");
  });

  test("login devuelve tokens cuando credenciales son validas", async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);

    userRepository.findByEmailWithPassword.mockResolvedValue({
      _id: "507f1f77bcf86cd799439012",
      name: "Login User",
      email: "login@example.com",
      role: "supervisor",
      points: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword,
    });

    const result = await authService.login({
      email: "login@example.com",
      password: "123456",
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.accessToken).toBeTruthy();
    expect(result.data.refreshToken).toBeTruthy();
    expect(comparePassword).toHaveBeenCalledWith("123456");
  });

  test("login falla con credenciales invalidas", async () => {
    const comparePassword = jest.fn().mockResolvedValue(false);
    userRepository.findByEmailWithPassword.mockResolvedValue({
      _id: "507f1f77bcf86cd799439013",
      comparePassword,
    });

    await expect(
      authService.login({ email: "x@x.com", password: "wrong" })
    ).rejects.toEqual(expect.objectContaining({
      name: "AppError",
      statusCode: 401,
    }));
  });

  test("refresh genera nuevo access token", async () => {
    const refreshToken = jwt.sign(
      { sub: "507f1f77bcf86cd799439014", type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const revokedTokenRepository = require("../../../repositories/revokedTokenRepository");
    revokedTokenRepository.findByTokenLean.mockResolvedValue(null);

    userRepository.findByIdLean.mockResolvedValue({
      _id: "507f1f77bcf86cd799439014",
      name: "Refresh User",
      email: "r@r.com",
      role: "student",
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.refreshAccessToken({ refreshToken });

    expect(result.statusCode).toBe(200);
    expect(result.data.accessToken).toBeTruthy();
  });

  test("lanza AppError cuando email ya existe", async () => {
    userRepository.findByEmailLean.mockResolvedValue({ _id: "exists" });

    await expect(
      authService.register({
        name: "Dup",
        email: "dup@example.com",
        password: "123456",
        role: "student",
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
