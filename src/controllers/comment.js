const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Add a new comment
exports.add = async (req, res) => {
  try {
    if (!req.body?.message) {
      return res.status(404).json({ error: "Please provide a comment message!" });
    }

    // Check post is valid or not
    const isValidPost = await Post.exists({ _id : req.params.postId });

    if (!isValidPost) {
      return res
        .status(404)
        .json({ error: "You are trying to comment a invalid post!" });
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
  } catch (error) {
    if (error.reason) {
      res
        .status(400)
        .json({ error: "You are trying to comment a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Update a comment
exports.update = async (req, res) => {
  try {
    // Check update comment message provide or not
    if (!req.body?.message) {
      return res.json(400).json({ error : "Please provide comment message!" });
    }

    // updating comment
    const comment = await Comment.findOneAndUpdate({ _id: req.params.commentId, owner: req.user._id }, { message: req.body.message }, { select : "_id post message createdAt updatedAt"});

    // If comment not found or not update then send response
    if (!comment) {
      return res.status(403).json({ error : "You can update only your comment!" });
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
  } catch (error) {
    if (error.reason) {
      return res.status(400).json({ error: "Comment not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Delete a comment
exports.delete = async (req, res) => {
  try {
    // Getting comment/commentId from database
    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      owner: req.user._id,
    });

    // Send response if comment not delete or not found
    if (!comment) {
      return res
        .status(400)
        .json({ error: "You can delete only your comment!" });
    }

    // Decrement comment counter inside post
    await Post.updateOne({ _id : comment.post }, { $inc : { commentCounter : -1 } });

    // Send deleted comment, commentId
    res.json({ commentId: comment._id });
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "You can delete only your comment!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Get all post related comment
exports.getAllPostRelatedComments = async (req, res) => {
  try {
    // Fetch all post related comments
    const comments = await Comment.find({ post: req.params.postId }, { __v: 0 }).populate({ path : "owner", select : "_id username profilePictureUrl" });

    // Send comments
    res.json(comments);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post not exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};
