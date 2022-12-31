const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");
const uploadFile = require("../middleware/uploadFile");

// CREATE A POST
router.post(
  "/create",
  auth,
  uploadFile.single("image"),
  async (req, res) => {
    if (!req.body.description && !req.file) {
      return res
        .status(400)
        .json({
          error: "For creating a post required a description or an image!",
        });
    }

    try {
      const newPost = new Post({
        description: req.body.description,
        image: req.file,
        owner: req.user._id,
      });
      const savePost = await newPost.save();
      res.status(201).json(savePost);
    } catch (error) {
      res.status(500).json({ error: error._message });
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// UPDATE A POST
router.patch(
  "/update/:postId",
  auth,
  uploadFile.single("image"),
  async (req, res) => {
    if (!req.body.description && !req.file) {
      return res
        .status(400)
        .json({
          error: "For updating a post required a description or an image!",
        });
    }

    try {
      const post = await Post.findOne({
        _id: req.params.postId,
        owner: req.user._id,
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found!" });
      }

      const updates = Object.keys(req.body);
      const allowedUpdate = ["description"];

      const isValidUpdate = updates.every((update) =>
        allowedUpdate.includes(update)
      );

      if (!isValidUpdate) {
        return res.status(400).send({ error: "Invalid update" });
      }

      if (req.file) {
        post.image = req.file;
      }

      updates.forEach((update) => (post[update] = req.body[update]));

      await post.save();
      res.json(post);
    } catch (error) {
      if (error.reason) {
        res.status(400).json({ error: "Invalid post update!" });
      } else {
        res.status(500).json({ error: error._message });
      }
    }
  }
);

// DELETE A POST
router.delete("/delete/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.postId,
      owner: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ error: "You can delete only your post!" });
    }

    res.json({ message: "Post successfully deleted!" });
  } catch (error) {
    if (error.reason) {
      res
        .status(400)
        .json({ error: "You are trying to delete a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET A POST
router.get("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post not exist!" });
    }

    res.status(200).json(post);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post not exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET ALL/TIMELINE POST
router.get("/timeline", auth, async (req, res) => {
  try {
    // Get all my post
    const userPosts = await Post.find({ owner: req.user._id });

    // Get all followings post
    const followingPosts = await Promise.all(
      req.user.followings.map((followingId) => {
        return Post.find({ owner: followingId });
      })
    );

    // Get all followers post
    const followerPosts = await Promise.all(
      req.user.followers.map((followerId) => {
        return Post.find({ owner: followerId });
      })
    );

    const allTimelinePosts = userPosts
      .concat(...followingPosts)
      .concat(...followerPosts);

    res.status(200).json(allTimelinePosts);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post not exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

module.exports = router;
