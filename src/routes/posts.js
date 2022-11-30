// const router = require('express').Router();
// const Post = require('../models/Post');
// const User = require('../models/User');
// const { findById } = require('../models/User');

// // CREATE A POST
// router.post('/', async (req, res) => {
//     try {
//         newPost = new Post(req.body);
//         const savePost = await newPost.save();
//         res.status(200).json(savePost);
//     }
//     catch (error) {
//         res.status(500).json(error);
//     }
// });

// // UPDATE A POST
// router.put('/:id', async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (post.userId === req.body.userId) {
//             await post.updateOne({ $set : req.body });
//             res.status(200).json("Post successfully updated!");
//         }
//         else {
//             res.status(403).json("You can update only your post!");
//         }
//     }
//     catch (error) {
//         res.status(500).json(error);
//     }
// });

// // DELETE A POST
// router.delete('/:id', async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (post.userId === req.body.userId) {
//             await post.deleteOne();
//             res.status(200).json("Post successfully deleted!");
//         }
//         else {
//             res.status(403).json("You can delete only your post!");
//         }
//     }
//     catch (error) {
//         res.status(500).json(error);
//     }
// });

// // LIKE/DISLIKE A POST
// router.put('/:id/like', async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post.likes.includes(req.body.userId)) {
//             await post.updateOne({ $push : { likes : req.body.userId } });
//             res.status(200).json("Post has been liked!");
//         }
//         else {
//             await post.updateOne({ $pull : { likes : req.body.userId } });
//             res.status(200).json("Post has been disliked!")
//         }
//     }
//     catch (error) {
//         res.status(500).json(error);
//     }
// });

// // GET A POST
// router.get('/:id', async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         res.status(200).json(post);
//     }
//     catch (error) {
//         res.status(500).json(error);
//     }
// });

// // GET ALL/TIMELINE POST
// router.get('/timeline/all', async (req, res) => {
//     try {
//         const currentUser = await User.findById(req.body.userId);
//         const userPosts = await Post.find({ userId : currentUser._id });
//         const friendPosts = await Promise.all(
//             currentUser.followings.map( friendId => {
//                 return Post.find({ userId : friendId });
//             })
//         );

//         console.log("userPosts : ", userPosts)
//         console.log("friendPosts : ", friendPosts)

//         const allTimelinePosts = userPosts.concat(friendPosts);
//         res.status(200).json(allTimelinePosts);
//     }
//     catch (error) {
//         res.status(500).json(error);
//     }
// });

// module.exports = router;
