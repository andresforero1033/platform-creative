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
  test("POST /register -> POST /login -> POST /logout", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Supervisor One",
        email: "supervisor1@example.com",
        password: "Supervisor123!",
        role: "supervisor",
      });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data.accessToken).toBeTruthy();
    expect(registerResponse.body.data.refreshToken).toBeTruthy();

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "supervisor1@example.com",
        password: "Supervisor123!",
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
});
