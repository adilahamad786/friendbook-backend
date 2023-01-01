const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Post = require("../models/Post");

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
          throw new Error("Email is not valid!");
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
          throw new Error("Age is invalid!");
        }
      },
    },
    profilePicture: {
      type: Object,
    },
    coverPicture: {
      type: Object,
    },
    story: {
      type: Object,
    },
    followings: {
      type: Array,
      default: [],
    },
    followers: {
      type: Array,
      default: [],
    },
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
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
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

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.coverPicture;
  delete userObject.profilePicture;
  delete userObject.story;
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
  user.tokens = user.tokens.concat({ token });

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

// Delete user related followings/followers/posts/comments before DELETING USER
userSchema.pre("remove", async function (next) {
  const user = this;

  // Delete user followers
  user.followers.map(async (followerId) => {
    const follower = await User.findById(followerId);
    follower.followings = follower.followings.filter(
      (followingId) => followingId !== user._id.toString()
    );
    await follower.save();
  });

  // Delete user followings
  user.followings.map(async (followingId) => {
    const following = await User.findById(followingId);
    following.followers = following.followers.filter(
      (followerId) => followerId !== user._id.toString()
    );
    await following.save();
  });

  // Delte user posts
  await Post.deleteMany({ owner: user._id });

  next();
});

// Verify user credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid user credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid user credentials");
  }

  return user;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
