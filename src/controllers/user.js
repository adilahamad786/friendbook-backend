const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require('../models/Like');
const VerificationSession = require("../models/VerificationSession");
const { sendAccountVerificationOtpOnEmail, sendForgotPasswordOtpOnEmail } = require("../services/email");

// Send OTP for email verification
exports.sendVerificationOtp = async (req, res) => {
  try {
    // Check email/account is exist or not in database
    const emailIsExist = await User.exists({ email: req.body.email }) ? true : false;

    if (emailIsExist) {
      return res.status(403).json({ error : "Account already exist!" });
    }

    // Find and delete old verificationSession if available for this email
    const oldVerificationSession = await VerificationSession.findOne({ email : req.body.email });

    if (oldVerificationSession) {
      await oldVerificationSession.remove();
    }

    // Generate 6-Digit OTP
    const otp = Math.floor(Math.random() * 899999 + 100000);

    // Create VerificationSession for current OTP and email, which is expire in 5 minutes
    await VerificationSession.create({ email: req.body.email, otp });

    // Send OTP on user email for account validation
    const info = await sendAccountVerificationOtpOnEmail(req.body.email, otp);
    
    if (!info.messageId)
      return res.status(200).json({ error : "Internal server error!" });
    
    res.status(200).json({ message : `Verification otp sent successfully on ${req.body.email}, Please check your email!` });
  }
  catch (error) {
    if (error.keyPattern) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
}

// Register a new user
exports.register = async (req, res) => {
  try {
    // check VerificationSession for email and OTP is valid or not, before saving user
    const isValidSession = await VerificationSession.findOne({ email: req.body.email, otp: req.body.otp });

    if (!isValidSession) {
      return res.status(403).json({ error : "Invalid OTP!" });
    }

    // Remove/Delete VerificationSession
    await isValidSession.remove()

    // Check all required information availability
    if (!(req.body.email && req.body.username && req.body.password)) {
      res.status(403).json({ error : "Username, Email and Passowrd must required for creating an account!"});
    }

    // Create a user
    const user = new User(req.body);

    // Generate a jwt token and save in database
    await user.generateAuthToken();

    // send response
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    if (error.keyPattern) {
      res.status(400).json({ error: "Email is already exist!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Login a user
exports.login = async (req, res) => {
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
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

// Forgot password
exports.sendForgotOtp = async (req, res) => {
  try {
    // check email/user is valid
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({error : "Account not found!"});
    }

    // Find and delete old verificationSession if available for this email
    const oldVerificationSession = await VerificationSession.findOne({ email : req.body.email });

    if (oldVerificationSession) {
      await oldVerificationSession.remove();
    }

    // Generate 6-Digit OTP
    const otp = Math.floor(Math.random() * 899999 + 100000);

    // Create VerificationSession for current OTP and email, which is expire in 5 minutes
    await VerificationSession.create({ email: req.body.email, otp });

    // Send OTP on user email for account validation
    const info = await sendForgotPasswordOtpOnEmail(req.body.email, otp);
    
    if (!info.messageId)
      return res.status(200).json({ error : "Internal server error!" });
    
      res.status(200).json({ message : `We have sent an OTP on your ${req.body.email}, for resetting your password, Please check your email.` });
  }
  catch (error) {
    if (error.reason) {
      res.status(500).json({ error: error._message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    // Check email/account is exist or not in database
    const emailIsExist = await User.exists({ email: req.body?.email }) ? true : false;

    if (!emailIsExist) {
      return res.status(400).json({error : "Account not Exist!"});
    }

    // Check VerificationSession OTP and email validity
    const otpIsValid = await VerificationSession.exists({ email: req.body?.email, otp: Number(req.body?.otp) }) ? true : false;

    if (!otpIsValid) {
      return res.status(403).json({ error : "Invalid OTP!" });
    }

    res.json({ otpIsVerified : otpIsValid });
  }
  catch (error) {
    if (error.reason) {
      res.status(500).json({ error: error._message || "Email and Otp Required"});
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // check email/user is valid
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({error : "Account not found!"});
    }

    // Check VerificationSession OTP and email validity
    const isValidSession = await VerificationSession.findOne({ email: user.email, otp: req.body.otp });

    if (!isValidSession) {
      return res.status(403).json({ error : "Session has expired!" });
    }

    // check password validity
    if (!(req.body.password.length >= 6)) {
      return res.status(400).json({ error : "Password must contain atleast 6-digit!" });
    }
    
    // Update password and save user
    user.password = req.body.password;
    await user.save()

    res.json({ message : "Password updated successfully!" });
  }
  catch (error) {
    if (error.reason) {
      res.status(500).json({ error: error._message });
    } else {
      res.status(400).json({ error: error.message });
    } 
  }
}

// Logout a user
exports.logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((tokenObject) => {
      return tokenObject.token !== req.token;
    });

    await req.user.save();
    res.json({ message: "Logout account succesfully!" });
  } catch (error) {
    if (error.reason) {
      res.status(500).json({ error: error._message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

// Update a user
exports.update = async (req, res) => {
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
      req.user.profilePictureLink =
        `/api/user/profile-picture/${req.user._id.toString()}`;
    }

    if (req.files?.coverPicture) {
      req.user.coverPicture = req.files.coverPicture[0];
      req.user.hasCoverPicture = true;
      req.user.coverPictureLink =
        `/api/user/cover-picture/${req.user._id.toString()}`;
    }

    await req.user.save();

    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get/Serve user profile-picture by url link
exports.serveUserProfilePicture = async (req, res) => {
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
};

// Get/Serve user cover-picture by url link
exports.serveUserCoverPicture = async (req, res) => {
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
};

// Create/Update/Delete a story
exports.createOrUpdateOrDeleteStroy = async (req, res) => {
  try {
    req.user.story = req.file;

    if (req.user.story) {
      req.user.hasStory = true;
      req.user.storyLink = `/api/user/story/${req.user._id.toString()}`;
    } else {
      req.user.hasStory = false;
      req.user.storyLink = "";
    }

    await req.user.save();
    res.status(201).json({ message: "Story updated!" });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get all timeline story
exports.getAllTimelineStory = async (req, res) => {
  try {
    let friendIds = [
      ...new Set([...req.user.followings, ...req.user.followers]),
    ];
    let stories = [];

    for (friendId of friendIds) {
      const friend = await User.findById(friendId);
      friend.hasStory &&
        stories.push({
          _id: friend._id,
          username: friend.username,
          storyLink: friend.storyLink
        });
    }

    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get/Serve user story image by url link
exports.serveStoryImage = async (req, res) => {
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
};

// Get user itself
exports.getMe = async (req, res) => {
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
};

// Get a user
exports.getUser = async (req, res) => {
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
};

// Get all-users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      $nor: [{ $and: [{ _id: req.user._id }] }],
    });
    const userList = users.map((user) => {
      return {
        _id: user._id,
        username: user.username,
        hasProfilePicture: user.hasProfilePicture,
        profilePictureLink : user?.profilePictureLink
      };
    });
    res.status(200).json(userList);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get follow status
exports.getFollowStatus = async (req, res) => {
  try {
    const hasFollowed = req.user.followings.includes(req.params.userId);
    res.json({ hasFollowed });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get all Friends
exports.getAllFriends = async (req, res) => {
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
      const { _id, username, hasProfilePicture, profilePictureLink } = following;
      followingList.push({ _id, username, hasProfilePicture, profilePictureLink, followMe: false });
    });

    const followers = await Promise.all(
      user.followers.map((followerId) => {
        return User.findById(followerId);
      })
    );

    let followerList = [];

    followers.map((follower) => {
      const { _id, username, hasProfilePicture, profilePictureLink } = follower;
      followerList.push({ _id, username, hasProfilePicture, profilePictureLink, followMe: true });
    });

    let friendList = [...followerList, ...followingList];
    // remove duplicate friends from allFriends
    friendList = [
      ...friendList
        .reduce(
          (map, friend) => map.set(friend._id.toString(), friend),
          new Map()
        )
        .values(),
    ];

    res.status(200).json(friendList.sort());
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "Invalid user followings!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Follow/Unfollow a user
exports.followOrUnfollow = async (req, res) => {
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

        return res.json({ hasFollow: false });
      } else {
        await user.updateOne({
          $push: { followers: req.user._id.toString() },
        });
        await currentUser.updateOne({
          $push: { followings: req.params.userId },
        });

        return res.json({ hasFollow: true });
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
};

// Remove user friend
exports.removeUserFriend = async (req, res) => {
  try {
    const currentUser = req.user;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(400).json({ error: "Unable to remove!" });
    }

    currentUser.followings = currentUser.followings.filter(
      (followingId) => followingId !== req.params.userId
    );
    currentUser.followers = currentUser.followers.filter(
      (followerId) => followerId !== req.params.userId
    );
    await currentUser.save();

    user.followings = user.followings.filter(
      (followingId) => followingId !== req.user._id.toString()
    );
    user.followers = user.followers.filter(
      (followerId) => followerId !== req.user._id.toString()
    );
    await user.save();

    res.json({ removed: true });
  } catch (error) {
    if (error.reason) {
      res.status(400).json({ error: "User not found!" });
    } else {
      res.status(500).json({ error: error._message });
    }
  }
};

// Delete user
exports.delete = async (req, res) => {
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
    await Comment.deleteMany({ owner: req.user._id });

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
};

// Suggestion users/firends for user
exports.getUserSuggestionUsers = async (req, res) => {
  try {
    let suggestionList = [];

    // getting all followers and followings Id's of user followers
    for (let followerId of req.user.followers) {
      const follower = await User.findById(followerId);
      suggestionList = [
        ...suggestionList,
        ...follower.followers,
        ...follower.followings,
      ];
    }

    // getting all followers and followings Id's of user followings
    for (let followingId of req.user.followings) {
      const following = await User.findById(followingId);
      suggestionList = [
        ...suggestionList,
        ...following.followers,
        ...following.followings,
      ];
    }

    // remove duplicate Id from suggestionList
    suggestionList = [...new Set(suggestionList)];

    // remove userId, user followersId and followingsId from suggestionList
    suggestionList = suggestionList.filter((suggest) => {
      return !(
        req.user.followers.includes(suggest) ||
        req.user.followings.includes(suggest) ||
        req.user._id.toString() === suggest
      );
    });

    suggestUsers = [];

    for (let suggest of suggestionList) {
      const user = await User.findById(suggest);
      suggestUsers.push({
        _id: user._id,
        username: user.username,
        hasProfilePicture: user.hasProfilePicture,
        profilePictureLink: user.profilePictureLink
      });
    }

    res.json(suggestUsers);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};
