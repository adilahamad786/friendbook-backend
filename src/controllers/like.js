const Like = require("../models/Like");
const Post = require("../models/Post");

// Like/Dislike a post
exports.likeAndDislike = async (req, res) => {
  try {
    // Check post is valid/exist or not
    const postExist = await Post.exists({ _id : req.params.postId });

    if (!postExist) {
      return res.status(404).json({ error: "Post not exist!" });
    }

    // Remove like if exist
    const removeLike = await Like.findOneAndDelete({
      owner: req.user._id,
      post: req.params.postId,
    });

    if (removeLike) {
      // Decrement likeCounter in the post
      await Post.updateOne({ _id : req.params.postId }, { $inc : { likeCounter : -1 } });

      // Send like status of post
      res.status(200).json({ liked: false });
    } else {
      // Create like and Save
      await Like.create({
        owner: req.user._id,
        post: req.params.postId,
      });

      // Decrement likeCounter in the post
      await Post.updateOne({ _id : req.params.postId }, { $inc : { likeCounter : 1 } });

      // Send like status of post
      res.status(200).json({ liked: true });
    }
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "You are trying to like a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Get like status
exports.getLikeStatus = async (req, res) => {
  try {
    // Check like or not
    const liked = await Like.exists({ owner : req.user._id, post : req.params.postId });
    if (liked) {
      // Send Post liked status
      return res.json({ liked : true });
    }

    // Send Post not liked status
    res.json({ liked : false });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};