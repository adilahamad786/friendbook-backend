const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ErrorHandler = require("../utils/errorHandler");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase : true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new ErrorHandler("bad_request", "Email is not valid!", 400);
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
    },
    age: {
      type: Number,
      validate(value) {
        if (value < 0) {
          throw new ErrorHandler("bad_request", "Age is invalid!", 400);
        }
      },
    },
    profilePicture: {
      type: Object,
    },
    profilePictureUrl: {
      type: String
    },
    coverPicture: {
      type: Object,
    },
    coverPictureUrl: {
      type: String
    },
    story: {
      type: Object,
    },
    storyUrl: {
      type: String
    },
    followings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      maxlength: 30,
    },
    location: {
      type: String,
      minlength: 2,
      maxlength: 30
    },
    gender: {
      type: Number,
      enum: [1, 2],
    },
    relationship: {
      type: Number,
      enum: [1, 2],
    },
    linkedIn: {
      type: String,
    },
    facebook: {
      type: String,
    },
    twitter: {
      type: String,
    },
    instagram: {
      type: String,
    },
    pinterest: {
      type: String,
    },
    tokens: [{
      token: {
        type: String,
        required: true,
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Remove unwanted information from user object
userSchema.methods.toJSON = function () {
  const user = this;

  // we are not use destructure to filter because the behaviour is different
  const userObject = user.toObject();

  delete userObject.followers;
  delete userObject.followings;
  delete userObject.profilePicture;
  delete userObject.coverPicture;
  delete userObject.story;
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.createdAt;
  delete userObject.updatedAt;
  delete userObject.isAdmin;
  delete userObject.__v

  return userObject;
};

// Generate jwt token for user
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: 86400,
  });
  // user.tokens = user.tokens.concat({ token });
  user.tokens.push({ token });

  await user.save();
  return token;
};

// Hash the plain text password before the saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }

  next();
});

// Verify user credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email }, { profilePicture: 0, coverPicture: 0, story: 0, isAdmin: 0, __v: 0, createdAt: 0, updatedAt: 0 });

  if (!user) {
    throw new ErrorHandler("unauthorized", "Invalid user credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ErrorHandler("unauthorized", "Invalid user credentials", 401);
  }

  return user;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
