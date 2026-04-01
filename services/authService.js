const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const userRepository = require("../repositories/userRepository");
const revokedTokenRepository = require("../repositories/revokedTokenRepository");

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
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

function buildAuthData(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: buildUserData(user),
  };
}

function buildUserData(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
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

async function register(payload) {
  const { name, email, password, role } = payload;

  if (!name || !email || !password || !role) {
    throw new AppError("name, email, password y role son obligatorios.", 400);
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await userRepository.findByEmailLean(normalizedEmail);
  if (existingUser) {
    throw new AppError("El email ya esta registrado.", 409);
  }

  let user;
  try {
    user = await userRepository.createUser({
      name,
      email: normalizedEmail,
      password,
      role,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      throw new AppError(error.message, 400);
    }
    throw error;
  }

  return {
    statusCode: 201,
    message: "Usuario registrado correctamente.",
    data: buildAuthData(user),
  };
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

  return {
    statusCode: 200,
    message: "Sesion iniciada correctamente.",
    data: buildAuthData(user),
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
  register,
  login,
  refreshAccessToken,
  logout,
};
