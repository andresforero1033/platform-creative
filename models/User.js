const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema(
    {
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        score: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false },
        attempts: { type: Number, default: 1 },
        lastAttemptAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin'],
            default: 'student'
        },
        progress: { type: [ProgressSchema], default: [] },
        lastLessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
