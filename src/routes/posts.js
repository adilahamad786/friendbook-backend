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
    if (!req.body.message && !req.file) {
      return res
        .status(400)
        .json({
          error: "For creating a post required a message or an image!",
        });
    }

    let hasImage = false;
    if (req.file)
      hasImage = true;

    try {
      const newPost = new Post({
        message: req.body.message,
        image: req.file,
        owner: req.user._id,
        username: req.user.username,
        hasProfilePicture: req.user.hasProfilePicture,
        hasImage
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
    try {
      if (!req.body.message && !req.file) {
        return res
          .status(400)
          .json({
            error: "For updating a post required a description or an image!",
          });
      }

      const post = await Post.findOne({
        _id: req.params.postId,
        owner: req.user._id,
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found!" });
      }

      if (req.body.message) {
        post.message = req.body.message;
      }

      if (req.file) {
        post.image = req.file;
      }

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

// GET ALL/TIMELINE POST
router.get("/timeline", auth, async (req, res) => {
  console.log("Start");
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
    console.log(error);
    if (error.reason) {
      console.log(error)
      res.status(400).json({ error: "Post not exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET POST IMAGE
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post || !post.image) {
      return res.status(404).json({ error: "Post image not found!" });
    }

    res.set("Content-Type", post.image.mimetype);
    res.send(post.image.buffer.buffer);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post image not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

module.exports = router;
