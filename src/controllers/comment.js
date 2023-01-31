const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Add a new comment
exports.add = async (req, res) => {
  try {
    if (!req.body?.message) {
      return res.status(404).json({ error: "Please provide comment message!" });
    }

    // Check post is valid or not
    const isValidPost = await Post.exists({ _id : req.params.postId });

    if (!isValidPost) {
      return res
        .status(404)
        .json({ error: "You are trying to comment a invalid post!" });
    }

    // Create and save post
    const newComment = await Comment.create({
      owner: req.user._id,
      post: req.params.postId,
      message: req.body.message,
      username: req.user.username,
      hasProfilePicture: req.user.hasProfilePicture,
      profilePictureLink: req.user.profilePictureLink
    });

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
    // Get and validate comment
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found!" });
    }

    // Check current user is owner or not
    if (!(comment.owner === req.user._id.toString())) {
      return res.status(403).json({ error : "You can update only your commnet!" });
    }

    // Confirm message provide or not
    if (!req.body?.message) {
      return res.status(400).json({ error: "Please provide a comment message!" });
    }

    // Update and save comment
    comment.message = req.body.message;
    await comment.save();

    // Send updated comment
    res.json(comment);
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
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      owner: req.user._id,
    }, { _id : 1, post : 1 });

    if (!comment) {
      return res
        .status(400)
        .json({ error: "You can delete only your comment!" });
    }

    // Delete comment from database
    await comment.remove();

    // decrement comment counter inside post
    await Post.updateOne({ _id : comment.post }, { $inc : { commentCounter : -1 } });

    // Send deleted comment, commentId
    res.json({ commentId: comment._id.toString() });
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
    const comments = await Comment.find({ post: req.params.postId });

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
