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

describe("Notification center integration", () => {
  test("admin puede enviar mensaje global y usuarios consultan/actualizan notificaciones", async () => {
    const admin = await User.create({
      name: "Admin Alertas",
      email: "admin.alertas@example.com",
      password: "Password123",
      role: "admin",
    });

    const student = await User.create({
      name: "Student Alertas",
      email: "student.alertas@example.com",
      password: "Password123",
      role: "student",
    });

    await User.create({
      name: "Parent Alertas",
      email: "parent.alertas@example.com",
      password: "Password123",
      role: "parent",
      childrenIds: [student._id],
    });

    const adminToken = signAccessToken(admin._id, "admin");
    const studentToken = signAccessToken(student._id, "student");

    const broadcastResponse = await request(app)
      .post("/api/admin/broadcast-message")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Mantenimiento",
        message: "Hoy tendremos mantenimiento breve en la noche.",
      });

    expect(broadcastResponse.statusCode).toBe(200);
    expect(broadcastResponse.body.success).toBe(true);
    expect(broadcastResponse.body.data.recipients).toBe(3);

    const listResponse = await request(app)
      .get("/api/notifications/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.notifications.length).toBeGreaterThan(0);

    const firstNotification = listResponse.body.data.notifications[0];
    expect(firstNotification.read).toBe(false);
    expect(firstNotification.metadata.eventName).toBe("global_message");

    const markReadResponse = await request(app)
      .patch(`/api/notifications/${firstNotification._id}/read`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(markReadResponse.statusCode).toBe(200);
    expect(markReadResponse.body.data.read).toBe(true);

    const markAllResponse = await request(app)
      .patch("/api/notifications/me/read-all")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(markAllResponse.statusCode).toBe(200);
    expect(markAllResponse.body.success).toBe(true);
  });

  test("usuario no admin no puede enviar broadcast global", async () => {
    const student = await User.create({
      name: "Student sin permiso",
      email: "student.sinpermiso@example.com",
      password: "Password123",
      role: "student",
    });

    const studentToken = signAccessToken(student._id, "student");

    const response = await request(app)
      .post("/api/admin/broadcast-message")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "Intento",
        message: "No deberia pasar",
      });

    expect(response.statusCode).toBe(403);
  });

  test("al crear leccion docente se genera notificacion new_lesson para estudiantes", async () => {
    const teacher = await User.create({
      name: "Teacher Noti",
      email: "teacher.noti@example.com",
      password: "Password123",
      role: "teacher",
    });

    const student = await User.create({
      name: "Student Noti",
      email: "student.noti@example.com",
      password: "Password123",
      role: "student",
    });

    const subject = await Subject.create({
      name: "Arte y Creatividad",
      color: "#FF6600",
      icon: "palette",
      description: "Materia para validar notificaciones de leccion nueva.",
      lessons: [],
    });

    const teacherToken = signAccessToken(teacher._id, "teacher");
    const studentToken = signAccessToken(student._id, "student");

    const createLessonResponse = await request(app)
      .post(`/api/teacher/subjects/${subject._id}/lessons`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        title: "Exploracion de color",
        content: "Nueva leccion para practicar combinaciones de color y composicion.",
      });

    expect(createLessonResponse.statusCode).toBe(201);

    const listResponse = await request(app)
      .get("/api/notifications/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.data.notifications.length).toBeGreaterThan(0);

    const newLessonNotification = listResponse.body.data.notifications.find(
      (item) => item?.metadata?.eventName === "new_lesson"
    );

    expect(newLessonNotification).toBeTruthy();
    expect(newLessonNotification.metadata.subjectId.toString()).toBe(subject._id.toString());
  });
});
