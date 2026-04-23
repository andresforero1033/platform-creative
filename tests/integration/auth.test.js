const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "integration_access_secret";
  process.env.JWT_REFRESH_SECRET = "integration_refresh_secret";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

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

describe("Auth integration flow", () => {
  test("admin crea institucion, estudiante se vincula, admin activa y luego login/logout funciona", async () => {
    const registerAdminResponse = await request(app)
      .post("/api/auth/register")
      .send({
        registrationMode: "create_institution",
        adminUsername: "forero.admin",
        institutionName: "IED Forero",
        legalId: "NIT-900000001",
        name: "Admin Institucional",
        email: "admin1@example.com",
        password: "Admin123!",
        role: "admin",
        dni: "ADM-0001",
      });

    expect(registerAdminResponse.statusCode).toBe(201);
    expect(registerAdminResponse.body.success).toBe(true);
    expect(registerAdminResponse.body.data.accessToken).toBeTruthy();
    expect(registerAdminResponse.body.data.refreshToken).toBeTruthy();

    const adminAccessToken = registerAdminResponse.body.data.accessToken;

    const registerStudentResponse = await request(app)
      .post("/api/auth/register")
      .send({
        registrationMode: "join_institution",
        institutionAdminUsername: "forero.admin",
        name: "Student One",
        email: "student1@example.com",
        password: "Student123!",
        role: "student",
        dni: "STD-0001",
      });

    expect(registerStudentResponse.statusCode).toBe(201);
    expect(registerStudentResponse.body.data.user.isInstitutionValidated).toBe(false);

    const studentId = registerStudentResponse.body.data.user.id;

    const pendingLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "student1@example.com",
        password: "Student123!",
      });

    expect(pendingLoginResponse.statusCode).toBe(403);

    const activationResponse = await request(app)
      .patch(`/api/admin/institution-users/${studentId}/activation`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({
        isInstitutionValidated: true,
      });

    expect(activationResponse.statusCode).toBe(200);
    expect(activationResponse.body.success).toBe(true);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "student1@example.com",
        password: "Student123!",
      });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.refreshToken).toBeTruthy();

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .send({
        refreshToken: loginResponse.body.data.refreshToken,
      });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.message).toMatch(/Logout exitoso/i);

    const refreshAfterLogout = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: loginResponse.body.data.refreshToken,
      });

    expect(refreshAfterLogout.statusCode).toBe(401);
    expect(refreshAfterLogout.body.success).toBe(false);
  });

  test("estudiante no puede vincularse a un adminUsername inexistente o inactivo", async () => {
    const invalidAdminReferenceResponse = await request(app)
      .post("/api/auth/register")
      .send({
        registrationMode: "join_institution",
        institutionAdminUsername: "missing.admin",
        name: "Student Missing",
        email: "missing.student@example.com",
        password: "Student123!",
        role: "student",
        dni: "STD-4040",
      });

    expect(invalidAdminReferenceResponse.statusCode).toBe(404);

    const registerAdminResponse = await request(app)
      .post("/api/auth/register")
      .send({
        registrationMode: "create_institution",
        adminUsername: "inactive.admin",
        institutionName: "IED Inactiva",
        legalId: "NIT-900000999",
        name: "Admin Inactivo",
        email: "admin.inactive@example.com",
        password: "Admin123!",
        role: "admin",
        dni: "ADM-0999",
      });

    expect(registerAdminResponse.statusCode).toBe(201);

    const Institution = require("../../models/Institution");
    await Institution.findOneAndUpdate(
      { adminUsername: "inactive.admin" },
      { $set: { isActive: false } }
    );

    const inactiveAdminReferenceResponse = await request(app)
      .post("/api/auth/register")
      .send({
        registrationMode: "join_institution",
        institutionAdminUsername: "inactive.admin",
        name: "Student Inactive",
        email: "inactive.student@example.com",
        password: "Student123!",
        role: "student",
        dni: "STD-5050",
      });

    expect(inactiveAdminReferenceResponse.statusCode).toBe(403);
  });
});
