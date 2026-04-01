const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");
const questionRepository = require("../repositories/questionRepository");
const progressRepository = require("../repositories/progressRepository");
const badgeService = require("./badgeService");
const { logger } = require("../config/logger");

const FINAL_CHALLENGE_SIZE = 10;
const GRAND_MASTER_PASSING_SCORE = 80;

function ensureObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${fieldName} tiene formato invalido.`, 400);
  }
}

async function validateSubjectMasteryReadiness(userId, subjectId) {
  const subject = await subjectRepository.findByIdLean(subjectId);
  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const totalLessons = subject.lessons.length;
  if (totalLessons === 0) {
    throw new AppError("La materia no tiene lecciones registradas.", 400);
  }

  const [completedLessons, masteredLessons] = await Promise.all([
    progressRepository.countCompletedLessonsBySubject(userId, subjectId),
    progressRepository.countMasteredLessonsBySubject(userId, subjectId),
  ]);

  if (completedLessons < totalLessons || masteredLessons < totalLessons) {
    throw new AppError("El examen final solo se habilita con 100% completado y todas las lecciones en mastered.", 403);
  }

  return subject;
}

function sanitizeQuestions(questions) {
  return questions.map((question) => ({
    id: question._id,
    prompt: question.prompt,
    options: question.options,
    explanation: question.explanation,
  }));
}

async function getFinalChallenge(userId, subjectId) {
  ensureObjectId(subjectId, "subjectId");

  const subject = await validateSubjectMasteryReadiness(userId, subjectId);

  const questions = await questionRepository.findRandomBySubjectLean(subjectId, FINAL_CHALLENGE_SIZE);
  if (questions.length < FINAL_CHALLENGE_SIZE) {
    throw new AppError("No hay suficientes preguntas para generar el Examen de Gran Maestro.", 400);
  }

  return {
    statusCode: 200,
    message: "Examen de Gran Maestro generado correctamente.",
    data: {
      subjectId,
      subjectName: subject.name,
      totalQuestions: FINAL_CHALLENGE_SIZE,
      questions: sanitizeQuestions(questions),
    },
  };
}

async function submitFinalChallenge(userId, subjectId, answers) {
  ensureObjectId(subjectId, "subjectId");

  if (!Array.isArray(answers) || answers.length !== FINAL_CHALLENGE_SIZE) {
    throw new AppError("Debes enviar exactamente 10 respuestas para el Examen de Gran Maestro.", 400);
  }

  const subject = await validateSubjectMasteryReadiness(userId, subjectId);

  const answerMap = new Map();
  for (const answer of answers) {
    if (!answer?.questionId || !Number.isInteger(answer.selectedOption)) {
      continue;
    }
    answerMap.set(String(answer.questionId), answer.selectedOption);
  }

  const questionIds = Array.from(answerMap.keys());
  const questions = await questionRepository.findByIdsAndSubjectLean(questionIds, subjectId);
  if (questions.length !== FINAL_CHALLENGE_SIZE) {
    throw new AppError("Las respuestas no corresponden a 10 preguntas validas de la materia.", 400);
  }

  let correctAnswers = 0;
  for (const question of questions) {
    const selectedOption = answerMap.get(String(question._id));
    if (selectedOption === question.correctOption) {
      correctAnswers += 1;
    }
  }

  const score = Math.round((correctAnswers / FINAL_CHALLENGE_SIZE) * 100);
  const passed = score >= GRAND_MASTER_PASSING_SCORE;

  let badge = null;
  if (passed) {
    const badgeResult = await badgeService.awardGrandMasterBadge(userId, subject);
    badge = badgeResult.badge;
  }

  logger.info({
    event: "final_challenge_submitted",
    userId,
    subjectId,
    score,
    passed,
  });

  return {
    statusCode: 200,
    message: passed
      ? "Examen aprobado. Medalla de Gran Maestro otorgada."
      : "Examen reprobado. Intenta de nuevo para alcanzar la medalla de Gran Maestro.",
    data: {
      score,
      passed,
      correctAnswers,
      totalQuestions: FINAL_CHALLENGE_SIZE,
      grandMasterBadge: badge ? badge.nombre : null,
    },
  };
}

module.exports = {
  getFinalChallenge,
  submitFinalChallenge,
};
