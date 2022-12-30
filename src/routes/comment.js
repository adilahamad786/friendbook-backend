const router = require('express').Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// CREATE/ADD A COMMENT
router.post('/add/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({error : "You are trying to comment a invalid post!"});
        }

        const addComment = new Comment({
            owner : req.user._id,
            post : req.params.id,
            message : req.body.message
        });

        await addComment.save();
        
        await post.updateOne({
            $push : {
                comments : {
                    comment : addComment._id,
                }
            }
        });

        res.status(201).json({ message : "Comment added!"});
    }
    catch (error) {
        if (error.reason) {
            res.status(400).json({error : "You are trying to comment a invalid post!"});
        }
        else {
            res.status(500).json({error : error._message});
        }
    }
});

// DELETE A COMMENT
router.delete('/remove/:id', auth, async (req, res) => {
    try {
        const deletedComment = await Comment.findOneAndDelete({ 
            _id : req.params.id,
            owner : req.user._id
        });

        console.log(deletedComment);
        
        if (!deletedComment) {
            return res.status(400).json({error : "You can delete only your comment!"});
        }

        const post =  await Post.findById(deletedComment.post);

        const deletedCommentPost = await post.updateOne({ $pull : { comments : { comment : deletedComment._id} } });

        await post.save()

        console.log(deletedCommentPost);

        res.json({ message : "Comment successfully deleted!"});
    }
    catch (error) {
        console.log(error);
        if (error.reason) {
            res.status(400).json({error : "You can delete only your comment!"})
        }
        else {
            res.status(500).json({error : error._message});
        }
    }
});

module.exports = router;