const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Classroom = require("../../models/Classroom");

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

describe("Lesson endpoint integration", () => {
  test("GET /api/student/subjects/:subjectId/lessons/:lessonId devuelve leccion y lista lateral", async () => {
    const student = await User.create({
      name: "Alumno Aula",
      email: "alumno.aula@example.com",
      password: "Password123",
      role: "student",
    });

    const lesson1Id = new mongoose.Types.ObjectId();
    const lesson2Id = new mongoose.Types.ObjectId();

    const subject = await Subject.create({
      name: "Español",
      color: "#6D4EFF",
      icon: "book",
      description: "Materia para validar visualizacion de lecciones.",
      lessons: [
        {
          _id: lesson1Id,
          title: "Comprension lectora 1",
          content: "Texto de prueba para la primera leccion.",
        },
        {
          _id: lesson2Id,
          title: "Comprension lectora 2",
          content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ],
    });

    await Classroom.create({
      institutionId: student.institutionId,
      subjectId: subject._id,
      teacherId: student._id,
      courseName: "1001",
      classCode: "CLLESSON01",
      studentIds: [student._id],
    });

    const token = signAccessToken(student._id, "student");

    const response = await request(app)
      .get(`/api/student/subjects/${subject._id}/lessons/${lesson1Id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.subject._id.toString()).toBe(subject._id.toString());
    expect(response.body.data.lesson._id.toString()).toBe(lesson1Id.toString());
    expect(response.body.data.lesson.contentType).toBe("text");
    expect(response.body.data.lessons).toHaveLength(2);
    expect(response.body.data.currentLessonIndex).toBe(0);
    expect(response.body.data.totalLessons).toBe(2);
  });
});
