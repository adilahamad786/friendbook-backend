const tryCatch = require("../middleware/tryCatch");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const ErrorHandler = require("../utils/errorHandler");

// ADD A NEW COMMENT
exports.add = tryCatch(async (req, res) => {
  if (!req.body.message) {
    throw new ErrorHandler("bad_request", "Please provide a comment message!", 400);
  }

  // Check post is valid or not
  const isValidPost = await Post.exists({ _id : req.params.postId });

  if (!isValidPost) {
    throw new ErrorHandler("bad_request", "Post not exist!", 400);
  }

  // Create and save post
  const createdComment = await Comment.create({
    owner: req.user._id,
    post: req.params.postId,
    message: req.body.message,
  });

  // Prepair newComment object for response
  newComment = createdComment.toObject()
  newComment.owner = {
    _id : req.user._id,
    username: req.user.username,
    profilePictureUrl : req.user.profilePictureUrl
  }

  // Delete unwanted fileds form newComment
  delete newComment.__v;

  // Update commentCounter inside the post
  await Post.updateOne({ _id : req.params.postId }, { $inc : { commentCounter : 1 } });

  // Send new comment
  res.status(201).json(newComment);
});


// UPDATE A COMMENT
exports.update = tryCatch(async (req, res) => {
  // Check update comment message provide or not
  if (!req.body.message) {
    throw new ErrorHandler("bad_request", "Please provide a comment message!", 400);
  }

  // updating comment
  const comment = await Comment.findOneAndUpdate({ _id: req.params.commentId, owner: req.user._id }, { message: req.body.message }, { select : "_id post message createdAt updatedAt"});

  // If comment not found or not update then send response
  if (!comment) {
    throw new ErrorHandler("bad_request", "You can update only your comment!", 400);
  }

  // Prepair updatedComment object for response
  let updatedComment = comment.toObject();
  updatedComment.message = req.body.message;
  updatedComment.owner = {
    _id : req.user._id,
    username: req.user.username,
    profilePictureUrl : req.user.profilePictureUrl
  }
  
  // Send updated comment
  res.json(updatedComment);
});


// DELETE A COMMENT
exports.delete = tryCatch(async (req, res) => {
  // Getting comment/commentId from database
  const comment = await Comment.findOneAndDelete({
    _id: req.params.commentId,
    owner: req.user._id,
  });

  // Send response if comment not delete or not found
  if (!comment) {
    throw new ErrorHandler("bad_request", "You can delete only your comment!", 400);
  }

  // Decrement comment counter inside post
  await Post.updateOne({ _id : comment.post }, { $inc : { commentCounter : -1 } });

  // Send deleted comment, commentId
  res.json({ commentId: comment._id });
});


// GET ALL POST RELATED COMMENTS
exports.getAllPostRelatedComments = tryCatch(async (req, res) => {
  // Fetch all post related comments
  const comments = await Comment.find({ post: req.params.postId }, { __v: 0 }).populate({ path : "owner", select : "_id username profilePictureUrl" });

  // Send comments
  res.json(comments);
});
