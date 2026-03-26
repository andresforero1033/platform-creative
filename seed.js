require('dotenv').config();
const mongoose = require('mongoose');

const Subject = require('./models/Subject');
const GradeLevel = require('./models/GradeLevel');
const Unit = require('./models/Unit');
const Lesson = require('./models/Lesson');
const User = require('./models/User');

async function seedDatabase() {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/creative_db';
        await mongoose.connect(mongoUri);
        console.log('Conectado a MongoDB');

        try {
            await mongoose.connection.dropDatabase();
            console.log('Base de datos limpiada con dropDatabase');
        } catch (error) {
            console.warn('No se pudo ejecutar dropDatabase, continuando con deleteMany:', error.message);
        }

        await Subject.deleteMany({});
        await GradeLevel.deleteMany({});
        await Unit.deleteMany({});
        await Lesson.deleteMany({});
        await User.deleteMany({});

        const subjectsSeed = [
            {
                name: 'Matemáticas',
                slug: 'matematicas',
                uiConfig: {
                    primaryColor: '#1e40af',
                    secondaryColor: '#eff6ff',
                    iconId: 'math'
                }
            },
            {
                name: 'Ciencias',
                slug: 'ciencias',
                uiConfig: {
                    primaryColor: '#15803d',
                    secondaryColor: '#ecfdf5',
                    iconId: 'science'
                }
            },
            {
                name: 'Español',
                slug: 'espanol',
                uiConfig: {
                    primaryColor: '#be185d',
                    secondaryColor: '#fdf2f8',
                    iconId: 'language'
                }
            },
            {
                name: 'Inglés',
                slug: 'ingles',
                uiConfig: {
                    primaryColor: '#4338ca',
                    secondaryColor: '#eef2ff',
                    iconId: 'english'
                }
            },
            {
                name: 'Historia',
                slug: 'historia',
                uiConfig: {
                    primaryColor: '#b45309',
                    secondaryColor: '#fffbeb',
                    iconId: 'history'
                }
            },
            {
                name: 'Geografía',
                slug: 'geografia',
                uiConfig: {
                    primaryColor: '#047857',
                    secondaryColor: '#ecfdf5',
                    iconId: 'geo'
                }
            },
            {
                name: 'Arte',
                slug: 'arte',
                uiConfig: {
                    primaryColor: '#7e22ce',
                    secondaryColor: '#faf5ff',
                    iconId: 'art'
                }
            }
        ];

        const insertedSubjects = await Subject.insertMany(subjectsSeed);
        const subjectBySlug = new Map(insertedSubjects.map((subject) => [subject.slug, subject]));

        const gradeDocs = insertedSubjects.map((subject) => ({
            subjectId: subject._id,
            name: '1º de Primaria',
            slug: `${subject.slug}-1-primaria`,
            order: 1
        }));

        const insertedGrades = await GradeLevel.insertMany(gradeDocs);

        const firstGradeBySubjectSlug = new Map();
        insertedSubjects.forEach((subject) => {
            const firstGrade = insertedGrades.find(
                (grade) => String(grade.subjectId) === String(subject._id) && grade.order === 1
            );
            if (firstGrade) {
                firstGradeBySubjectSlug.set(subject.slug, firstGrade);
            }
        });

        const unitBySubjectSlugConfig = {
            matematicas: 'Introducción a Operaciones',
            ciencias: 'Introducción a Ciencias',
            espanol: 'Introducción a Lenguaje',
            ingles: 'Introducción a Inglés',
            historia: 'Introducción a Historia',
            geografia: 'Introducción a Geografía',
            arte: 'Introducción a Arte'
        };

        const unitsSeed = Object.entries(unitBySubjectSlugConfig)
            .map(([subjectSlug, title]) => {
                const level = firstGradeBySubjectSlug.get(subjectSlug);
                if (!level) return null;
                return {
                    subjectSlug,
                    gradeLevelId: level._id,
                    title,
                    order: 1,
                    description: `Unidad inicial de ${subjectBySlug.get(subjectSlug)?.name || subjectSlug}.`
                };
            })
            .filter(Boolean);

        const insertedUnits = await Unit.insertMany(
            unitsSeed.map(({ gradeLevelId, title, order, description }) => ({
                gradeLevelId,
                title,
                order,
                description
            }))
        );

        const unitBySubjectSlug = new Map();
        unitsSeed.forEach((unitSeed, index) => {
            unitBySubjectSlug.set(unitSeed.subjectSlug, insertedUnits[index]);
        });

        const lessonsSeed = [
            {
                unitId: unitBySubjectSlug.get('matematicas')._id,
                title: 'Teoría de multiplicación',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Multiplicar es sumar un mismo numero varias veces.',
                    examples: ['3 x 2 = 6', '4 x 3 = 12']
                }
            },
            {
                unitId: unitBySubjectSlug.get('matematicas')._id,
                title: 'Generador de Tablas',
                type: 'practice',
                order: 2,
                content: {
                    table: 7,
                    mode: 'tables-practice'
                }
            },
            {
                unitId: unitBySubjectSlug.get('ciencias')._id,
                title: 'Teoría del entorno natural',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Observamos seres vivos y su relacion con el ambiente.',
                    ideasClave: ['animales', 'plantas', 'ecosistema']
                }
            },
            {
                unitId: unitBySubjectSlug.get('espanol')._id,
                title: 'Teoría de comprensión lectora',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Leer textos cortos y extraer ideas principales.',
                    tips: ['leer con calma', 'identificar personajes']
                }
            },
            {
                unitId: unitBySubjectSlug.get('ingles')._id,
                title: 'Teoría de vocabulario básico',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Aprender palabras comunes del aula.',
                    examples: ['book', 'pencil', 'teacher']
                }
            },
            {
                unitId: unitBySubjectSlug.get('historia')._id,
                title: 'Teoría del paso del tiempo',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Comprender pasado, presente y futuro en historias simples.',
                    examples: ['ayer', 'hoy', 'mañana']
                }
            },
            {
                unitId: unitBySubjectSlug.get('geografia')._id,
                title: 'Teoría del espacio y ubicación',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Reconocer lugares cercanos y orientarse en el mapa.',
                    concepts: ['norte', 'sur', 'este', 'oeste']
                }
            },
            {
                unitId: unitBySubjectSlug.get('arte')._id,
                title: 'Teoría de colores y formas',
                type: 'theory',
                order: 1,
                content: {
                    intro: 'Explorar colores, lineas y formas para crear arte.',
                    ideas: ['mezcla de colores', 'figuras basicas']
                }
            }
        ];

        await Lesson.insertMany(lessonsSeed);

        console.log('¡Datos semilla insertados con éxito!');
        process.exit(0);
    } catch (error) {
        console.error('Error al insertar datos semilla:', error);
        process.exit(1);
    }
}

seedDatabase();
