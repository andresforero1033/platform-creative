const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        description: { type: String, default: '' },
        uiConfig: {
            primaryColor: { type: String, default: '' },
            secondaryColor: { type: String, default: '' },
            iconId: { type: String, default: '' }
        },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Subject', SubjectSchema);
