const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Institution = require("../../models/Institution");
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

describe("Institution + classCode integration", () => {
  test("bloquea inscripcion cruzada entre instituciones y permite inscripcion local", async () => {
    const institutionA = await Institution.create({
      name: "Colegio A",
      adminUsername: "colegio.a",
      legalId: "NIT-1001",
      licenseStatus: "active",
    });

    const institutionB = await Institution.create({
      name: "Colegio B",
      adminUsername: "colegio.b",
      legalId: "NIT-1002",
      licenseStatus: "active",
    });

    const teacherB = await User.create({
      name: "Docente B",
      email: "teacher.b@example.com",
      password: "Password123",
      role: "teacher",
      institutionId: institutionB._id,
      institutionAdminReference: "colegio.b",
      dni: "DOC-B-001",
      isInstitutionValidated: true,
    });

    const studentA = await User.create({
      name: "Estudiante A",
      email: "student.a@example.com",
      password: "Password123",
      role: "student",
      institutionId: institutionA._id,
      institutionAdminReference: "colegio.a",
      dni: "STD-A-001",
      isInstitutionValidated: true,
    });

    const studentB = await User.create({
      name: "Estudiante B",
      email: "student.b@example.com",
      password: "Password123",
      role: "student",
      institutionId: institutionB._id,
      institutionAdminReference: "colegio.b",
      dni: "STD-B-001",
      isInstitutionValidated: true,
    });

    const subject = await Subject.create({
      name: "Arte y Creatividad",
      color: "#1E88E5",
      icon: "palette",
      description: "Materia para validar classCode entre instituciones.",
      lessons: [
        {
          title: "Color y composicion",
          content: "Leccion inicial de arte para pruebas de enrollment.",
          teacherId: teacherB._id,
        },
      ],
    });

    const teacherToken = signAccessToken(teacherB._id, "teacher");
    const createClassResponse = await request(app)
      .post("/api/teacher/classes")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        subjectId: subject._id,
        courseName: "1102",
      });

    expect(createClassResponse.statusCode).toBe(201);
    expect(createClassResponse.body.success).toBe(true);
    expect(createClassResponse.body.data.classCode).toBeTruthy();

    const classCode = createClassResponse.body.data.classCode;

    const studentAToken = signAccessToken(studentA._id, "student");
    const forbiddenEnroll = await request(app)
      .post("/api/student/classes/enroll")
      .set("Authorization", `Bearer ${studentAToken}`)
      .send({ classCode });

    expect(forbiddenEnroll.statusCode).toBe(403);
    expect(forbiddenEnroll.body.success).toBe(false);

    const studentBToken = signAccessToken(studentB._id, "student");
    const successfulEnroll = await request(app)
      .post("/api/student/classes/enroll")
      .set("Authorization", `Bearer ${studentBToken}`)
      .send({ classCode });

    expect(successfulEnroll.statusCode).toBe(200);
    expect(successfulEnroll.body.success).toBe(true);

    const subjectsResponse = await request(app)
      .get("/api/student/subjects")
      .set("Authorization", `Bearer ${studentBToken}`);

    expect(subjectsResponse.statusCode).toBe(200);
    expect(Array.isArray(subjectsResponse.body.data)).toBe(true);
    expect(subjectsResponse.body.data).toHaveLength(1);
    expect(String(subjectsResponse.body.data[0]._id)).toBe(String(subject._id));
  });
});
