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

function detectLessonContentType(content) {
  const trimmed = (content || "").trim();
  const isVideoUrl = /^(https?:\/\/).*(youtube\.com|youtu\.be|vimeo\.com|\.mp4)(.*)$/i.test(trimmed);

  return {
    type: isVideoUrl ? "video" : "text",
    videoUrl: isVideoUrl ? trimmed : null,
  };
}

async function getSubjectLesson(subjectId, lessonId) {
  if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new AppError("Materia o leccion no encontrada: id invalido.", 404);
  }

  const subject = await subjectRepository.findByIdLean(subjectId);

  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const lessons = Array.isArray(subject.lessons) ? subject.lessons : [];
  const currentLessonIndex = lessons.findIndex((lesson) => String(lesson._id) === String(lessonId));

  if (currentLessonIndex < 0) {
    throw new AppError("Leccion no encontrada en la materia indicada.", 404);
  }

  const currentLesson = lessons[currentLessonIndex];
  const contentInfo = detectLessonContentType(currentLesson.content);

  return {
    statusCode: 200,
    message: "Leccion obtenida correctamente.",
    data: {
      subject: {
        _id: subject._id,
        name: subject.name,
        description: subject.description,
      },
      lesson: {
        _id: currentLesson._id,
        title: currentLesson.title,
        content: currentLesson.content,
        contentType: contentInfo.type,
        videoUrl: contentInfo.videoUrl,
      },
      lessons: lessons.map((lesson, index) => ({
        _id: lesson._id,
        title: lesson.title,
        position: index + 1,
      })),
      currentLessonIndex,
      totalLessons: lessons.length,
    },
  };
}

module.exports = {
  getSubjects,
  getSubjectById,
  getSubjectLesson,
};
