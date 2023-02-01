const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");

// Create/Add a post
exports.add = async (req, res) => {
  try {
    // Check post creation requirements
    if (!req.body?.message && !req?.file) {
      return res.status(400).json({
        error: "For creating a post required a message or an image!",
      });
    }
    
    // Create a Post
    const createdPost = new Post({
      owner: req.user._id,
      message: req.body?.message,
      image: req?.file
    });
    
    // Add imageUrl if provide an image
    if (req?.file)
      createdPost.imageUrl = `/api/post/${createdPost._id.toString()}`;
    
    // Save createdPost
    await createdPost.save();

    // Prepair newComment object for response
    newPost = createdPost.toObject()
    newPost.owner = {
      _id : req.user._id,
      username: req.user.username,
      hasProfilePicture : req.user.hasProfilePicture,
      profilePictureLink : req.user.profilePictureLink
    }

    // Delete unwanted fields from newPost
    delete newPost.image;
    delete newPost.__v; 

    // Send newPost as response
    res.status(201).json(newPost);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Update a post
exports.update = async (req, res) => {
  try {
    // Check post update requirements
    if (!req.body.message && !req.file) {
      return res.status(400).json({
        error: "For updating a post required a description or an image!",
      });
    }
    
    // Update post according to provided update information
    let post, imageUrl = `/api/post/${req.params.postId}`;
    if (req.body?.message && req?.file) {
      post = await Post.findOneAndUpdate({ _id: req.params.postId, owner: req.user._id }, { message: req.body?.message, image: req?.file, imageUrl }, { select: "_id message likeCounter commentCounter imageUrl createdAt updatedAt" });
    } else if (req?.file) {
      post = await Post.findOneAndUpdate({ _id: req.params.postId, owner: req.user._id }, { image: req?.file, imageUrl }, { select: "_id message likeCounter commentCounter imageUrl createdAt" });
    } else {
      post = await Post.findOneAndUpdate({ _id: req.params.postId, owner: req.user._id }, { message: req.body?.message }, { select: "_id message likeCounter commentCounter imageUrl createdAt updatedAt" });
    }

    // Checking post is exist or not
    if (!post) {
      return res.status(404).json({ error: "You can update only your post!" });
    }
      
    // Prepair newPost object for response
    updatedPost = post.toObject();
    req.body?.message && (updatedPost.message = req.body?.message);
    updatedPost.owner = {
      _id : req.user._id,
      username: req.user.username,
      hasProfilePicture : req.user.hasProfilePicture,
      profilePictureLink : req.user.profilePictureLink
    }

    // Send updated post as response
    res.json(updatedPost);
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
    // Delete post if exist in database
    const post = await Post.findOneAndDelete({
      _id: req.params.postId,
      owner: req.user._id,
    });

    // Send response if post not found or not delete
    if (!post) {
      return res.status(404).json({ error: "You can delete only your post!" });
    }

    // Remove likes and comments of post
    await Like.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });

    // Send deleted postId as response 
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

// Get/Fetch user all post
exports.getUserPosts = async (req, res) => {
  try {
    // Fetch all user post from database
    const userPosts = await Post.find({ owner: req.params.userId }, { image : 0 , __v : 0})
    .populate({ path : "owner", select : "_id username hasProfilePicture profilePictureLink" })
    .sort({ _id: -1, });
    
    // Send all user posts as response
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

// Get/Fetch all timeline posts
exports.getAllTimelinePosts = async (req, res) => {
  try {
    // Fetch all Time line post
    const posts = await Post.find({}, { image : 0 , __v : 0})
      .populate({ path : "owner", select : "_id username hasProfilePicture profilePictureLink" })
      .sort({ _id: -1 });

    // Send all timeline posts as response
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
    // Fetching post image from database
    const post = await Post.findById(req.params.postId, { image: 1, _id: 0 });

    // Check image found or not
    if (!post || !post.image) {
      return res.status(404).json({ error: "Post image not found!" });
    }

    // Set content-type
    res.set("Content-Type", post.image.mimetype);

    // Send response as image
    res.send(post.image.buffer.buffer);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Post image not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};
