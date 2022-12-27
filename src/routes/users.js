const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");

// REGISTER/CREATE/SIGNUP A USER
router.post("/register", async (req, res) => {
  try {
    // Create a user
    const user = new User(req.body);
    // Generate a jwt token
    const token = await user.generateAuthToken();
    // Save user and respond
    await user.save();
    res.status(201).json({ user, token });
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
    res.status(400).json({ error: error.message });
  }
});

// LOGOUT
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((tokenObject) => {
      return tokenObject.token !== req.token;
    });

    await req.user.save();
    res.json({ logout: true });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
});

// CREATE A MULTER MIDDLEWARE FOR FILES HANDLING
const upload = multer({
  limits: {
    fileSize: 3000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      cb(new Error("Please upload an image file only (png/jpg/jpeg)!"));
    }

    cb(undefined, true);
  },
});

// UPDATE USER
router.put(
  "/update",
  auth,
  upload.fields([
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

      const {
        profilePicture,
        coverPicture,
        story,
        password,
        tokens,
        updatedAt,
        createdAt,
        isAdmin,
        ...other
      } = req.user._doc;
      console.log(other);
      res.json(other);
    } catch (error) {
      res.status(500).json({ error: error._message });
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// GET USER PROFILEPICTURE
router.get("/profile-picture/:id", auth, async (req, res) => {
  try {
    const user = req.params.id
      ? await User.findById(req.params.id)
      : await User.findById(req.user._id);

    if (!user || !user.profilePicture) {
      return res.status(400).json({ error: "Profile picture not found!" });
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
router.get("/cover-picture/:id", auth, async (req, res) => {
  try {
    const user = req.params.id
      ? await User.findById(req.params.id)
      : await User.findById(req.user._id);

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

// UPDATE OR CREATE A STORY
router.put("/create-story", auth, upload.single("story"), async (req, res) => {
  try {
    req.user.story = req?.file;

    await req.user.save();
    res.status(201).json({ message: "Story updated!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error._message });
  }
});

// GET USER STORY
router.get("/story/:id", auth, async (req, res) => {
  try {
    const user = req.params.id
      ? await User.findById(req.params.id)
      : await User.findById(req.user._id);

    if (!user || !user.story) {
      return res.status(400).json({ error: "Story not found!" });
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

// DELETE USER
router.delete("/delete", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error._message });
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

    const { password, tokens, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "User not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
});

// GET ALL USER
router.get("/all-users", auth, async (req, res) => {
  try {
    const users = await User.find();
    const userList = users.map((user) => {
      return { username: user.username, profilePicture: user.profilePicture };
    });
    res.status(200).json(userList);
  } catch (err) {
    res.status(500).json({ error: error._message });
  }
});

// GET ALL FOLLOWINGS
router.get("/followings/:userId", auth, async (req, res) => {
  try {
    const user = req.params.userId
      ? await User.findById(req.params.userId)
      : await User.findById(req.user._id);

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
      const { _id, username, profilePicture } = following;
      followingList.push({ _id, username, profilePicture });
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
    const user = req.params.userId
      ? await User.findById(req.params.userId)
      : await User.findById(req.user._id);

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
      const { _id, username, profilePicture } = follower;
      followerList.push({ _id, username, profilePicture });
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

// FOLLOW A USER
router.put("/:id/follow", auth, async (req, res) => {
  if (req.params.id !== req.user._id) {
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
        res.status(200).json({ follow: true });
      } else {
        res.status(403).json({ error: "You already follow this user!" });
      }
    } catch (error) {
      if (error.reason) {
        res.status(400).json({ error: "Invalid follower!" });
      } else {
        res.status(500).json({ error: error._message });
      }
    }
  } else {
    res.status(403).json({ error: "Unable to follow this user!" });
  }
});

// UNFOLLOW A USER
router.put("/:id/unfollow", auth, async (req, res) => {
  if (req.params.id !== req.user._id) {
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
        res.status(200).json({ unfollow: true });
      } else {
        res.status(403).json({ error: "You already unfollow this user!" });
      }
    } catch (error) {
      if (error.reason) {
        res.status(400).json({ error: "Invalid follower!" });
      } else {
        res.status(500).json({ error: error._message });
      }
    }
  } else {
    res.status(403).json({ error: "Unable to unfollow this user!" });
  }
});

module.exports = router;
