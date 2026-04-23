const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const DEFAULT_INSTITUTION_ID = new mongoose.Types.ObjectId("000000000000000000000001");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalido"],
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ["student", "teacher", "parent", "supervisor", "admin"],
      required: true
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      default: DEFAULT_INSTITUTION_ID,
      index: true
    },
    institutionAdminReference: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [/^[a-z0-9._-]{4,30}$/, "institutionAdminReference invalido"],
      index: true,
    },
    isInstitutionValidated: {
      type: Boolean,
      default: true,
      index: true,
    },
    dni: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]{5,30}$/, "DNI invalido"],
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivity: {
      type: Date,
      default: null
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    childrenIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      default: []
    },
    badges: {
      type: [
        {
          badgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Badge",
            required: true
          },
          nombre: {
            type: String,
            required: true,
            trim: true
          },
          awardedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    },
    profile: {
      avatar: {
        type: String,
        default: "",
        trim: true
      },
      experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
      },
      interests: {
        type: [String],
        default: []
      }
    }
  },
  {
    timestamps: true
  }
);

userSchema.index(
  { institutionId: 1, dni: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dni: { $type: "string" },
    },
  }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
