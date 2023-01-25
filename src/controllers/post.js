const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");

// Create/Add a post
exports.add = async (req, res) => {
  if (!req.body.message && !req.file) {
    return res.status(400).json({
      error: "For creating a post required a message or an image!",
    });
  }

  let hasImage = false;
  if (req.file) hasImage = true;

  try {
    const newPost = new Post({
      message: req.body.message,
      image: req.file,
      owner: req.user._id,
      username: req.user.username,
      hasProfilePicture: req.user.hasProfilePicture,
      profilePictureLink: req.user.profilePictureLink,
      hasImage,
    });

    newPost.imageLink = `/api/post/${newPost._id.toString()}`;

    const savePost = await newPost.save();
    res.status(201).json(savePost);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Update a post
exports.update = async (req, res) => {
  try {
    if (!req.body.message && !req.file) {
      return res.status(400).json({
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
      post.hasImage = true;
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
};

// Delete a post
exports.delete = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.postId,
      owner: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ error: "You can delete only your post!" });
    }

    await Like.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });

    res.json({ postId: post._id.toString() });
  } catch (error) {
    if (error.reason) {
      res
        .status(400)
        .json({ error: "You are trying to delete a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Get user all post
exports.getUserPosts = async (req, res) => {
  try {
    const userPosts = await Post.find({ owner: req.params.userId }).sort({
      _id: -1,
    });
    res.json(userPosts);
  } catch (error) {
    if (error.reason) {
      res
        .status(400)
        .json({ error: "You are trying to delete a invalid post!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Get all timeline posts
exports.getAllTimelinePosts = async (req, res) => {
  console.log("Start");
  try {
    const posts = await Post.find().sort({ _id: -1 });
    res.status(200).json(posts);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post not exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Get/Serve post image by url link
exports.servePostImage = async (req, res) => {
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
};
