const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema(
    {
        gradeLevelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GradeLevel',
            required: true
        },
        title: { type: String, required: true, trim: true },
        order: { type: Number, required: true },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Unit', UnitSchema);
