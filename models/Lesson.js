const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema(
    {
        unitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
            required: true
        },
        title: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['theory', 'practice', 'quiz', 'game'],
            required: true
        },
        content: { type: mongoose.Schema.Types.Mixed, default: {} },
        passingScore: { type: Number, default: 70 },
        order: { type: Number, required: true },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Lesson', LessonSchema);
