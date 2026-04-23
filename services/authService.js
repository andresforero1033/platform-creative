const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const userRepository = require("../repositories/userRepository");
const institutionRepository = require("../repositories/institutionRepository");
const revokedTokenRepository = require("../repositories/revokedTokenRepository");

const REGISTRATION_MODE = {
  CREATE_INSTITUTION: "create_institution",
  JOIN_INSTITUTION: "join_institution",
};

const ACTIVATION_REQUIRED_ROLES = new Set(["student", "teacher", "parent"]);

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

function normalizeDni(dni) {
  return (dni || "").trim().toUpperCase();
}

function normalizeInstitutionAdminUsername(adminUsername) {
  return institutionRepository.normalizeAdminUsername(adminUsername);
}

function canInstitutionAcceptRegistrations(institution) {
  if (!institution) {
    return false;
  }

  const hasLicense = ["active", "trial"].includes(institution.licenseStatus);
  const isInstitutionEnabled = institution.isActive !== false;

  return hasLicense && isInstitutionEnabled;
}

function resolveRegistrationMode(payload) {
  const mode = payload?.registrationMode;
  if (mode === REGISTRATION_MODE.CREATE_INSTITUTION || mode === REGISTRATION_MODE.JOIN_INSTITUTION) {
    return mode;
  }

  if (payload?.role === "admin" && payload?.adminUsername && payload?.institutionName && payload?.legalId) {
    return REGISTRATION_MODE.CREATE_INSTITUTION;
  }

  return REGISTRATION_MODE.JOIN_INSTITUTION;
}

async function findInstitutionByAdminUsername(adminUsername) {
  const normalizedAdminUsername = normalizeInstitutionAdminUsername(adminUsername);
  if (!normalizedAdminUsername) {
    throw new AppError("institutionAdminUsername es obligatorio.", 400);
  }

  const institution = await institutionRepository.findByAdminUsernameLean(normalizedAdminUsername);

  if (!institution) {
    throw new AppError("Usuario de la institucion no valido.", 404);
  }

  return institution;
}

function generateAccessToken(user) {
  const accessSecret = getAccessSecret();
  if (!accessSecret) {
    throw new AppError("Falta JWT_ACCESS_SECRET o JWT_SECRET en el entorno.", 500);
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      institutionId: user.institutionId ? user.institutionId.toString() : null,
      institutionAdminReference: user.institutionAdminReference || null,
      type: "access",
    },
    accessSecret,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  const refreshSecret = getRefreshSecret();
  if (!refreshSecret) {
    throw new AppError("Falta JWT_REFRESH_SECRET o JWT_SECRET en el entorno.", 500);
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      type: "refresh",
    },
    refreshSecret,
    { expiresIn: "7d" }
  );
}

function buildAuthData(user, institution = null) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: buildUserData(user, institution),
  };
}

function buildInstitutionSummary(institution) {
  if (!institution) {
    return null;
  }

  return {
    id: institution._id,
    name: institution.name,
    adminUsername: institution.adminUsername,
    legalId: institution.legalId,
    licenseStatus: institution.licenseStatus,
    isActive: institution.isActive !== false,
  };
}

function buildUserData(user, institution = null) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId || institution?._id || null,
    institutionAdminReference: user.institutionAdminReference || institution?.adminUsername || null,
    isInstitutionValidated: user.isInstitutionValidated !== false,
    institution: buildInstitutionSummary(institution),
    dni: user.dni || null,
    points: user.points,
    currentStreak: user.currentStreak || 0,
    badges: Array.isArray(user.badges)
      ? user.badges.map((badge) => ({
        badgeId: badge.badgeId,
        nombre: badge.nombre,
        awardedAt: badge.awardedAt,
      }))
      : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function resolveInstitutionForJoin(payload) {
  const institutionAdminUsername = payload.institutionAdminUsername || payload.schoolCode;
  const institution = await findInstitutionByAdminUsername(institutionAdminUsername);

  if (!canInstitutionAcceptRegistrations(institution)) {
    throw new AppError("La institucion existe pero no esta habilitada para nuevos registros.", 403);
  }

  return institution;
}

async function createInstitutionForAdmin(payload) {
  const normalizedAdminUsername = normalizeInstitutionAdminUsername(payload.adminUsername);
  if (!normalizedAdminUsername || !payload.institutionName || !payload.legalId) {
    throw new AppError(
      "Para crear institucion se requiere adminUsername, institutionName y legalId.",
      400
    );
  }

  const existingInstitution = await institutionRepository.findByAdminUsernameLean(normalizedAdminUsername);
  if (existingInstitution) {
    throw new AppError("El usuario institucional ya existe.", 409);
  }

  return institutionRepository.createInstitution({
    name: payload.institutionName,
    adminUsername: normalizedAdminUsername,
    legalId: payload.legalId,
    licenseStatus: "active",
    isActive: true,
  });
}

async function register(payload) {
  const {
    institutionAdminUsername,
    adminUsername,
    institutionName,
    legalId,
    name,
    email,
    password,
    role,
    dni,
    childDni,
  } = payload;

  if (!name || !email || !password || !role || !dni) {
    throw new AppError("name, email, password, role y dni son obligatorios.", 400);
  }

  const registrationMode = resolveRegistrationMode(payload);
  const normalizedEmail = email.toLowerCase();
  const normalizedDni = normalizeDni(dni);

  if (!normalizedDni) {
    throw new AppError("dni es obligatorio.", 400);
  }

  const existingUser = await userRepository.findByEmailLean(normalizedEmail);
  if (existingUser) {
    throw new AppError("El email ya esta registrado.", 409);
  }

  let institution;
  if (registrationMode === REGISTRATION_MODE.CREATE_INSTITUTION) {
    if (role !== "admin") {
      throw new AppError("Solo rol admin puede crear una institucion nueva.", 403);
    }

    institution = await createInstitutionForAdmin({
      adminUsername,
      institutionName,
      legalId,
    });
  } else {
    if (role === "admin") {
      throw new AppError("Para rol admin debes usar el modo Crear Institucion Nueva.", 400);
    }

    institution = await resolveInstitutionForJoin({
      institutionAdminUsername,
      schoolCode: payload.schoolCode,
    });
  }

  const existingUserWithDni = await userRepository.findByDniAndInstitutionLean(
    normalizedDni,
    institution._id
  );
  if (existingUserWithDni) {
    throw new AppError("El DNI ya esta registrado en esta institucion.", 409);
  }

  let parentChildIds = [];
  if (role === "parent") {
    const normalizedChildDni = normalizeDni(childDni);
    if (!normalizedChildDni) {
      throw new AppError("Para registrar un padre, childDni es obligatorio.", 400);
    }

    const childStudent = await userRepository.findByDniAndInstitutionLean(
      normalizedChildDni,
      institution._id,
      "student"
    );

    if (!childStudent) {
      throw new AppError("No existe un estudiante con ese DNI en la misma institucion.", 404);
    }

    parentChildIds = [childStudent._id];
  }

  const requiresActivationByInstitutionAdmin =
    registrationMode === REGISTRATION_MODE.JOIN_INSTITUTION && ACTIVATION_REQUIRED_ROLES.has(role);

  let user;
  try {
    user = await userRepository.createUser({
      name,
      email: normalizedEmail,
      password,
      role,
      dni: normalizedDni,
      institutionId: institution._id,
      institutionAdminReference: institution.adminUsername,
      isInstitutionValidated: !requiresActivationByInstitutionAdmin,
      childrenIds: parentChildIds,
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.dni) {
      throw new AppError("El DNI ya esta registrado en esta institucion.", 409);
    }

    if (error.name === "ValidationError") {
      throw new AppError(error.message, 400);
    }
    throw error;
  }

  return {
    statusCode: 201,
    message: "Usuario registrado correctamente.",
    data: buildAuthData(user, institution),
  };
}

async function validateInstitutionAdminUsername(payload) {
  const institution = await findInstitutionByAdminUsername(
    payload.institutionAdminUsername || payload.schoolCode
  );

  return {
    statusCode: 200,
    message: "Usuario institucional validado correctamente.",
    data: {
      institution: buildInstitutionSummary(institution),
      isRegistrationEnabled: canInstitutionAcceptRegistrations(institution),
    },
  };
}

async function validateSchoolCode(payload) {
  return validateInstitutionAdminUsername(payload);
}

async function login(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError("email y password son obligatorios.", 400);
  }

  const normalizedEmail = email.toLowerCase();
  const user = await userRepository.findByEmailWithPassword(normalizedEmail);

  if (!user) {
    throw new AppError("Credenciales invalidas.", 401);
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new AppError("Credenciales invalidas.", 401);
  }

  if (ACTIVATION_REQUIRED_ROLES.has(user.role) && user.isInstitutionValidated === false) {
    throw new AppError(
      "Tu cuenta esta pendiente de activacion por el administrador institucional.",
      403
    );
  }

  const institution = await institutionRepository.findByIdLean(user.institutionId);

  return {
    statusCode: 200,
    message: "Sesion iniciada correctamente.",
    data: buildAuthData(user, institution),
  };
}

async function refreshAccessToken(payload) {
  const { refreshToken } = payload;

  if (!refreshToken) {
    throw new AppError("refreshToken es obligatorio.", 400);
  }

  const isRevoked = await revokedTokenRepository.findByTokenLean(refreshToken);
  if (isRevoked) {
    throw new AppError("refreshToken revocado.", 401);
  }

  const refreshSecret = getRefreshSecret();
  if (!refreshSecret) {
    throw new AppError("Falta JWT_REFRESH_SECRET o JWT_SECRET en el entorno.", 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, refreshSecret);
  } catch (_error) {
    throw new AppError("refreshToken invalido o expirado.", 401);
  }

  if (decoded.type !== "refresh") {
    throw new AppError("Token no valido para refresh.", 401);
  }

  const user = await userRepository.findByIdLean(decoded.sub);
  if (!user) {
    throw new AppError("Usuario no encontrado para refresh.", 401);
  }

  return {
    statusCode: 200,
    message: "Access token renovado correctamente.",
    data: {
      accessToken: generateAccessToken(user),
    },
  };
}

async function logout(payload) {
  const { refreshToken } = payload;

  if (!refreshToken) {
    throw new AppError("refreshToken es obligatorio.", 400);
  }

  const refreshSecret = getRefreshSecret();
  if (!refreshSecret) {
    throw new AppError("Falta JWT_REFRESH_SECRET o JWT_SECRET en el entorno.", 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, refreshSecret);
  } catch (_error) {
    throw new AppError("refreshToken invalido o expirado.", 401);
  }

  if (decoded.type !== "refresh") {
    throw new AppError("Token no valido para logout.", 401);
  }

  const expiresAt = new Date(decoded.exp * 1000);
  await revokedTokenRepository.revokeToken(refreshToken, expiresAt, "logout");

  return {
    statusCode: 200,
    message: "Logout exitoso. Refresh token revocado.",
    data: {
      revoked: true,
    },
  };
}

module.exports = {
  validateInstitutionAdminUsername,
  validateSchoolCode,
  register,
  login,
  refreshAccessToken,
  logout,
};
