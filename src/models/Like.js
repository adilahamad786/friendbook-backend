const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");

const likeSchema = new mongoose.Schema({
  owner: {
    type : mongoose.Schema.Types.ObjectId,
    ref : User
  },
  post: {
    type : mongoose.Schema.Types.ObjectId,
    ref : Post
  }
},
{
  timestamps: true,
});

// Remove unwanted information from like object
likeSchema.methods.toJSON = function () {
  const user = this;

  // we are not use destructure to filter because the behaviour is different
  const userObject = user.toObject();

  delete userObject.createdAt;
  delete userObject.updatedAt;
  delete userObject.__v;

  return userObject;
};

module.exports = mongoose.model("Like", likeSchema);
