const userRepository = require("../repositories/userRepository");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");

function buildTeacherLessonMap(subjects) {
  const lessonTeacherMap = new Map();
  const lessonInfoMap = new Map();

  for (const subject of subjects) {
    for (const lesson of subject.lessons) {
      const lessonId = String(lesson._id);
      if (lesson.teacherId) {
        lessonTeacherMap.set(lessonId, String(lesson.teacherId));
      }

      lessonInfoMap.set(`${subject._id}-${lesson._id}`, {
        subjectId: subject._id,
        subjectName: subject.name,
        lessonId: lesson._id,
        lessonTitle: lesson.title,
      });
    }
  }

  return {
    lessonTeacherMap,
    lessonInfoMap,
  };
}

async function getTeacherInsights() {
  const [teachers, students, subjects] = await Promise.all([
    userRepository.findByRoleLean("teacher"),
    userRepository.findByRoleLean("student"),
    subjectRepository.findAllWithLessonsLean(),
  ]);

  const studentIds = students.map((student) => student._id);
  const studentProgressRows = await progressRepository.findManyLean({
    userId: { $in: studentIds },
  });

  const { lessonTeacherMap } = buildTeacherLessonMap(subjects);

  const statsByTeacher = new Map();
  for (const teacher of teachers) {
    statsByTeacher.set(String(teacher._id), {
      teacherId: teacher._id,
      teacherName: teacher.name,
      totalAssignedProgress: 0,
      masteredAssignedProgress: 0,
    });
  }

  for (const row of studentProgressRows) {
    const teacherId = lessonTeacherMap.get(String(row.lessonId));
    if (!teacherId || !statsByTeacher.has(teacherId)) {
      continue;
    }

    const teacherStats = statsByTeacher.get(teacherId);
    teacherStats.totalAssignedProgress += 1;
    if (row.mastered) {
      teacherStats.masteredAssignedProgress += 1;
    }
  }

  const insights = Array.from(statsByTeacher.values()).map((item) => {
    const averageMastery = item.totalAssignedProgress === 0
      ? 0
      : Math.round((item.masteredAssignedProgress / item.totalAssignedProgress) * 100);

    return {
      teacherId: item.teacherId,
      teacherName: item.teacherName,
      averageMastery,
      evaluatedProgressRows: item.totalAssignedProgress,
    };
  });

  return {
    statusCode: 200,
    message: "Insights de docentes generados correctamente.",
    data: insights,
  };
}

async function getDifficultLessons() {
  const [subjects, difficultRows] = await Promise.all([
    subjectRepository.findAllWithLessonsLean(),
    progressRepository.aggregateDifficultLessons(),
  ]);

  const { lessonInfoMap } = buildTeacherLessonMap(subjects);

  const result = difficultRows
    .map((row) => {
      const subjectId = row._id.subjectId;
      const lessonId = row._id.lessonId;
      const lessonInfo = lessonInfoMap.get(`${subjectId}-${lessonId}`);

      if (!lessonInfo) {
        return null;
      }

      return {
        subjectId,
        subjectName: lessonInfo.subjectName,
        lessonId,
        lessonTitle: lessonInfo.lessonTitle,
        failRate: Math.round(row.failRate),
        totalAttempts: row.totalAttempts,
        totalFails: row.totalFails,
      };
    })
    .filter(Boolean);

  return {
    statusCode: 200,
    message: "Lecciones con alta dificultad identificadas correctamente.",
    data: result,
  };
}

module.exports = {
  getTeacherInsights,
  getDifficultLessons,
};
