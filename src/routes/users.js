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
    if (error.reason) {
      res.status(500).json({ error: error._message });
    }
    else {
      res.status(400).json({ error : error.message });
    }
  }
});

// LOGOUT
router.get("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((tokenObject) => {
      return tokenObject.token !== req.token;
    });

    await req.user.save();
    res.json({ message: "Logout account succesfully!" });
  } catch (error) {
    if (error.reason) {
      res.status(500).json({ error: error._message });
    }
    else {
      res.status(400).json({ error : error.message });
    }
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
    try {
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

      updateRequest.forEach((update) => (req.user[update] = req.body[update]));

      if (req.files?.profilePicture) {
        req.user.profilePicture = req.files.profilePicture[0];
        req.user.hasProfilePicture = true;
      }

      if (req.files?.coverPicture) {
        req.user.coverPicture = req.files.coverPicture[0];
        req.user.hasCoverPicture = true;
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
      req.user.story = req.file;

      if (req.user.story) {
        req.user.hasStory = true;
      }
      else {
        req.user.hasStory = false;
      }

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

// GET ALL TIMELINE STORIES
router.get('/story/timeline', auth, async (req, res) => {
  try {
    let friendIds = [... new Set([...req.user.followings, ...req.user.followers])];
    let stories = [];

    for (friendId of friendIds) {
      const friend = await User.findById(friendId);
      friend.hasStory && stories.push({ _id : friend._id, username : friend.username, hasStory: friend.hasStory });
    }

    res.json(stories)
  }
  catch (error) {
    res.status(500).json({ error : error._message });
  }
});

// GET USER STORY IMAGE
router.get("/story/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user.hasStory) {
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
    const users = await User.find({$nor:[{$and:[{'_id': req.user._id}]}]});
    const userList = users.map((user) => {
      return { _id: user._id, username: user.username, hasProfilePicture : user.hasProfilePicture };
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
      const { _id, username, hasProfilePicture } = following;
      followingList.push({ _id, username, hasProfilePicture, followMe : false });
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
      const { _id, username, hasProfilePicture } = follower;
      followerList.push({ _id, username, hasProfilePicture, followMe : true });
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

// GET FOLLOW STATUS
router.get("/follow-status/:userId", auth, async (req, res) => {
  try {
    const hasFollowed = req.user.followings.includes(req.params.userId);
    res.json({ hasFollowed });
  }
  catch (error) {
    res.status(500).json({ error: error._message });
  }
});

// GET ALL FRIENDS
router.get("/friends/:userId", auth, async (req, res) => {
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
      const { _id, username, hasProfilePicture } = following;
      followingList.push({ _id, username, hasProfilePicture, followMe : false });
    });

    const followers = await Promise.all(
      user.followers.map((followerId) => {
        return User.findById(followerId);
      })
    );

    let followerList = [];

    followers.map((follower) => {
      const { _id, username, hasProfilePicture } = follower;
      followerList.push({ _id, username, hasProfilePicture, followMe : true });
    });

    let friendList = [...followerList, ...followingList];
    // remove duplicate friends from allFriends
    friendList = [...friendList.reduce((map, friend) => map.set(friend._id.toString(), friend), new Map()).values()];

    res.status(200).json(friendList.sort());
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Invalid user followings!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// FOLLOW/UNFOLLOW A USER
router.put("/follow-unfollow/:userId", auth, async (req, res) => {
  if (req.params.userId !== req.user._id.toString()) {
    try {
      const user = await User.findById(req.params.userId);
      const currentUser = req.user;

      if (currentUser.followings.includes(req.params.userId)) {
        await user.updateOne({
          $pull: { followers: req.user._id.toString() },
        });
        await currentUser.updateOne({
          $pull: { followings: req.params.userId },
        });

        return res.json({ hasFollow : false });
      }
      else {
        await user.updateOne({
          $push: { followers: req.user._id.toString() },
        });
        await currentUser.updateOne({
          $push: { followings: req.params.userId },
        });

        return res.json({ hasFollow : true });
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

// REMOVE USER
router.put("/remove/:userId", auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(400).json({ error : "Unable to remove!" });
    }

    currentUser.followings = currentUser.followings.filter(followingId => followingId !== req.params.userId);
    currentUser.followers = currentUser.followers.filter(followerId => followerId !== req.params.userId);
    await currentUser.save();

    user.followings = user.followings.filter(followingId => followingId !== req.user._id.toString());
    user.followers = user.followers.filter(followerId => followerId !== req.user._id.toString());
    await user.save();

    res.json({ removed : true });
  }
  catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "User not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
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
      post.commentCounter -= 1;
      await post.save();
    });

    // Remove actual user comments from comment model
    await Comment.deleteMany({ owner : req.user._id });

    // Getting all user likes
    const likes = await Like.find({ owner: req.user._id });

    // Remove user likes from posts
    likes.map(async (like) => {
      const post = await Post.findById(like.post);
      post.likes.pull(req.user._id.toString());
      await post.save();
    });
  
    // Remove actual user likes from like model
    await Like.deleteMany({ owner: req.user._id });

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
    res.status(500).json({ error: error._message });
  }
});

// Suggestion for User
router.get("/suggestion", auth, async (req, res) => {
  try {
    let suggestionList = [];

    // getting all followers and followings Id's of user followers
    for (let followerId of req.user.followers) {
      const follower = await User.findById(followerId);
      suggestionList = [...suggestionList, ...follower.followers, ...follower.followings];
    }

    // getting all followers and followings Id's of user followings
    for (let followingId of req.user.followings) {
      const following = await User.findById(followingId);
      suggestionList = [...suggestionList, ...following.followers, ...following.followings];
    }

    // remove duplicate Id from suggestionList
    suggestionList = [...new Set(suggestionList)];

    // remove userId, user followersId and followingsId from suggestionList
    suggestionList = suggestionList.filter( suggest => {
      return !(req.user.followers.includes(suggest) || req.user.followings.includes(suggest) || req.user._id.toString() === suggest);
    });

    suggestUsers = [];

    for (let suggest of suggestionList) {
      const user = await User.findById(suggest);
      suggestUsers.push({ _id : user._id, username : user.username, hasProfilePicture : user.hasProfilePicture });
    }

    res.json(suggestUsers);
  }
  catch (error) {
    res.status(500).json({ error : error._message });
  }
});

module.exports = router;
