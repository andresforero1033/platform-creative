const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No autorizado: token requerido." });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = getAccessSecret();

    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT_SECRET no configurado." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ message: "No autorizado: token invalido." });
    }

    const user = await userRepository.findByIdLean(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: "No autorizado: usuario no existe." });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ? user.institutionId.toString() : null,
      institutionAdminReference: user.institutionAdminReference || null,
      isInstitutionValidated: user.isInstitutionValidated !== false,
      dni: user.dni || null,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "No autorizado: token invalido." });
  }
}

function authorize(...roles) {
  return function authorizationMiddleware(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    return next();
  };
}

module.exports = {
  protect,
  authorize,
};
