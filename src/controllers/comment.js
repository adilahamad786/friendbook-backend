const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Add a new comment
exports.add = async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(404).json({ error: "Please provide comment message!" });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res
        .status(404)
        .json({ error: "You are trying to comment a invalid post!" });
    }

    const newComment = new Comment({
      owner: req.user._id,
      post: req.params.postId,
      message: req.body.message,
      username: req.user.username,
      hasProfilePicture: req.user.hasProfilePicture,
      profilePictureLink: req.user.profilePictureLink
    });
    await newComment.save();

    post.commentCounter += 1;
    await post.save();

    res.status(201).json({ newComment, commentCounter: post.commentCounter });
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
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found!" });
    }

    if (!req.body?.message) {
      return res.status(400).json({ error: "Invalid update!" });
    }

    comment.message = req.body.message;
    await comment.save();

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
    const deletedComment = await Comment.findOneAndDelete({
      _id: req.params.postId,
      owner: req.user._id,
    });

    if (!deletedComment) {
      return res
        .status(400)
        .json({ error: "You can delete only your comment!" });
    }

    const post = await Post.findById(deletedComment.post);
    post.commentCounter -= 1;
    await post.save();

    res.json({
      commentId: deletedComment._id.toString(),
      commentCounter: post.commentCounter,
    });
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
    const comments = await Comment.find({ post: req.params.postId });
    res.json(comments);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post not exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};
