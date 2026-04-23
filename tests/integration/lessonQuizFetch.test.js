const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Classroom = require("../../models/Classroom");
const Question = require("../../models/Question");
const Quiz = require("../../models/Quiz");

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

describe("Lesson quiz fetch integration", () => {
  test("GET /api/student/subjects/:subjectId/lessons/:lessonId/quiz devuelve preguntas sin correctOption", async () => {
    const student = await User.create({
      name: "Alumno Quiz Fetch",
      email: "quiz.fetch@example.com",
      password: "Password123",
      role: "student",
    });

    const lessonId = new mongoose.Types.ObjectId();
    const subject = await Subject.create({
      name: "Inglés",
      color: "#22A699",
      icon: "language",
      description: "Materia para validar lectura de quiz por leccion.",
      lessons: [
        {
          _id: lessonId,
          title: "Simple Present",
          content: "Contenido base para simple present.",
        },
      ],
    });

    await Classroom.create({
      institutionId: student.institutionId,
      subjectId: subject._id,
      teacherId: student._id,
      courseName: "1102",
      classCode: "CLQUIZ001",
      studentIds: [student._id],
    });

    const q1 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Select the correct sentence",
      options: ["He go to school", "He goes to school", "He going school"],
      correctOption: 1,
      explanation: "Third person singular uses goes",
    });

    const q2 = await Question.create({
      subjectId: subject._id,
      lessonId,
      prompt: "Choose the correct auxiliary",
      options: ["Do", "Does", "Did"],
      correctOption: 1,
      explanation: "Does is used with he/she/it",
    });

    await Quiz.create({
      subjectId: subject._id,
      lessonId,
      title: "Quiz Simple Present",
      questionIds: [q1._id, q2._id],
      passingScore: 70,
      isActive: true,
    });

    const token = signAccessToken(student._id, "student");

    const response = await request(app)
      .get(`/api/student/subjects/${subject._id}/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.questions).toHaveLength(2);
    expect(response.body.data.questions[0].prompt).toBeTruthy();
    expect(response.body.data.questions[0].options.length).toBeGreaterThan(1);
    expect(response.body.data.questions[0].correctOption).toBeUndefined();
  });
});
