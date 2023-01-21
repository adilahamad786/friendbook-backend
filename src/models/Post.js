const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    hasProfilePicture: {
      type: Boolean,
      required: true,
      default: false
    },
    message: {
      type: String,
      maxlength: 1000,
    },
    image: {
      type: Object,
    },
    hasImage: {
      type: Boolean,
      required: true,
      default: false
    },
    likes: {
      type: Array,
      default: [],
    },
    commentCounter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Remove unwanted information from post object
postSchema.methods.toJSON = function () {
  const user = this;

  // we are not use destructure to filter because the behaviour is different
  const userObject = user.toObject();

  delete userObject.image;
  delete userObject.updatedAt;
  delete userObject.__v;

  return userObject;
};

module.exports = mongoose.model("Post", postSchema);
