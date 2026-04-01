const AppError = require("../../../utils/appError");

jest.mock("../../../repositories/subjectRepository", () => ({
  findByIdWithLessonsLean: jest.fn(),
}));

jest.mock("../../../repositories/progressRepository", () => ({
  findOneLean: jest.fn(),
  upsertCompletedLesson: jest.fn(),
}));

jest.mock("../../../repositories/userRepository", () => ({
  incrementUserPoints: jest.fn(),
}));

jest.mock("../../../repositories/notificationRepository", () => ({
  createNotification: jest.fn(),
}));

const subjectRepository = require("../../../repositories/subjectRepository");
const progressRepository = require("../../../repositories/progressRepository");
const userRepository = require("../../../repositories/userRepository");
const notificationRepository = require("../../../repositories/notificationRepository");
const progressService = require("../../../services/progressService");

describe("progressService unit", () => {
  const userId = "507f1f77bcf86cd799439011";
  const subjectId = "507f1f77bcf86cd799439012";
  const lessonId = "507f1f77bcf86cd799439013";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("marca lección, suma 10 puntos y crea notificación al primer completado", async () => {
    subjectRepository.findByIdWithLessonsLean.mockResolvedValue({
      _id: subjectId,
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
    expect(notificationRepository.createNotification).toHaveBeenCalledTimes(1);
  });

  test("si ya existía progreso, no vuelve a sumar puntos ni crear notificación", async () => {
    subjectRepository.findByIdWithLessonsLean.mockResolvedValue({
      _id: subjectId,
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
});
