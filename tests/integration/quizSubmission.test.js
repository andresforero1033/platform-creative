const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Question = require("../../models/Question");
const Quiz = require("../../models/Quiz");
const Progress = require("../../models/Progress");

let mongoServer;
let app;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "integration_access_secret";
  process.env.JWT_REFRESH_SECRET = "integration_refresh_secret";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const createApp = require("../../app");
  app = createApp();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  const names = Object.keys(collections);

  for (const name of names) {
    await collections[name].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

function signAccessToken(userId, role = "student") {
  return jwt.sign(
    {
      sub: String(userId),
      role,
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

describe("Quiz submission integration", () => {
  test("aprueba quiz y marca la leccion como mastered cuando score > 70", async () => {
    const user = await User.create({
      name: "Alumno Quiz Aprobado",
      email: "quiz.aprobado@example.com",
      password: "Password123",
      role: "student",
    });

    const lessonId = new mongoose.Types.ObjectId();
    const subject = await Subject.create({
      name: "Matemáticas",
      color: "#E53935",
      icon: "calculator",
      description: "Materia para validar quizzes.",
      lessons: [
        {
          _id: lessonId,
          title: "Fracciones basicas",
          content: "Contenido de fracciones con ejemplos claros.",
        },
      ],
    });

    const q1 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Cuanto es 2 + 2?",
      options: ["3", "4", "5"],
      correctOption: 1,
    });

    const q2 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Cuanto es 10 / 2?",
      options: ["2", "5", "8"],
      correctOption: 1,
    });

    const q3 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Cuanto es 9 - 4?",
      options: ["3", "5", "7"],
      correctOption: 1,
    });

    await Quiz.create({
      subjectId: subject._id,
      lessonId,
      title: "Quiz de fracciones",
      questionIds: [q1._id, q2._id, q3._id],
      passingScore: 70,
      isActive: true,
    });

    const token = signAccessToken(user._id, "student");

    const response = await request(app)
      .post(`/api/student/subjects/${subject._id}/lessons/${lessonId}/quiz/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answers: [
          { questionId: q1._id, selectedOption: 1 },
          { questionId: q2._id, selectedOption: 1 },
          { questionId: q3._id, selectedOption: 1 },
        ],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.score).toBe(100);
    expect(response.body.data.mastered).toBe(true);

    const progress = await Progress.findOne({
      userId: user._id,
      subjectId: subject._id,
      lessonId,
    }).lean();

    expect(progress).toBeTruthy();
    expect(progress.mastered).toBe(true);
    expect(progress.lastQuizScore).toBe(100);
  });

  test("reprueba quiz y no marca mastered cuando score <= 70", async () => {
    const user = await User.create({
      name: "Alumno Quiz Reprobado",
      email: "quiz.reprobado@example.com",
      password: "Password123",
      role: "student",
    });

    const lessonId = new mongoose.Types.ObjectId();
    const subject = await Subject.create({
      name: "Español",
      color: "#1E88E5",
      icon: "book",
      description: "Materia para validar quiz reprobado.",
      lessons: [
        {
          _id: lessonId,
          title: "Comprension lectora",
          content: "Analisis de texto corto y preguntas guiadas.",
        },
      ],
    });

    const q1 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Sinonimo de rapido",
      options: ["lento", "veloz", "quieto"],
      correctOption: 1,
    });

    const q2 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Antonimo de grande",
      options: ["pequeno", "alto", "ancho"],
      correctOption: 0,
    });

    const q3 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Palabra aguda",
      options: ["casa", "arbol", "cafe"],
      correctOption: 2,
    });

    await Quiz.create({
      subjectId: subject._id,
      lessonId,
      title: "Quiz de lectura",
      questionIds: [q1._id, q2._id, q3._id],
      passingScore: 70,
      isActive: true,
    });

    const token = signAccessToken(user._id, "student");

    const response = await request(app)
      .post(`/api/student/subjects/${subject._id}/lessons/${lessonId}/quiz/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answers: [
          { questionId: q1._id, selectedOption: 1 },
          { questionId: q2._id, selectedOption: 1 },
          { questionId: q3._id, selectedOption: 1 },
        ],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.score).toBe(33);
    expect(response.body.data.mastered).toBe(false);

    const progress = await Progress.findOne({
      userId: user._id,
      subjectId: subject._id,
      lessonId,
    }).lean();

    expect(progress).toBeTruthy();
    expect(progress.mastered).toBe(false);
    expect(progress.lastQuizScore).toBe(33);
  });
});
