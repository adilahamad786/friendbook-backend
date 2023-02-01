const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 1000,
    },
    image: {
      type: Object,
    },
    imageUrl: {
      type: String
    },
    likeCounter: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model("Post", postSchema);
