const AppError = require("../utils/appError");
const leadRepository = require("../repositories/leadRepository");

async function registerLead(payload) {
  const normalizedEmail = (payload.email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new AppError("email es obligatorio.", 400);
  }

  const source = (payload.source || "landing").trim() || "landing";
  const metadata = payload.metadata && typeof payload.metadata === "object"
    ? payload.metadata
    : {};

  const existingLead = await leadRepository.findByEmailLean(normalizedEmail);
  if (existingLead) {
    return {
      statusCode: 200,
      message: "Este correo ya esta en la lista de acceso anticipado.",
      data: {
        leadId: existingLead._id,
        alreadyRegistered: true,
      },
    };
  }

  const lead = await leadRepository.createLead({
    email: normalizedEmail,
    source,
    metadata,
  });

  return {
    statusCode: 201,
    message: "Solicitud recibida. Te contactaremos pronto.",
    data: {
      leadId: lead._id,
      alreadyRegistered: false,
    },
  };
}

module.exports = {
  registerLead,
};
