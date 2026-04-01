const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");

async function getSubjects(searchQuery) {
  const search = (searchQuery || "").trim();
  const filter = search
    ? { name: { $regex: search, $options: "i" } }
    : {};

  const subjects = await subjectRepository.findSubjects(filter);

  return {
    statusCode: 200,
    message: search
      ? `Materias filtradas por: ${search}`
      : "Materias obtenidas correctamente.",
    data: subjects,
  };
}

async function getSubjectById(subjectId) {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new AppError("Materia no encontrada: id invalido.", 404);
  }

  const subject = await subjectRepository.findByIdLean(subjectId);

  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  return {
    statusCode: 200,
    message: "Materia obtenida correctamente.",
    data: subject,
  };
}

module.exports = {
  getSubjects,
  getSubjectById,
};
