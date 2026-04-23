const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Classroom = require("../../models/Classroom");
const Question = require("../../models/Question");
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

describe("Final Challenge integration", () => {
  test("flujo aprobado otorga medalla especial Gran Maestro", async () => {
    const student = await User.create({
      name: "Alumno Gran Maestro",
      email: "gran.maestro@example.com",
      password: "Password123",
      role: "student",
    });

    const lessonOneId = new mongoose.Types.ObjectId();
    const lessonTwoId = new mongoose.Types.ObjectId();

    const subject = await Subject.create({
      name: "Ciencias Naturales",
      color: "#43A047",
      icon: "flask",
      description: "Materia para challenge final.",
      lessons: [
        {
          _id: lessonOneId,
          title: "Sistema solar",
          content: "Leccion completa sobre planetas y orbitas.",
        },
        {
          _id: lessonTwoId,
          title: "Fotosintesis",
          content: "Leccion completa sobre plantas y energia.",
        },
      ],
    });

    await Classroom.create({
      institutionId: student.institutionId,
      subjectId: subject._id,
      teacherId: student._id,
      courseName: "1401",
      classCode: "CLFINAL01",
      studentIds: [student._id],
    });

    await Progress.create([
      {
        userId: student._id,
        subjectId: subject._id,
        lessonId: lessonOneId,
        completed: true,
        mastered: true,
        completedAt: new Date(),
        masteredAt: new Date(),
      },
      {
        userId: student._id,
        subjectId: subject._id,
        lessonId: lessonTwoId,
        completed: true,
        mastered: true,
        completedAt: new Date(),
        masteredAt: new Date(),
      },
    ]);

    const questions = [];
    for (let i = 0; i < 10; i += 1) {
      const question = await Question.create({
        subjectId: subject._id,
        lessonId: i < 5 ? lessonOneId : lessonTwoId,
        prompt: `Pregunta ${i + 1}`,
        options: ["A", "B", "C", "D"],
        correctOption: 1,
      });
      questions.push(question);
    }

    const token = signAccessToken(student._id, "student");

    const examResponse = await request(app)
      .get(`/api/student/subjects/${subject._id}/final-challenge`)
      .set("Authorization", `Bearer ${token}`);

    expect(examResponse.statusCode).toBe(200);
    expect(examResponse.body.success).toBe(true);
    expect(examResponse.body.data.totalQuestions).toBe(10);
    expect(examResponse.body.data.questions).toHaveLength(10);
    expect(examResponse.body.data.questions[0].correctOption).toBeUndefined();

    const answers = questions.map((question) => ({
      questionId: question._id,
      selectedOption: 1,
    }));

    const submitResponse = await request(app)
      .post(`/api/student/subjects/${subject._id}/final-challenge/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ answers });

    expect(submitResponse.statusCode).toBe(200);
    expect(submitResponse.body.success).toBe(true);
    expect(submitResponse.body.data.passed).toBe(true);
    expect(submitResponse.body.data.score).toBe(100);
    expect(submitResponse.body.data.grandMasterBadge).toBe(`Gran Maestro de ${subject.name}`);

    const updatedStudent = await User.findById(student._id).lean();
    const grandMasterBadge = updatedStudent.badges.find(
      (badge) => badge.nombre === `Gran Maestro de ${subject.name}`
    );

    expect(grandMasterBadge).toBeTruthy();
  });
});
