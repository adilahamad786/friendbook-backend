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
  username: {
    type: String,
    required: true,
  },
  hasProfilePicture: {
    type: Boolean,
    required: true,
    default: false
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
