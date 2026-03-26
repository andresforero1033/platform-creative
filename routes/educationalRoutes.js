const express = require('express');
const Subject = require('../models/Subject');
const GradeLevel = require('../models/GradeLevel');
const Unit = require('../models/Unit');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

const router = express.Router();

router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({ isActive: true });
        return res.status(200).json(subjects);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/subjects/:subjectId/levels', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const levels = await GradeLevel.find({ subjectId }).sort({ order: 1 });
        return res.status(200).json(levels);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/levels/:levelId/units', async (req, res) => {
    try {
        const { levelId } = req.params;
        const units = await Unit.find({ gradeLevelId: levelId }).sort({ order: 1 });
        return res.status(200).json(units);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/units/:unitId/lessons', async (req, res) => {
    try {
        const { unitId } = req.params;
        const lessons = await Lesson.find({ unitId })
            .select('_id title type order')
            .sort({ order: 1 });
        return res.status(200).json(lessons);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/lessons/:id', async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        return res.status(200).json(lesson);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.post('/progress', async (req, res) => {
    try {
        const { userId, lessonId, score } = req.body;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            throw new Error('La leccion no existe');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('El usuario no existe');
        }

        if (!Array.isArray(user.progress)) {
            user.progress = [];
        }

        const progressIndex = user.progress.findIndex(
            (item) => String(item.lessonId) === String(lesson._id)
        );
        const numericScore = Number(score) || 0;
        const isCompleted = numericScore >= lesson.passingScore;

        if (progressIndex >= 0) {
            user.progress[progressIndex].score = numericScore;
            user.progress[progressIndex].attempts = (user.progress[progressIndex].attempts || 0) + 1;
            user.progress[progressIndex].isCompleted = isCompleted;
            user.progress[progressIndex].lastAttemptAt = new Date();
        } else {
            user.progress.push({
                lessonId: lesson._id,
                score: numericScore,
                attempts: 1,
                isCompleted,
                lastAttemptAt: new Date()
            });
        }

        user.lastLessonId = lesson._id;
        await user.save();

        return res.status(200).json({
            message: 'Progreso guardado',
            lastLessonId: user.lastLessonId,
            progress: user.progress
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
