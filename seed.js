const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const connectDB = require("./config/db");
const Subject = require("./models/Subject");

if (!/\/creativeDB(\?|$)/.test(process.env.MONGODB_URI || "")) {
  console.error("MONGODB_URI debe incluir /creativeDB al final de la ruta de base de datos.");
  process.exit(1);
}

const subjectsToSeed = [
  {
    name: "Matemáticas",
    color: "#E53935",
    icon: "calculator",
    description: "Descubre que los numeros son superpoderes para resolver retos cada dia.",
  },
  {
    name: "Español",
    color: "#FB8C00",
    icon: "book-open",
    description: "Expresa tus ideas con confianza y convierte tus palabras en grandes historias.",
  },
  {
    name: "Ciencias Naturales",
    color: "#FDD835",
    icon: "leaf",
    description: "Explora la naturaleza con curiosidad y aprende como funciona el mundo que te rodea.",
  },
  {
    name: "Ciencias Sociales",
    color: "#43A047",
    icon: "globe",
    description: "Conoce culturas, comunidades e historia para construir un futuro mejor juntos.",
  },
  {
    name: "Inglés",
    color: "#00897B",
    icon: "language",
    description: "Abre puertas al mundo practicando un nuevo idioma de forma divertida.",
  },
  {
    name: "Arte y Creatividad",
    color: "#1E88E5",
    icon: "palette",
    description: "Transforma tu imaginacion en ideas unicas y obras que inspiren a los demas.",
  },
  {
    name: "Educación Física",
    color: "#3949AB",
    icon: "activity",
    description: "Mueve tu cuerpo, fortalece tu mente y disfruta habitos saludables cada dia.",
  },
  {
    name: "Desarrollo de Software (Enfoque en lógica y coding para niños)",
    color: "#8E24AA",
    icon: "code",
    description: "Aprende logica y programacion para crear soluciones y construir tus propios mundos digitales.",
  },
  {
    name: "Inteligencia Emocional",
    color: "#D81B60",
    icon: "heart",
    description: "Reconoce tus emociones, comunica con empatia y crece en confianza personal.",
  },
  {
    name: "Educación Financiera",
    color: "#6D4C41",
    icon: "coins",
    description: "Comprende el valor del dinero y toma decisiones inteligentes desde pequeno.",
  },
];

async function seedSubjects() {
  try {
    await connectDB();
    console.log("Modo seed activo sobre creativeDB.");

    const results = await Promise.all(
      subjectsToSeed.map(async (materia) => {
        const result = await Subject.updateOne(
          { name: materia.name },
          {
            $set: {
              color: materia.color,
              icon: materia.icon,
              description: materia.description,
            },
            $setOnInsert: {
              name: materia.name,
              lessons: [],
            },
          },
          { upsert: true }
        );

        console.log("✅ Materia procesada:", materia.name);
        return result;
      })
    );

    const insertedCount = results.reduce(
      (acc, result) => acc + (result.upsertedCount || 0),
      0
    );
    const updatedCount = results.reduce(
      (acc, result) => acc + (result.modifiedCount || 0),
      0
    );

    console.log(
      `Seed finalizado. Materias insertadas: ${insertedCount}. Materias actualizadas: ${updatedCount}`
    );
  } catch (error) {
    console.error("Error ejecutando seed:", error.message);
    process.exitCode = 1;
  } finally {
    console.log("🚀 Sembrado completado con éxito");
    const mongoose = require("mongoose");
    await mongoose.disconnect();
    console.log("Conexion cerrada.");
  }
}

seedSubjects();
