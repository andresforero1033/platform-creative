const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        },
        profile: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

UserSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
