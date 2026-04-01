const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");

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

function signAccessToken(userId, role) {
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

describe("Feedback integration flow", () => {
  test("supervisor crea feedback y docente lo recupera en /api/teacher/my-feedback", async () => {
    const teacher = await User.create({
      name: "Teacher Feedback",
      email: "teacher.feedback@example.com",
      password: "Password123",
      role: "teacher",
    });

    const supervisor = await User.create({
      name: "Supervisor Feedback",
      email: "supervisor.feedback@example.com",
      password: "Password123",
      role: "supervisor",
    });

    const lessonId = new mongoose.Types.ObjectId();
    await Subject.create({
      name: "Inglés",
      color: "#00897B",
      icon: "language",
      description: "Materia para flujo de feedback.",
      lessons: [
        {
          _id: lessonId,
          teacherId: teacher._id,
          title: "Present simple",
          content: "Leccion sobre estructura afirmativa y negativa.",
        },
      ],
    });

    const supervisorToken = signAccessToken(supervisor._id, "supervisor");
    const teacherToken = signAccessToken(teacher._id, "teacher");

    const createFeedbackResponse = await request(app)
      .post(`/api/supervisor/lessons/${lessonId}/feedback`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        content: "Reforzar ejemplos de uso en contexto real y agregar ejercicios orales.",
      });

    expect(createFeedbackResponse.statusCode).toBe(201);
    expect(createFeedbackResponse.body.success).toBe(true);

    const teacherFeedbackResponse = await request(app)
      .get("/api/teacher/my-feedback")
      .set("Authorization", `Bearer ${teacherToken}`);

    expect(teacherFeedbackResponse.statusCode).toBe(200);
    expect(teacherFeedbackResponse.body.success).toBe(true);
    expect(Array.isArray(teacherFeedbackResponse.body.data)).toBe(true);
    expect(teacherFeedbackResponse.body.data.length).toBe(1);
    expect(teacherFeedbackResponse.body.data[0].content).toMatch(/Reforzar ejemplos/);
    expect(String(teacherFeedbackResponse.body.data[0].teacherId)).toBe(String(teacher._id));
    expect(String(teacherFeedbackResponse.body.data[0].supervisorId)).toBe(String(supervisor._id));
  });
});
