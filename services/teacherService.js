const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");
const feedbackRepository = require("../repositories/feedbackRepository");
const userRepository = require("../repositories/userRepository");
const notificationService = require("./notificationService");

async function addLessonToSubject(subjectId, payload, teacherUser) {
  const teacherId = teacherUser?.id || teacherUser;
  const institutionId = teacherUser?.institutionId || null;
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

  const lessons = Array.isArray(subject.lessons) ? subject.lessons : [];
  const createdLesson = lessons.length > 0 ? lessons[lessons.length - 1] : null;

  if (createdLesson) {
    const students = await userRepository.findByRoleLean("student", institutionId);

    await Promise.all(
      students.map((student) => notificationService.createNotification({
        userId: student._id,
        type: "system",
        title: `Nueva leccion: ${title}`,
        message: `Ya esta disponible una nueva leccion en ${subject.name}.`,
        metadata: {
          eventName: "new_lesson",
          redirectPath: `/subjects/${subject._id}/lessons/${createdLesson._id}`,
          subjectId: subject._id,
          lessonId: createdLesson._id,
          lessonTitle: createdLesson.title,
          subjectName: subject.name,
        },
      }))
    );
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

async function getMyFeedback(teacherId) {
  const feedback = await feedbackRepository.findByTeacherIdLean(teacherId);

  return {
    statusCode: 200,
    message: "Feedback del docente obtenido correctamente.",
    data: feedback,
  };
}

module.exports = {
  addLessonToSubject,
  updateLesson,
  deleteLesson,
  getMyFeedback,
};
