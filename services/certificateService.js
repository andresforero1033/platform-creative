const PDFDocument = require("pdfkit");
const AppError = require("../utils/appError");
const subjectRepository = require("../repositories/subjectRepository");
const progressRepository = require("../repositories/progressRepository");
const userRepository = require("../repositories/userRepository");
const { logger } = require("../config/logger");

function sanitizeFileName(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildCertificatePdfBuffer(payload) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f7f9fc");

    doc.fillColor("#0f172a");
    doc.fontSize(20).text("Creative", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(28).text("Certificado de Finalizacion", { align: "center" });

    doc.moveDown(1.5);
    doc.fontSize(14).text("Se certifica que", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(24).text(payload.studentName, { align: "center" });

    doc.moveDown(1);
    doc.fontSize(14).text("ha completado satisfactoriamente la materia", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(22).text(payload.subjectName, { align: "center" });

    doc.moveDown(1.5);
    doc.fontSize(12).text(`Fecha de emision: ${payload.issueDate}`, { align: "center" });

    doc.moveDown(2);
    doc.fontSize(11).fillColor("#334155").text("Creative Platform - Certificacion Academica", { align: "center" });

    doc.end();
  });
}

async function generateSubjectCertificate(userId, subjectId) {
  const [user, subject] = await Promise.all([
    userRepository.findByIdLean(userId),
    subjectRepository.findByIdWithLessonsLean(subjectId),
  ]);

  if (!user) {
    throw new AppError("Usuario no encontrado.", 404);
  }

  if (!subject) {
    throw new AppError("Materia no encontrada.", 404);
  }

  const totalLessons = subject.lessons.length;
  if (totalLessons === 0) {
    throw new AppError("La materia no tiene lecciones para certificar.", 400);
  }

  const completedLessons = await progressRepository.countCompletedLessonsBySubject(userId, subjectId);

  if (completedLessons < totalLessons) {
    throw new AppError("Debes completar el 100% de la materia para generar certificado.", 403);
  }

  const issueDate = new Date().toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const buffer = await buildCertificatePdfBuffer({
    studentName: user.name,
    subjectName: subject.name,
    issueDate,
  });

  logger.info({
    event: "certificate_generated",
    userId,
    subjectId,
    subjectName: subject.name,
  });

  return {
    statusCode: 200,
    fileName: `certificado-${sanitizeFileName(subject.name)}.pdf`,
    buffer,
  };
}

module.exports = {
  generateSubjectCertificate,
};
