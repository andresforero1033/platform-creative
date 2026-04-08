const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
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

describe("Parent and Admin dashboards", () => {
  test("GET /api/parent/dashboard devuelve progreso real de hijos vinculados", async () => {
    const student = await User.create({
      name: "Hija Uno",
      email: "hija.uno@example.com",
      password: "Password123",
      role: "student",
      badges: [
        {
          badgeId: new mongoose.Types.ObjectId(),
          nombre: "Insignia Inicial",
          awardedAt: new Date(),
        },
      ],
    });

    const parent = await User.create({
      name: "Padre Uno",
      email: "padre.uno@example.com",
      password: "Password123",
      role: "parent",
      childrenIds: [student._id],
    });

    const lessonA = new mongoose.Types.ObjectId();
    const lessonB = new mongoose.Types.ObjectId();

    const subject = await Subject.create({
      name: "Matemáticas",
      color: "#1677FF",
      icon: "math",
      description: "Materia para pruebas de dashboard parental.",
      lessons: [
        {
          _id: lessonA,
          title: "Suma basica",
          content: "Contenido de suma basica para evaluar progreso.",
        },
        {
          _id: lessonB,
          title: "Resta basica",
          content: "Contenido de resta basica para evaluar progreso.",
        },
      ],
    });

    await Progress.create({
      userId: student._id,
      subjectId: subject._id,
      lessonId: lessonA,
      completed: true,
      mastered: true,
      nextReviewDate: new Date(Date.now() + (24 * 60 * 60 * 1000)),
      reviewLevel: 2,
      quizAttempts: 1,
      quizPassCount: 1,
      quizFailCount: 0,
    });

    await Progress.create({
      userId: student._id,
      subjectId: subject._id,
      lessonId: lessonB,
      completed: true,
      mastered: false,
      nextReviewDate: null,
      reviewLevel: 0,
      quizAttempts: 1,
      quizPassCount: 0,
      quizFailCount: 1,
    });

    const token = signAccessToken(parent._id, "parent");

    const response = await request(app)
      .get("/api/parent/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.linkedChildren).toBe(1);
    expect(response.body.data.summary.subjectsInProgress).toBe(1);
    expect(response.body.data.summary.completedSubjects).toBe(0);
    expect(response.body.data.summary.averageMastery).toBe(50);
    expect(response.body.data.children).toHaveLength(1);
    expect(response.body.data.progressBySubject).toHaveLength(1);
    expect(response.body.data.nextReview).toBeTruthy();
  });

  test("GET /api/admin/users-by-role devuelve metricas agregadas por rol", async () => {
    const admin = await User.create({
      name: "Admin Uno",
      email: "admin.uno@example.com",
      password: "Password123",
      role: "admin",
    });

    await User.create({
      name: "Teacher Uno",
      email: "teacher.uno@example.com",
      password: "Password123",
      role: "teacher",
    });

    await User.create({
      name: "Parent Dos",
      email: "parent.dos@example.com",
      password: "Password123",
      role: "parent",
    });

    await User.create({
      name: "Student Uno",
      email: "student.uno@example.com",
      password: "Password123",
      role: "student",
    });

    await User.create({
      name: "Student Dos",
      email: "student.dos@example.com",
      password: "Password123",
      role: "student",
    });

    const token = signAccessToken(admin._id, "admin");

    const response = await request(app)
      .get("/api/admin/users-by-role")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.totalUsers).toBe(5);
    expect(response.body.data.byRole.admin).toBe(1);
    expect(response.body.data.byRole.teacher).toBe(1);
    expect(response.body.data.byRole.parent).toBe(1);
    expect(response.body.data.byRole.student).toBe(2);
  });
});
