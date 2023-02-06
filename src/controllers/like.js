const Like = require("../models/Like");
const Post = require("../models/Post");
const tryCatch = require("../middleware/tryCatch");
const ErrorHandler = require("../utils/errorHandler");


// LIEK/DISLIKE A POST
exports.likeAndDislike = tryCatch(async (req, res) => {
  // Check post is valid/exist or not
  const postExist = await Post.exists({ _id : req.params.postId });

  if (!postExist) {
    throw new ErrorHandler("not_found", "Post not exist!", 404);
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
    // Create and Save like and decrement likeCounter in the post, resolve parallely
    await Promise.all([
      Like.create({ owner: req.user._id, post: req.params.postId }),
      Post.updateOne({ _id : req.params.postId }, { $inc : { likeCounter : 1 } })
    ])

    // Send like status of post
    res.status(200).json({ liked: true });
  }
});


// GET LIKE STATUS
exports.getLikeStatus = tryCatch(async (req, res) => {
  // Check like or not
  const liked = await Like.exists({ owner : req.user._id, post : req.params.postId });
  if (liked) {
    // Send Post liked status
    return res.json({ liked : true });
  }

  // Send Post not liked status
  res.json({ liked : false });
});