const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "User",
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "Post",
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  }
},
{
  timestamps: true,
});

// Remove unwanted information from comment object
commentSchema.methods.toJSON = function () {
  const user = this;

  // we are not use destructure to filter because the behaviour is different
  const userObject = user.toObject();

  delete userObject.updatedAt;
  delete userObject.__v;

  return userObject;
};

module.exports = mongoose.model("Comment", commentSchema);
