const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  owner: mongoose.Schema.Types.ObjectId,
  post: mongoose.Schema.Types.ObjectId,
});

module.exports = mongoose.model("Like", likeSchema);
