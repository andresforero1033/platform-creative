const mongoose = require('mongoose');

const GradeLevelSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true
        },
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true },
        order: { type: Number, required: true },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

GradeLevelSchema.index({ subjectId: 1, order: 1 });

module.exports = mongoose.model('GradeLevel', GradeLevelSchema);
