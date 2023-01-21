const router = require("express").Router();
const auth = require("../middleware/auth");
const Like = require("../models/Like");
const Post = require("../models/Post");

// LIKE/DISLIKE A POST
router.put("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post not exist!" });
    }

    const hasLiked = await Like.findOne({
      owner: req.user._id,
      post: req.params.postId,
    });

    if (hasLiked) {
      await Like.findOneAndDelete({
        owner: req.user._id,
        post: req.params.postId,
      });

      post.likes.pull(req.user._id.toString());
      await post.save()
      
      res.status(200).json({ likes : post.likes, hasLiked : false });
    } else {
      const like = await Like({
        owner: req.user._id,
        post: req.params.postId,
      });

      post.likes.push(req.user._id.toString());
      await post.save();
      await like.save();
      res.status(200).json({ likes : post.likes, hasLiked : true });
    }
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "You are trying to like a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

module.exports = router;
