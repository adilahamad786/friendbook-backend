const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const tryCatch = require("../middleware/tryCatch");
const ErrorHandler = require("../utils/errorHandler");


// CREATE/ADD A POST
exports.add = tryCatch(async (req, res) => {
  // Check post creation requirements
  if (!req.body.message && !req.file) {
    throw new ErrorHandler("bad_request", "For creating a post required a message or an image!", 400);
  }
  
  // Create a Post
  const createdPost = new Post({
    owner: req.user._id,
    message: req.body?.message,
    image: req?.file
  });
  
  // Add imageUrl if provide an image
  if (req?.file)
    createdPost.imageUrl = `/api/post/${createdPost._id}`;
  
  // Save createdPost
  await createdPost.save();

  // Prepair newComment object for response
  newPost = createdPost.toObject()
  newPost.owner = {
    _id : req.user._id,
    username: req.user.username,
    profilePictureUrl : req.user.profilePictureUrl
  }

  // Delete unwanted fields from newPost
  delete newPost.image;
  delete newPost.__v; 

  // Send newPost as response
  res.status(201).json(newPost);
});


// UPDATE A POST
exports.update = tryCatch(async (req, res) => {
  // Check post update requirements
  if (!req.body.message && !req.file) {
    throw new ErrorHandler("bad_request", "For updating a post required a message or an image!", 400);
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
    throw new ErrorHandler("bad_request", "You can update only your post!", 400);
  }
    
  // Prepair newPost object for response
  updatedPost = post.toObject();
  req.body?.message && (updatedPost.message = req.body?.message);
  updatedPost.owner = {
    _id : req.user._id,
    username: req.user.username,
    profilePictureUrl : req.user.profilePictureUrl
  }

  // Send updated post as response
  res.json(updatedPost);
});


// DELETE A POST
exports.delete = tryCatch(async (req, res) => {
  // Delete post if exist in database
  const post = await Post.findOneAndDelete({
    _id: req.params.postId,
    owner: req.user._id,
  });

  // Send response if post not found or not delete
  if (!post) {
    throw new ErrorHandler("bad_request", "You can delete only your post!", 400);
  }

  // Remove likes and comments of post, resolve parallely
  await Promise.all([
    Like.deleteMany({ post: post._id }),
    Comment.deleteMany({ post: post._id })
  ]);

  // Send deleted postId as response 
  res.json({ postId: post._id });
});


// GET/FETCH USER ALL POSTS
exports.getUserPosts = tryCatch(async (req, res) => {
  // Fetch all user post from database
  const userPosts = await Post.find({ owner: req.params.userId }, { image : 0 , __v : 0})
  .populate({ path : "owner", select : "_id username profilePictureUrl" })
  .sort({ _id: -1, });
  
  // Send all user posts as response
  res.json(userPosts);
});


// GET/FETCH ALL TIMELINE POSTS
exports.getAllTimelinePosts = tryCatch(async (req, res) => {
  // Fetch all Time line post
  const posts = await Post.find({}, { image : 0 , __v : 0})
    .populate({ path : "owner", select : "_id username profilePictureUrl" })
    .sort({ _id: -1 });

  // Send all timeline posts as response
  res.status(200).json(posts);
});


// GET/SERVER POST IMAGE BY URL LINK
exports.servePostImage = tryCatch(async (req, res) => {
  // Fetching post image from database
  const post = await Post.findById(req.params.postId, { image: 1, _id: 0 });

  // Check image found or not
  if (!post || !post.image) {
    throw new ErrorHandler("not_found", "Post image not found!", 404);
  }

  // Set content-type and response as image buffer
  res.set("Content-Type", post.image.mimetype);
  res.send(post.image.buffer.buffer);
});
