const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Classroom = require("../../models/Classroom");
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

describe("Spaced repetition integration", () => {
  test("al fallar quiz se calcula nextReviewDate en aproximadamente hoy + 2 dias", async () => {
    const user = await User.create({
      name: "Alumno Repaso",
      email: "repaso@example.com",
      password: "Password123",
      role: "student",
    });

    const lessonId = new mongoose.Types.ObjectId();
    const subject = await Subject.create({
      name: "Ciencias Sociales",
      color: "#5E35B1",
      icon: "globe",
      description: "Materia para validar repeticion espaciada.",
      lessons: [
        {
          _id: lessonId,
          title: "Historia local",
          content: "Leccion de historia con eventos claves.",
        },
      ],
    });

    await Classroom.create({
      institutionId: user.institutionId,
      subjectId: subject._id,
      teacherId: user._id,
      courseName: "1301",
      classCode: "CLSRS001",
      studentIds: [user._id],
    });

    const q1 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Capital del pais?",
      options: ["A", "B", "C"],
      correctOption: 0,
    });

    const q2 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Siglo de independencia?",
      options: ["XV", "XIX", "XX"],
      correctOption: 1,
    });

    const q3 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Simbolo patrio principal?",
      options: ["Bandera", "Reloj", "Escalera"],
      correctOption: 0,
    });

    await Quiz.create({
      subjectId: subject._id,
      lessonId,
      title: "Quiz historia",
      questionIds: [q1._id, q2._id, q3._id],
      passingScore: 70,
      isActive: true,
    });

    const token = signAccessToken(user._id, "student");
    const beforeSubmit = Date.now();

    const response = await request(app)
      .post(`/api/student/subjects/${subject._id}/lessons/${lessonId}/quiz/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answers: [
          { questionId: q1._id, selectedOption: 2 },
          { questionId: q2._id, selectedOption: 2 },
          { questionId: q3._id, selectedOption: 2 },
        ],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.passed).toBe(false);

    const progress = await Progress.findOne({
      userId: user._id,
      subjectId: subject._id,
      lessonId,
    }).lean();

    expect(progress).toBeTruthy();
    expect(progress.nextReviewDate).toBeTruthy();

    const reviewDate = new Date(progress.nextReviewDate).getTime();
    const minExpected = beforeSubmit + (2 * 24 * 60 * 60 * 1000) - (2 * 60 * 1000);
    const maxExpected = beforeSubmit + (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 1000);

    expect(reviewDate).toBeGreaterThanOrEqual(minExpected);
    expect(reviewDate).toBeLessThanOrEqual(maxExpected);
  });
});
