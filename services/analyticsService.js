const AppError = require("../utils/appError");
const userRepository = require("../repositories/userRepository");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");

async function getStudentSummary(studentId) {
  if (!studentId) {
    throw new AppError("studentId es obligatorio.", 400);
  }

  const [user, subjects, completedBySubject] = await Promise.all([
    userRepository.findByIdLean(studentId),
    subjectRepository.findAllWithLessonsLean(),
    progressRepository.aggregateCompletedLessonsBySubject(studentId),
  ]);

  if (!user) {
    throw new AppError("Estudiante no encontrado.", 404);
  }

  const completedMap = new Map(
    completedBySubject.map((item) => [String(item._id), item.completedLessons])
  );

  let completedSubjects = 0;
  for (const subject of subjects) {
    const totalLessons = subject.lessons.length;
    if (totalLessons === 0) {
      continue;
    }

    const done = completedMap.get(String(subject._id)) || 0;
    if (done >= totalLessons) {
      completedSubjects += 1;
    }
  }

  const subjectsWithLessons = subjects.filter((subject) => subject.lessons.length > 0).length;
  const completedSubjectsPercentage = subjectsWithLessons === 0
    ? 0
    : Math.round((completedSubjects / subjectsWithLessons) * 100);

  let favoriteSubject = null;
  if (completedBySubject.length > 0) {
    const favoriteId = String(completedBySubject[0]._id);
    const favorite = subjects.find((subject) => String(subject._id) === favoriteId);
    favoriteSubject = favorite ? favorite.name : null;
  }

  return {
    statusCode: 200,
    message: "Resumen del estudiante obtenido correctamente.",
    data: {
      totalPoints: user.points || 0,
      completedSubjectsPercentage,
      favoriteSubject,
    },
  };
}

module.exports = {
  getStudentSummary,
};
