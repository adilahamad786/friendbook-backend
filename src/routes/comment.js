const router = require("express").Router();
const auth = require("../middleware/auth");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

// CREATE/ADD A COMMENT
router.post("/add/:postId", auth, async (req, res) => {
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

    const addComment = new Comment({
      owner: req.user._id,
      post: req.params.postId,
      message: req.body.message,
    });

    await addComment.save();

    await post.updateOne({
      $push: { comments: addComment._id.toString() },
    });

    res.status(201).json(addComment);
  } catch (error) {
    if (error.reason) {
      res
        .status(400)
        .json({ error: "You are trying to comment a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

router.patch('/update/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({error : "Comment not found!"});
    }

    if (!req.body?.message) {
      return res.status(400).json({ error : "Invalid update!" });
    }

    comment.message = req.body.message;
    await comment.save();

    res.json(comment);
  }
  catch (error) {
    if (error.reason) {
      return res.status(400).json({error : "Comment not found!"});
    }
    else {
      res.status(500).json({ error : error._message });
    }
  }
});

// DELETE A COMMENT
router.delete("/remove/:postId", auth, async (req, res) => {
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
    await post.updateOne({
      $pull: { comments: deletedComment._id.toString() },
    });

    res.json({ message: "Comment successfully deleted!" });
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "You can delete only your comment!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET ALL POST RELATED COMMENTS
router.get("/post/:postId", auth, async (req, res) => {
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
});

module.exports = router;
