import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 15,
      default: null,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["patient", "practitioner", "admin"],
      default: "patient",
      required: true,
    },

    dob: {
      type: Date,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// HASH PASSWORD BEFORE SAVING
// ==========================================

userSchema.pre("save", async function () {
  // Don't hash password again if it wasn't changed
  if (!this.isModified("password")) {
    return;
  }

  // OAuth users may not have a password
  if (!this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

// ==========================================
// COMPARE PASSWORD
// ==========================================

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

// ==========================================
// REMOVE PASSWORD FROM JSON RESPONSE
// ==========================================

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;

  return user;
};

// ==========================================
// CREATE MODEL
// ==========================================

const User = mongoose.model("User", userSchema);

export default User;