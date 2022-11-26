const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// UPDATE USER
router.put('/:id', async (req, res) => {
    if (req.params.id == req.body.userId || req.body.isAdmin) {
        try {
            if (req.body.password) {
                const salt = await bcrypt.genSalt(req.body.password, salt);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            }
        }
        catch (error) {
            res.status(500).json(error);
        }
        try {
            const user = await User.findByIdAndUpdate(req.body.userId, {
                $set : req.body
            });
            res.status(200).json("Account has been updated!");
        }
        catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        res.status(403).json("You can update only your account!");
    }
});


// DELETE USER
router.delete('/:id', async (req, res) => {
    if (req.params.id == req.body.userId || req.body.isAdmin) {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account has been deleted!");
        }
        catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        res.status(403).json("You can delete only your account!");
    }
});

// GET A USER
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, updatedAt, ...other} = user._doc;
        res.status(200).json(other);
    }
    catch (error) {
        res.status(500).json(error);
    }
});

// FOLLOW A USER
router.put('/:id/follow', async (req, res) => {
    if (req.params.id || req.body.userId) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);

            if (!currentUser.followings.includes(req.params.id)) {
                await user.updateOne({
                    $push : { followers : req.body.userId }
                });
                await currentUser.updateOne({
                    $push : { followings : req.params.id }
                });
                res.status(200).json("User has been followed!");
            }
            else {
                res.status(403).json("You already follow this user!");
            }
        }
        catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        res.status(403).json("Unable to follow this user!");
    }
});

// UNFOLLOW A USER
router.put('/:id/unfollow', async (req, res) => {
    if (req.params.id || req.body.userId) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);

            if (currentUser.followings.includes(req.params.id)) {
                await user.updateOne({
                    $pull : { followers : req.body.userId }
                });
                await currentUser.updateOne({
                    $pull : { followings : req.params.id }
                });
                res.status(200).json("User has been unfollowed!");
            }
            else {
                res.status(403).json("You already unfollow this user!");
            }
        }
        catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        res.status(403).json("Unable to unfollow this user!");
    }
});

module.exports = router;