const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const classroomRepository = require("../repositories/classroomRepository");
const subjectRepository = require("../repositories/subjectRepository");

function randomAlphaNumeric(size) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < size; index += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}

function normalizeCourseName(value) {
  return (value || "").trim();
}

function normalizeClassCode(value) {
  return (value || "").trim().toUpperCase();
}

async function generateUniqueClassCode() {
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const candidate = `CL${randomAlphaNumeric(8)}`;
    const existing = await classroomRepository.findByClassCodeLean(candidate);

    if (!existing) {
      return candidate;
    }
  }

  throw new AppError("No se pudo generar un classCode unico. Intenta nuevamente.", 500);
}

function validateInstitutionContext(user) {
  if (!user?.institutionId) {
    throw new AppError("El usuario no tiene institucion asociada.", 400);
  }
}

async function createClassroom(teacherUser, payload) {
  validateInstitutionContext(teacherUser);

  const { subjectId, courseName } = payload;
  const normalizedCourseName = normalizeCourseName(courseName);

  if (!subjectId || !normalizedCourseName) {
    throw new AppError("subjectId y courseName son obligatorios.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new AppError("subjectId invalido.", 400);
  }

  const subject = await subjectRepository.findByIdLean(subjectId);
  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const classCode = await generateUniqueClassCode();

  let createdClassroom;
  try {
    createdClassroom = await classroomRepository.createClassroom({
      institutionId: teacherUser.institutionId,
      subjectId,
      teacherId: teacherUser.id,
      courseName: normalizedCourseName,
      classCode,
      studentIds: [],
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("Ya existe un curso con esta materia y nombre para este docente.", 409);
    }

    throw error;
  }

  return {
    statusCode: 201,
    message: "Curso creado correctamente.",
    data: {
      id: createdClassroom._id,
      subjectId: subject._id,
      subjectName: subject.name,
      courseName: createdClassroom.courseName,
      classCode: createdClassroom.classCode,
      studentCount: 0,
      createdAt: createdClassroom.createdAt,
    },
  };
}

async function listTeacherClassrooms(teacherUser) {
  validateInstitutionContext(teacherUser);

  const classrooms = await classroomRepository.findByTeacherLean(
    teacherUser.id,
    teacherUser.institutionId
  );

  const subjectIds = [...new Set(classrooms.map((row) => String(row.subjectId)))];
  const subjects = await subjectRepository.findManyByIdsLean(subjectIds);
  const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));

  const data = classrooms.map((row) => {
    const subject = subjectMap.get(String(row.subjectId));

    return {
      id: row._id,
      subjectId: row.subjectId,
      subjectName: subject?.name || "Materia",
      courseName: row.courseName,
      classCode: row.classCode,
      studentCount: Array.isArray(row.studentIds) ? row.studentIds.length : 0,
      isActive: !!row.isActive,
      createdAt: row.createdAt,
    };
  });

  return {
    statusCode: 200,
    message: "Cursos del docente obtenidos correctamente.",
    data,
  };
}

async function enrollStudentByClassCode(studentUser, payload) {
  validateInstitutionContext(studentUser);

  const normalizedClassCode = normalizeClassCode(payload?.classCode);
  if (!normalizedClassCode) {
    throw new AppError("classCode es obligatorio.", 400);
  }

  const classroom = await classroomRepository.findByClassCodeLean(normalizedClassCode);
  if (!classroom || !classroom.isActive) {
    throw new AppError("ClassCode no valido o inactivo.", 404);
  }

  if (String(classroom.institutionId) !== String(studentUser.institutionId)) {
    throw new AppError(
      "No puedes inscribirte en una materia de otra institucion, aunque tengas el classCode.",
      403
    );
  }

  const alreadyEnrolled = (classroom.studentIds || [])
    .some((studentId) => String(studentId) === String(studentUser.id));

  const updatedClassroom = alreadyEnrolled
    ? classroom
    : await classroomRepository.addStudentToClassroom(classroom._id, studentUser.id);

  const subject = await subjectRepository.findByIdLean(updatedClassroom.subjectId);

  return {
    statusCode: 200,
    message: alreadyEnrolled
      ? "Ya estabas inscrito en esta materia."
      : "Inscripcion realizada correctamente.",
    data: {
      classId: updatedClassroom._id,
      classCode: updatedClassroom.classCode,
      courseName: updatedClassroom.courseName,
      subjectId: updatedClassroom.subjectId,
      subjectName: subject?.name || "Materia",
      alreadyEnrolled,
    },
  };
}

async function getEnrolledSubjectIds(studentUser) {
  validateInstitutionContext(studentUser);

  const classrooms = await classroomRepository.findByStudentLean(
    studentUser.id,
    studentUser.institutionId
  );

  return [...new Set(classrooms.map((row) => String(row.subjectId)))];
}

async function ensureStudentEnrollmentForSubject(studentUser, subjectId) {
  if (studentUser?.role !== "student") {
    return;
  }

  validateInstitutionContext(studentUser);

  const enrollment = await classroomRepository.findByStudentAndSubjectLean(studentUser.id, subjectId);
  if (!enrollment) {
    throw new AppError(
      "Debes inscribirte a esta materia con un classCode valido para poder acceder.",
      403
    );
  }

  if (String(enrollment.institutionId) !== String(studentUser.institutionId)) {
    throw new AppError("Inscripcion invalida para tu institucion.", 403);
  }
}

module.exports = {
  createClassroom,
  listTeacherClassrooms,
  enrollStudentByClassCode,
  getEnrolledSubjectIds,
  ensureStudentEnrollmentForSubject,
};
