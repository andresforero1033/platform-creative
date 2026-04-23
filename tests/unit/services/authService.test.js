const jwt = require("jsonwebtoken");

process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";

jest.mock("../../../repositories/userRepository", () => ({
  findByEmailLean: jest.fn(),
  createUser: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findByIdLean: jest.fn(),
  findByDniAndInstitutionLean: jest.fn(),
}));

jest.mock("../../../repositories/institutionRepository", () => ({
  normalizeAdminUsername: jest.fn((value) => (value || "").trim().toLowerCase()),
  findByAdminUsernameLean: jest.fn(),
  findByIdLean: jest.fn(),
  createInstitution: jest.fn(),
}));

jest.mock("../../../repositories/revokedTokenRepository", () => ({
  findByTokenLean: jest.fn(),
  revokeToken: jest.fn(),
}));

const userRepository = require("../../../repositories/userRepository");
const institutionRepository = require("../../../repositories/institutionRepository");
const revokedTokenRepository = require("../../../repositories/revokedTokenRepository");
const authService = require("../../../services/authService");
const AppError = require("../../../utils/appError");

const ACTIVE_INSTITUTION = {
  _id: "507f191e810c19729de86001",
  name: "IED Forero",
  adminUsername: "forero.admin",
  legalId: "NIT-900000001",
  licenseStatus: "active",
  isActive: true,
};

describe("authService unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("register (join) genera tokens y deja estudiantes pendientes de activacion", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByEmailLean.mockResolvedValue(null);
    userRepository.findByDniAndInstitutionLean.mockResolvedValue(null);

    userRepository.createUser.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Test User",
      email: "test@example.com",
      role: "student",
      institutionId: ACTIVE_INSTITUTION._id,
      institutionAdminReference: "forero.admin",
      isInstitutionValidated: false,
      dni: "STU-0001",
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.register({
      registrationMode: "join_institution",
      institutionAdminUsername: "forero.admin",
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      role: "student",
      dni: "STU-0001",
    });

    expect(result.statusCode).toBe(201);
    expect(result.data.accessToken).toBeTruthy();
    expect(result.data.refreshToken).toBeTruthy();
    expect(result.data.user.institutionAdminReference).toBe("forero.admin");
    expect(result.data.user.isInstitutionValidated).toBe(false);

    expect(userRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        institutionAdminReference: "forero.admin",
        isInstitutionValidated: false,
      })
    );

    const accessDecoded = jwt.verify(result.data.accessToken, process.env.JWT_ACCESS_SECRET);
    const refreshDecoded = jwt.verify(result.data.refreshToken, process.env.JWT_REFRESH_SECRET);

    expect(accessDecoded.type).toBe("access");
    expect(accessDecoded.institutionAdminReference).toBe("forero.admin");
    expect(refreshDecoded.type).toBe("refresh");
  });

  test("register (create) crea institucion y admin activo", async () => {
    userRepository.findByEmailLean.mockResolvedValue(null);
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(null);
    institutionRepository.createInstitution.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByDniAndInstitutionLean.mockResolvedValue(null);

    userRepository.createUser.mockResolvedValue({
      _id: "507f1f77bcf86cd799439099",
      name: "Directora",
      email: "admin@example.com",
      role: "admin",
      institutionId: ACTIVE_INSTITUTION._id,
      institutionAdminReference: "forero.admin",
      isInstitutionValidated: true,
      dni: "ADM-0001",
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.register({
      registrationMode: "create_institution",
      adminUsername: "forero.admin",
      institutionName: "IED Forero",
      legalId: "NIT-900000001",
      name: "Directora",
      email: "admin@example.com",
      password: "Admin123!",
      role: "admin",
      dni: "ADM-0001",
    });

    expect(result.statusCode).toBe(201);
    expect(result.data.user.role).toBe("admin");
    expect(result.data.user.isInstitutionValidated).toBe(true);
    expect(institutionRepository.createInstitution).toHaveBeenCalledTimes(1);
  });

  test("register parent vincula hijo por DNI dentro de la misma institucion", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByEmailLean.mockResolvedValue(null);
    userRepository.findByDniAndInstitutionLean
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: "507f1f77bcf86cd799439077", role: "student" });

    userRepository.createUser.mockResolvedValue({
      _id: "507f1f77bcf86cd799439088",
      name: "Parent",
      email: "parent@example.com",
      role: "parent",
      institutionId: ACTIVE_INSTITUTION._id,
      institutionAdminReference: "forero.admin",
      isInstitutionValidated: false,
      dni: "PAR-0001",
      childrenIds: ["507f1f77bcf86cd799439077"],
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.register({
      registrationMode: "join_institution",
      institutionAdminUsername: "forero.admin",
      name: "Parent",
      email: "parent@example.com",
      password: "Parent123!",
      role: "parent",
      dni: "PAR-0001",
      childDni: "STU-0001",
    });

    expect(result.statusCode).toBe(201);
    expect(userRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        childrenIds: ["507f1f77bcf86cd799439077"],
        isInstitutionValidated: false,
      })
    );
  });

  test("register falla cuando institutionAdminUsername no existe", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(null);
    userRepository.findByEmailLean.mockResolvedValue(null);

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "unknown.admin",
        name: "Student",
        email: "student@example.com",
        password: "123456",
        role: "student",
        dni: "STU-0099",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  test("register falla cuando faltan campos obligatorios", async () => {
    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        email: "missing.name@example.com",
        password: "123456",
        role: "student",
        dni: "STU-0003",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
  });

  test("register falla si role admin intenta unirse a institucion", async () => {
    userRepository.findByEmailLean.mockResolvedValue(null);

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        name: "Admin Join",
        email: "admin.join@example.com",
        password: "Admin123!",
        role: "admin",
        dni: "ADM-0200",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
  });

  test("register falla si create_institution no usa role admin", async () => {
    userRepository.findByEmailLean.mockResolvedValue(null);

    await expect(
      authService.register({
        registrationMode: "create_institution",
        adminUsername: "forero.admin",
        institutionName: "IED Forero",
        legalId: "NIT-900000001",
        name: "Docente",
        email: "teacher.create@example.com",
        password: "Teacher123!",
        role: "teacher",
        dni: "DOC-0200",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 403 }));
  });

  test("register falla cuando email ya existe", async () => {
    userRepository.findByEmailLean.mockResolvedValue({ _id: "exists" });

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        name: "Duplicate",
        email: "duplicate@example.com",
        password: "123456",
        role: "student",
        dni: "STU-0004",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 409 }));
  });

  test("register falla cuando DNI ya existe dentro de la institucion", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByEmailLean.mockResolvedValue(null);
    userRepository.findByDniAndInstitutionLean.mockResolvedValue({ _id: "dup-dni" });

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        name: "Duplicate DNI",
        email: "duplicate.dni@example.com",
        password: "123456",
        role: "student",
        dni: "STU-0005",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 409 }));
  });

  test("register parent falla cuando falta childDni", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByEmailLean.mockResolvedValue(null);
    userRepository.findByDniAndInstitutionLean.mockResolvedValue(null);

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        name: "Parent Missing",
        email: "parent.missing@example.com",
        password: "123456",
        role: "parent",
        dni: "PAR-2001",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
  });

  test("register parent falla cuando childDni no existe en institucion", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByEmailLean.mockResolvedValue(null);
    userRepository.findByDniAndInstitutionLean
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        name: "Parent Missing Child",
        email: "parent.child.missing@example.com",
        password: "123456",
        role: "parent",
        dni: "PAR-2002",
        childDni: "STU-0000",
      })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 404 }));
  });

  test("register falla cuando institucion esta inactiva", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue({
      ...ACTIVE_INSTITUTION,
      adminUsername: "inactive.admin",
      isActive: false,
    });
    userRepository.findByEmailLean.mockResolvedValue(null);

    await expect(
      authService.register({
        registrationMode: "join_institution",
        institutionAdminUsername: "inactive.admin",
        name: "Student",
        email: "student2@example.com",
        password: "123456",
        role: "student",
        dni: "STU-0100",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  test("validateInstitutionAdminUsername responde institucion valida", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);

    const result = await authService.validateInstitutionAdminUsername({
      institutionAdminUsername: "forero.admin",
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.institution.adminUsername).toBe("forero.admin");
    expect(result.data.isRegistrationEnabled).toBe(true);
  });

  test("validateInstitutionAdminUsername retorna enabled false si licencia suspendida", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue({
      ...ACTIVE_INSTITUTION,
      licenseStatus: "suspended",
    });

    const result = await authService.validateInstitutionAdminUsername({
      institutionAdminUsername: "forero.admin",
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.isRegistrationEnabled).toBe(false);
  });

  test("validateSchoolCode mantiene compatibilidad por alias", async () => {
    institutionRepository.findByAdminUsernameLean.mockResolvedValue(ACTIVE_INSTITUTION);

    const result = await authService.validateSchoolCode({ schoolCode: "forero.admin" });

    expect(result.statusCode).toBe(200);
    expect(result.data.institution.adminUsername).toBe("forero.admin");
  });

  test("login bloquea usuarios pendientes de activacion institucional", async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);
    userRepository.findByEmailWithPassword.mockResolvedValue({
      _id: "507f1f77bcf86cd799439012",
      name: "Pendiente",
      email: "pending@example.com",
      role: "student",
      institutionId: ACTIVE_INSTITUTION._id,
      institutionAdminReference: "forero.admin",
      isInstitutionValidated: false,
      comparePassword,
    });

    await expect(
      authService.login({ email: "pending@example.com", password: "123456" })
    ).rejects.toEqual(expect.objectContaining({
      name: "AppError",
      statusCode: 403,
    }));
  });

  test("login devuelve tokens cuando credenciales son validas", async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);

    institutionRepository.findByIdLean.mockResolvedValue(ACTIVE_INSTITUTION);
    userRepository.findByEmailWithPassword.mockResolvedValue({
      _id: "507f1f77bcf86cd799439013",
      name: "Login User",
      email: "login@example.com",
      role: "supervisor",
      institutionId: ACTIVE_INSTITUTION._id,
      institutionAdminReference: "forero.admin",
      isInstitutionValidated: true,
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

  test("login falla cuando faltan credenciales", async () => {
    await expect(
      authService.login({ email: "", password: "" })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
  });

  test("login falla cuando password no coincide", async () => {
    const comparePassword = jest.fn().mockResolvedValue(false);
    userRepository.findByEmailWithPassword.mockResolvedValue({
      _id: "507f1f77bcf86cd799439000",
      comparePassword,
    });

    await expect(
      authService.login({ email: "badpass@example.com", password: "wrong" })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });

  test("refresh genera nuevo access token", async () => {
    const refreshToken = jwt.sign(
      { sub: "507f1f77bcf86cd799439014", type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    revokedTokenRepository.findByTokenLean.mockResolvedValue(null);

    userRepository.findByIdLean.mockResolvedValue({
      _id: "507f1f77bcf86cd799439014",
      name: "Refresh User",
      email: "r@r.com",
      role: "student",
      institutionId: ACTIVE_INSTITUTION._id,
      institutionAdminReference: "forero.admin",
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.refreshAccessToken({ refreshToken });

    expect(result.statusCode).toBe(200);
    expect(result.data.accessToken).toBeTruthy();
  });

  test("refresh falla cuando token revocado", async () => {
    const refreshToken = jwt.sign(
      { sub: "507f1f77bcf86cd799439099", type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    revokedTokenRepository.findByTokenLean.mockResolvedValue({ _id: "revoked" });

    await expect(
      authService.refreshAccessToken({ refreshToken })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });

  test("refresh falla cuando token no es refresh", async () => {
    const accessLikeToken = jwt.sign(
      { sub: "507f1f77bcf86cd799439099", type: "access" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    revokedTokenRepository.findByTokenLean.mockResolvedValue(null);

    await expect(
      authService.refreshAccessToken({ refreshToken: accessLikeToken })
    ).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });

  test("logout revoca refresh token", async () => {
    const refreshToken = jwt.sign(
      { sub: "507f1f77bcf86cd799439015", type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const result = await authService.logout({ refreshToken });

    expect(result.statusCode).toBe(200);
    expect(revokedTokenRepository.revokeToken).toHaveBeenCalledTimes(1);
  });

  test("logout falla cuando falta refreshToken", async () => {
    await expect(
      authService.logout({})
    ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
  });
});

