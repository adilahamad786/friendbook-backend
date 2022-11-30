const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      max: 50,
    },
    img: {
      type: Buffer,
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
