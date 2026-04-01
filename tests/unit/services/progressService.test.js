const AppError = require("../../../utils/appError");

jest.mock("../../../repositories/subjectRepository", () => ({
  findByIdWithLessonsLean: jest.fn(),
}));

jest.mock("../../../repositories/progressRepository", () => ({
  findOneLean: jest.fn(),
  upsertCompletedLesson: jest.fn(),
  countCompletedLessonsBySubject: jest.fn(),
}));

jest.mock("../../../repositories/userRepository", () => ({
  incrementUserPoints: jest.fn(),
  findByIdLean: jest.fn(),
  updateActivityAndStreak: jest.fn(),
}));

jest.mock("../../../repositories/notificationRepository", () => ({
  createNotification: jest.fn(),
}));

jest.mock("../../../services/badgeService", () => ({
  awardSubjectMasterBadge: jest.fn(),
}));

const subjectRepository = require("../../../repositories/subjectRepository");
const progressRepository = require("../../../repositories/progressRepository");
const userRepository = require("../../../repositories/userRepository");
const notificationRepository = require("../../../repositories/notificationRepository");
const badgeService = require("../../../services/badgeService");
const progressService = require("../../../services/progressService");

describe("progressService unit", () => {
  const userId = "507f1f77bcf86cd799439011";
  const subjectId = "507f1f77bcf86cd799439012";
  const lessonId = "507f1f77bcf86cd799439013";

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.findByIdLean.mockResolvedValue({
      _id: userId,
      points: 0,
      currentStreak: 0,
      lastActivity: null,
    });
    userRepository.updateActivityAndStreak.mockResolvedValue({ _id: userId });
    progressRepository.countCompletedLessonsBySubject.mockResolvedValue(0);
    badgeService.awardSubjectMasterBadge.mockResolvedValue({ awarded: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("marca lección, suma 10 puntos y crea notificación al primer completado", async () => {
    subjectRepository.findByIdWithLessonsLean.mockResolvedValue({
      _id: subjectId,
      name: "Matemáticas",
      icon: "calculator",
      lessons: [{ _id: lessonId }],
    });
    progressRepository.findOneLean.mockResolvedValue(null);
    progressRepository.upsertCompletedLesson.mockResolvedValue({
      userId,
      subjectId,
      lessonId,
      completed: true,
    });

    const result = await progressService.completeLesson(userId, { subjectId, lessonId });

    expect(result.statusCode).toBe(200);
    expect(result.message).toMatch(/\+10 puntos/);
    expect(progressRepository.upsertCompletedLesson).toHaveBeenCalledWith(userId, subjectId, lessonId);
    expect(userRepository.incrementUserPoints).toHaveBeenCalledWith(userId, 10);
    expect(userRepository.updateActivityAndStreak).toHaveBeenCalledTimes(1);
    expect(notificationRepository.createNotification).toHaveBeenCalledTimes(1);
  });

  test("si ya existía progreso, no vuelve a sumar puntos ni crear notificación", async () => {
    subjectRepository.findByIdWithLessonsLean.mockResolvedValue({
      _id: subjectId,
      name: "Matemáticas",
      icon: "calculator",
      lessons: [{ _id: lessonId }],
    });
    progressRepository.findOneLean.mockResolvedValue({
      userId,
      subjectId,
      lessonId,
      completed: true,
    });
    progressRepository.upsertCompletedLesson.mockResolvedValue({
      userId,
      subjectId,
      lessonId,
      completed: true,
    });

    const result = await progressService.completeLesson(userId, { subjectId, lessonId });

    expect(result.statusCode).toBe(200);
    expect(result.message).toBe("Leccion marcada como completada.");
    expect(userRepository.incrementUserPoints).not.toHaveBeenCalled();
    expect(notificationRepository.createNotification).not.toHaveBeenCalled();
  });

  test("lanza AppError 400 cuando faltan subjectId o lessonId", async () => {
    await expect(progressService.completeLesson(userId, { subjectId })).rejects.toEqual(
      expect.objectContaining({
        name: "AppError",
        statusCode: 400,
      })
    );
  });

  test("lanza AppError 404 cuando no existe la materia", async () => {
    subjectRepository.findByIdWithLessonsLean.mockResolvedValue(null);

    await expect(progressService.completeLesson(userId, { subjectId, lessonId })).rejects.toEqual(
      expect.objectContaining({
        name: "AppError",
        statusCode: 404,
      })
    );
  });

  test("lanza AppError 404 cuando la lección no pertenece a la materia", async () => {
    subjectRepository.findByIdWithLessonsLean.mockResolvedValue({
      _id: subjectId,
      name: "Matemáticas",
      icon: "calculator",
      lessons: [{ _id: "507f1f77bcf86cd799439099" }],
    });

    await expect(progressService.completeLesson(userId, { subjectId, lessonId })).rejects.toEqual(
      expect.objectContaining({
        name: "AppError",
        statusCode: 404,
      })
    );
  });

  test("lanza AppError cuando IDs tienen formato inválido", async () => {
    await expect(progressService.completeLesson(userId, { subjectId: "123", lessonId: "456" })).rejects.toBeInstanceOf(AppError);
  });

  test("si la ultima actividad fue ayer aumenta la racha y aplica bono al multiplo de 7", async () => {
    const now = new Date("2026-03-31T10:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);

    userRepository.findByIdLean.mockResolvedValue({
      _id: userId,
      points: 100,
      currentStreak: 6,
      lastActivity: new Date("2026-03-30T08:00:00.000Z"),
    });

    subjectRepository.findByIdWithLessonsLean.mockResolvedValue({
      _id: subjectId,
      name: "Matemáticas",
      icon: "calculator",
      lessons: [{ _id: lessonId }],
    });
    progressRepository.findOneLean.mockResolvedValue(null);
    progressRepository.upsertCompletedLesson.mockResolvedValue({ userId, subjectId, lessonId, completed: true });

    const result = await progressService.completeLesson(userId, { subjectId, lessonId });

    expect(result.message).toMatch(/bono por racha/);
    expect(userRepository.incrementUserPoints).toHaveBeenCalledWith(userId, 30);
    expect(userRepository.updateActivityAndStreak).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ currentStreak: 7 })
    );

  });

  test("si la ultima actividad es del mismo dia mantiene la racha", () => {
    const now = new Date("2026-03-31T18:00:00.000Z");
    const outcome = progressService.calculateStreakOutcome(new Date("2026-03-31T01:00:00.000Z"), 4, now);

    expect(outcome.newStreak).toBe(4);
    expect(outcome.shouldAwardStreakBonus).toBe(false);
  });

  test("si pasaron mas de 48h reinicia la racha en 1", () => {
    const now = new Date("2026-03-31T18:00:00.000Z");
    const outcome = progressService.calculateStreakOutcome(new Date("2026-03-28T10:00:00.000Z"), 9, now);

    expect(outcome.newStreak).toBe(1);
    expect(outcome.shouldAwardStreakBonus).toBe(false);
  });
});
