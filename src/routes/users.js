const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require('../models/Like');
const auth = require("../middleware/auth");
const uploadFile = require("../middleware/uploadFile");

// REGISTER/CREATE/SIGNUP A USER
router.post("/register", async (req, res) => {
  try {
    // Create a user
    const user = new User(req.body);
    // Generate a jwt token
    await user.generateAuthToken();
    // Save user and respond
    await user.save();
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    if (error.keyPattern) {
      res.status(400).json({ error: "Email is already exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// LOGIN/SIGNIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
});

// LOGOUT
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((tokenObject) => {
      return tokenObject.token !== req.token;
    });

    await req.user.save();
    res.json({ message: "Logout account succesfully!" });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
});

// UPDATE USER
router.patch(
  "/update",
  auth,
  uploadFile.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ]),
  async (req, res) => {
    const updateRequest = Object.keys(req.body);

    const allowedUpdate = [
      "username",
      "description",
      "age",
      "gender",
      "relationship",
      "location",
      "facebook",
      "linkedIn",
      "twitter",
      "instagram",
      "pinterest",
    ];

    const isValidUpdate = updateRequest.every((update) =>
      allowedUpdate.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).json({ error: "Invalid update!" });
    }

    try {
      updateRequest.forEach((update) => (req.user[update] = req.body[update]));

      if (req.files?.profilePicture) {
        req.user.profilePicture = req.files.profilePicture[0];
      }

      if (req.files?.coverPicture) {
        req.user.coverPicture = req.files.coverPicture[0];
      }

      await req.user.save();

      res.json(req.user);
    } catch (error) {
      res.status(500).json({ error: error._message });
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// GET USER PROFILEPICTURE
router.get("/profile-picture/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user || !user.profilePicture) {
      return res.status(404).json({ error: "Profile picture not found!" });
    }

    res.set("Content-Type", user.profilePicture.mimetype);
    res.send(user.profilePicture.buffer.buffer);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Profile picture not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET USER COVERPICTURE
router.get("/cover-picture/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user || !user.coverPicture) {
      return res.status(400).json({ error: "Cover picture not found!" });
    }

    res.set("Content-Type", user.coverPicture.mimetype);
    res.send(user.coverPicture.buffer.buffer);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Cover picture not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// CREATE OR UPDATE OR DELETE A STORY
router.put(
  "/create-story",
  auth,
  uploadFile.single("story"),
  async (req, res) => {
    try {
      req.user.story = req?.file;

      await req.user.save();
      res.status(201).json({ message: "Story updated!" });
    } catch (error) {
      res.status(500).json({ error: error._message });
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// GET USER STORY
router.get("/story/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user || !user.story) {
      return res.status(404).json({ error: "Story not found!" });
    }

    res.set("Content-Type", user.story.mimetype);
    res.send(user.story.buffer.buffer);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Story not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET USER ITSELF
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    res.status(200).json(user);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "User not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET A USER
router.get("/", auth, async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    res.status(200).json(user);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "User not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET ALL USERS
router.get("/all-users", auth, async (req, res) => {
  try {
    const users = await User.find();
    const userList = users.map((user) => {
      return { _id: user._id, username: user.username };
    });
    res.status(200).json(userList);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
});

// GET ALL FOLLOWINGS
router.get("/followings/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(400).json({ error: "Invalid user followings!" });
    }

    const followings = await Promise.all(
      user.followings.map((followingId) => {
        return User.findById(followingId);
      })
    );

    let followingList = [];

    followings.map((following) => {
      const { _id, username } = following;
      followingList.push({ _id, username });
    });

    res.status(200).json(followingList);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Invalid user followings!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET ALL FOLLOWERS
router.get("/followers/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(400).json({ error: "Invalid user followers!" });
    }

    const followers = await Promise.all(
      user.followers.map((followerId) => {
        return User.findById(followerId);
      })
    );

    let followerList = [];

    followers.map((follower) => {
      const { _id, username } = follower;
      followerList.push({ _id, username });
    });

    res.status(200).json(followerList);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Invalid user followers!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// FOLLOW/UNFOLLOW A USER
router.put("/follow-unfollow/:userId", auth, async (req, res) => {
  if (req.params.userId !== req.user._id) {
    try {
      const user = await User.findById(req.params.userId);
      const currentUser = await User.findById(req.user._id);

      if (currentUser.followings.includes(req.params.userId)) {
        await user.updateOne({
          $pull: { followers: req.user._id.toString() },
        });
        await currentUser.updateOne({
          $pull: { followings: req.params.userId },
        });

        return res.json({ message: "User unfollowed!" });
      } else {
        await user.updateOne({
          $push: { followers: req.user._id.toString() },
        });
        await currentUser.updateOne({
          $push: { followings: req.params.userId },
        });

        return res.json({ message: "User followed!" });
      }
    } catch (error) {
      if (error.reason) {
        res.status(400).json({ error: "User not found!" });
      } else {
        res.status(500).json({ error: error._message });
      }
    }
  } else {
    res.status(403).json({ error: "You can't follow yourself!" });
  }
});

// DELETE USER
router.delete("/delete", auth, async (req, res) => {
  try {
    // Getting all user comments
    const comments = await Comment.find({ owner: req.user._id });

    // Remove user comments from posts
    comments.map(async (comment) => {
      const post = await Post.findById(comment.post);
      await post.updateOne({
        $pull: { comments: comment._id.toString() },
      });
    });

    // Remove actual user comments from comment model
    await Comment.deleteMany({ owner : req.user._id });

    // Getting all user likes
    const likes = await Like.find({ owner: req.user._id });

    // Remove user likes from posts
    likes.map(async (like) => {
      const post = await Post.findById(like.post);
      await post.updateOne({
        $pull: { likes: like._id.toString() },
      });
    });

    // Delete all user post
    await Post.deleteMany({ owner: req.user._id });

    // Remove user followings
    req.user.followings.map(async (followingId) => {
      const followingUser = await User.findById(followingId);
      await followingUser.updateOne({
        $pull: { followers: req.user._id.toString() },
      });
    });

    // Remove user followers
    req.user.followers.map(async (followerId) => {
      const followerUser = await User.findById(followerId);
      await followerUser.updateOne({
        $pull: { followings: req.user._id.toString() },
      });
    });

    await req.user.remove();
    res.json({ message: "Account deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error._message });
  }
});

module.exports = router;
