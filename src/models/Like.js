const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  owner: mongoose.Schema.Types.ObjectId,
  post: mongoose.Schema.Types.ObjectId,
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
