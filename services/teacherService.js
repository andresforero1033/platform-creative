const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");

async function addLessonToSubject(subjectId, payload, teacherId) {
  const { title, content } = payload;

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new AppError("Materia no encontrada.", 404);
  }

  if (!title || !content) {
    throw new AppError("title y content son obligatorios.", 400);
  }

  const subject = await subjectRepository.addLesson(subjectId, title, content, teacherId);

  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  return {
    statusCode: 201,
    message: "Leccion agregada correctamente.",
    data: subject,
  };
}

async function updateLesson(subjectId, lessonId, payload) {
  const { title, content } = payload;

  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("Materia o leccion no encontrada.", 404);
  }

  if (!title && !content) {
    throw new AppError("Debe enviar title o content para actualizar.", 400);
  }

  const subject = await subjectRepository.findByIdWithLessons(subjectId);
  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const lesson = subject.lessons.id(lessonId);
  if (!lesson) {
    throw new AppError("Leccion no encontrada.", 404);
  }

  if (title) lesson.title = title;
  if (content) lesson.content = content;

  const updatedSubject = await subjectRepository.saveSubject(subject);

  return {
    statusCode: 200,
    message: "Leccion actualizada correctamente.",
    data: updatedSubject,
  };
}

async function deleteLesson(subjectId, lessonId) {
  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("Materia o leccion no encontrada.", 404);
  }

  const subject = await subjectRepository.findByIdWithLessons(subjectId);
  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const lesson = subject.lessons.id(lessonId);
  if (!lesson) {
    throw new AppError("Leccion no encontrada.", 404);
  }

  lesson.deleteOne();
  const updatedSubject = await subjectRepository.saveSubject(subject);

  return {
    statusCode: 200,
    message: "Leccion eliminada correctamente.",
    data: updatedSubject,
  };
}

module.exports = {
  addLessonToSubject,
  updateLesson,
  deleteLesson,
};
