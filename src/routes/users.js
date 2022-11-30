const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// REGISTER/CREATE/SIGNUP A USER
router.post("/signup", async (req, res) => {
  // Create a user
  const user = new User(req.body);
  // Generate a jwt token
  const token = await user.generateAuthToken();

  try {
    // Save user and respond
    await user.save();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(500).send(error);
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

    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// LOGOUT
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((tokenObject) => {
      return tokenObject.token !== req.token;
    });

    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

// UPDATE USER
router.put("/me", auth, async (req, res) => {
  const updateRequest = Object.keys(req.body);

  const allowedUpdate = [
    "username",
    "email",
    "password",
    "age",
    "profilePicture",
    "coverPicture",
    "description",
    "city",
    "from",
    "relationship",
  ];

  const isValidUpdate = updateRequest.every((update) =>
    allowedUpdate.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid update!" });
  }

  try {
    updateRequest.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// DELETE USER
router.delete("/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET ALL USER
router.get("/allUsers", auth, async (req, res) => {
  const users = await User.find();

  try {
    const userList = users.map((user) => {
      return { username: user.username, profilePicture: user.profilePicture };
    });
    res.status(200).json(userList);
  } catch (err) {
    res.status(500).json(err);
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
    const { password, tokens, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL FOLLOWINGS
router.get("/followings/:userId", auth, async (req, res) => {
  const user = await User.findById(req.params.userId);

  try {
    const followings = await Promise.all(
      user.followings.map((followingId) => {
        return User.findById(followingId);
      })
    );

    let followingList = [];
    followings.map((following) => {
      const { _id, username, profilePicture } = following;
      followingList.push({ _id, username, profilePicture });
    });
    res.status(200).json(followingList);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET ALL FOLLOWERS
router.get("/followers/:userId", auth, async (req, res) => {
  const user = await User.findById(req.params.userId);

  try {
    const followers = await Promise.all(
      user.followers.map((followerId) => {
        return User.findById(followerId);
      })
    );

    let followerList = [];
    followers.map((follower) => {
      const { _id, username, profilePicture } = follower;
      followerList.push({ _id, username, profilePicture });
    });
    res.status(200).json(followerList);
  } catch (error) {
    res.status(500).json(error);
  }
});

// FOLLOW A USER
router.put("/:id/follow", auth, async (req, res) => {
  if (req.params.id || req.user._id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user._id);

      if (!currentUser.followings.includes(req.params.id)) {
        await user.updateOne({
          $push: { followers: req.user._id },
        });
        await currentUser.updateOne({
          $push: { followings: req.params.id },
        });
        res.status(200).json("User has been followed!");
      } else {
        res.status(403).json("You already follow this user!");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json("Unable to follow this user!");
  }
});

// UNFOLLOW A USER
router.put("/:id/unfollow", auth, async (req, res) => {
  if (req.params.id || req.user._id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user._id);

      if (currentUser.followings.includes(req.params.id)) {
        await user.updateOne({
          $pull: { followers: req.user._id },
        });
        await currentUser.updateOne({
          $pull: { followings: req.params.id },
        });
        res.status(200).json("User has been unfollowed!");
      } else {
        res.status(403).json("You already unfollow this user!");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json("Unable to unfollow this user!");
  }
});

module.exports = router;
