const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");

// CREATE A POST
router.post("/", auth, async (req, res) => {
  try {
    const newPost = new Post({
      description: req.body.description,
      img: req.body.img,
      owner: req.user._id,
    });
    const savePost = await newPost.save();
    res.status(201).json(savePost);
  } catch (error) {
    res.status(400).json(error);
  }
});

// UPDATE A POST
router.patch("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!post) {
      return res.status(404).send();
    }
    const updates = Object.keys(req.body);
    const allowedUpdate = ["description", "img"];
    const isValidUpdate = updates.every((update) =>
      allowedUpdate.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).send({ error: "Invalid update" });
    }

    updates.forEach((update) => (post[update] = req.body[update]));

    await post.save();
    res.send(post);
  } catch (error) {
    res.status(400).json(error);
  }
});

// DELETE A POST
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!post) {
      return res.status(404).send();
    }

    res.send(post);
  } catch (error) {
    res.status(500).json(error);
  }
});

// LIKE/DISLIKE A POST
router.put("/:id/like", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).send();
  }

  try {
    if (!post.likes.includes(req.user._id)) {
      await post.updateOne({ $push: { likes: req.user._id } });
      res.status(200).json("Post has been liked!");
    } else {
      await post.updateOne({ $pull: { likes: req.user._id } });
      res.status(200).json("Post has been disliked!");
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// GET A POST
router.get("/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).send();
  }

  try {
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET ALL/TIMELINE POST
router.get("/timeline/all", auth, async (req, res) => {
  try {
    // // Get all my post
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
    res.status(500).json(error);
  }
});

module.exports = router;
