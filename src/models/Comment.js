const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: Date,
    required: true,
    default: new Date(),
  },
});

module.exports = mongoose.model("Comment", commentSchema);
