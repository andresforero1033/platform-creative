require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const educationalRoutes = require('./routes/educationalRoutes');
// const User = require('./models/User');

const app = express();
const SITE_URL = process.env.SITE_URL || 'https://creativebymariana.com';
const LOGIN_VIEW_PATH = path.join(__dirname, 'public', 'login.html');
const APP_VIEW_PATH = path.join(__dirname, 'public', 'index.html');
const APP_ROUTES = [
    '/app',
    '/app/multiplicacion',
    '/app/division',
    '/app/juegos',
    '/app/herramientas',
    '/app/aprendizaje',
    '/app/perfil'
];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use('/api', educationalRoutes);

const profileDefaults = {
    name: 'Explorador',
    avatar: '🦁',
    level: 1,
    stars: 0,
    trophies: 0,
    exercisesCompleted: 0,
    gameRecords: { multiplicationRush: 0 },
    history: []
};

const applyProfileDefaults = (profile = {}) => {
    const merged = { ...profileDefaults, ...profile };
    merged.gameRecords = {
        ...profileDefaults.gameRecords,
        ...(profile?.gameRecords || {})
    };
    merged.history = Array.isArray(profile?.history) ? profile.history : [];
    return merged;
};

const serializeProfile = (profileDoc) => {
    if (!profileDoc) {
        return applyProfileDefaults();
    }
    const raw = typeof profileDoc.toObject === 'function' ? profileDoc.toObject() : profileDoc;
    return applyProfileDefaults(raw);
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Rutas de Vistas (Mover arriba para prioridad)
app.get('/', (req, res) => {
    res.sendFile(LOGIN_VIEW_PATH);
});

APP_ROUTES.forEach((route) => {
    app.get(route, (req, res) => {
        res.sendFile(APP_VIEW_PATH);
    });
});

// Conexión a MongoDB (No bloqueante)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas legacy deshabilitadas temporalmente durante la migración a Plataforma Creative.
// app.post('/api/register', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = new User({ username, password });
//         await user.save();
//         res.status(201).json({ message: 'Usuario registrado exitosamente' });
//     } catch (error) {
//         res.status(400).json({ error: 'Error al registrar usuario. El nombre podría estar en uso.' });
//     }
// });

// app.post('/api/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await User.findOne({ username });
//         if (!user || !(await user.comparePassword(password))) {
//             return res.status(401).json({ error: 'Credenciales inválidas' });
//         }
//         const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         res.json({ token, username: user.username });
//     } catch (error) {
//         res.status(500).json({ error: 'Error en el servidor' });
//     }
// });

// app.get('/api/profile', authenticate, async (req, res) => {
//     try {
//         const user = await User.findById(req.userId);
//         if (!user) {
//             return res.status(404).json({ error: 'Usuario no encontrado' });
//         }
//         res.json({ profile: serializeProfile(user.profile) });
//     } catch (error) {
//         res.status(500).json({ error: 'No se pudo obtener el perfil' });
//     }
// });

// const ALLOWED_PROFILE_FIELDS = new Set([
//     'name',
//     'avatar',
//     'level',
//     'stars',
//     'trophies',
//     'exercisesCompleted',
//     'gameRecords'
// ]);

// app.put('/api/profile', authenticate, async (req, res) => {
//     try {
//         const updates = (req.body && req.body.profile) || {};
//         const user = await User.findById(req.userId);
//         if (!user) {
//             return res.status(404).json({ error: 'Usuario no encontrado' });
//         }
//
//         if (!user.profile) {
//             user.profile = {};
//         }
//
//         Object.entries(updates).forEach(([field, value]) => {
//             if (!ALLOWED_PROFILE_FIELDS.has(field)) return;
//             if (field === 'gameRecords') {
//                 user.profile.gameRecords = {
//                     ...(user.profile.gameRecords || {}),
//                     ...(value || {})
//                 };
//             } else {
//                 user.profile[field] = value;
//             }
//         });
//
//         await user.save();
//         res.json({ profile: serializeProfile(user.profile) });
//     } catch (error) {
//         res.status(500).json({ error: 'No se pudo actualizar el perfil' });
//     }
// });

// app.post('/api/profile/history', authenticate, async (req, res) => {
//     try {
//         const entry = req.body?.entry;
//         if (!entry || !entry.type) {
//             return res.status(400).json({ error: 'Entrada de historial inválida' });
//         }
//
//         const user = await User.findById(req.userId);
//         if (!user) {
//             return res.status(404).json({ error: 'Usuario no encontrado' });
//         }
//
//         if (!user.profile) {
//             user.profile = {};
//         }
//
//         if (!Array.isArray(user.profile.history)) {
//             user.profile.history = [];
//         }
//
//         const normalizedEntry = {
//             clientId: entry.clientId || undefined,
//             type: entry.type,
//             module: entry.module || 'general',
//             score: typeof entry.score === 'number' ? entry.score : 0,
//             totalQuestions: typeof entry.totalQuestions === 'number' ? entry.totalQuestions : undefined,
//             grade: typeof entry.grade === 'number' ? entry.grade : undefined,
//             meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : {},
//             createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date()
//         };
//
//         if (normalizedEntry.clientId) {
//             user.profile.history = user.profile.history.filter((item) => item.clientId !== normalizedEntry.clientId);
//         }
//
//         user.profile.history.unshift(normalizedEntry);
//         user.profile.history = user.profile.history.slice(0, 100);
//         await user.save();
//
//         res.json({ history: serializeProfile(user.profile).history });
//     } catch (error) {
//         res.status(500).json({ error: 'No se pudo actualizar el historial' });
//     }
// });

app.get('/robots.txt', (req, res) => {
    const robotsBody = [
        'User-agent: *',
        'Allow: /',
        `Sitemap: ${SITE_URL}/sitemap.xml`
    ].join('\n');
    res.type('text/plain').send(robotsBody);
});

app.get('/sitemap.xml', (req, res) => {
    const now = new Date().toISOString();
    const baseEntries = [
        { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
        { loc: `${SITE_URL}/app`, changefreq: 'weekly', priority: '0.9' }
    ];

    const moduleEntries = APP_ROUTES
        .filter((route) => route !== '/app')
        .map((route) => ({
            loc: `${SITE_URL}${route}`,
            changefreq: 'monthly',
            priority: '0.7'
        }));

    const urls = [...baseEntries, ...moduleEntries]
        .map(({ loc, changefreq, priority }) => (
            `    <url>\n` +
            `        <loc>${loc}</loc>\n` +
            `        <lastmod>${now}</lastmod>\n` +
            `        <changefreq>${changefreq}</changefreq>\n` +
            `        <priority>${priority}</priority>\n` +
            `    </url>`
        ))
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${urls}\n` +
        `</urlset>`;

    res.type('application/xml').send(xml);
});

// Rutas de Vistas
// (Eliminadas de aquí porque se movieron arriba)

// Manejo de rutas no encontradas (SPA fallback si fuera necesario, pero aquí redirigimos a login)
app.get('*', (req, res) => {
    res.redirect('/');
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
}

module.exports = app;