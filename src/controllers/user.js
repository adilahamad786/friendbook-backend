const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require('../models/Like');
const VerificationSession = require("../models/VerificationSession");
const { sendAccountVerificationOtpOnEmail, sendForgotPasswordOtpOnEmail } = require("../services/email");
const validator = require("validator");

// Send OTP for email verification
exports.sendVerificationOtp = async (req, res) => {
  try {
    // Check email is valid or not
    if ( !(req.body.email && validator.isEmail(req.body.email)) ) {
      return res.status(400).json({ error: "Invalid email address!"});
    }

    // Check email/account is exist or not in database
    const emailIsExist = await User.exists({ email: req.body.email });

    if (emailIsExist) {
      return res.status(403).json({ error : "Account already exist!" });
    }

    // Generate 6-Digit OTP
    const otp = Math.floor(Math.random() * 899999 + 100000);

    // Create or update VerificationSession for current OTP and email, which is expire in 5 minutes
    await VerificationSession.updateOne({ email: req.body.email }, { email: req.body.email, otp }, { upsert: true });

    // Send OTP on user email for account validation
    const info = await sendAccountVerificationOtpOnEmail(req.body.email, otp);

    if (!info.messageId)
      return res.status(200).json({ error : "Internal server error!" });
    
    // Send response
    res.status(200).json({ message : `Account verification otp sent successfully on ${req.body.email}, Please check your email!` });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Register a new user
exports.register = async (req, res) => {
  try {
    // Check all required information availability
    if (!(req.body.email && req.body.username && req.body.password)) {
      return res.status(403).json({ error : "Username, Email and Passowrd must required for creating an account!"});
    }

    // Check verificationSession is valid and delete
    const isValidSession = await VerificationSession.deleteOne({ email: req.body.email, otp: req.body.otp });

    if (!isValidSession.deletedCount) {
      return res.status(403).json({ error : "Invalid OTP!" });
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
      res.status(500).json({ error: error.message });
    }
  }
};

// Login a user
exports.login = async (req, res) => {
  try {
    // Checking use credentials is valid or not
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    // Generate jwt token for login user
    const token = await user.generateAuthToken();

    // Send response
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
    // Check email/user is valid/exist or not
    const user = await User.exists({ email: req.body.email });

    if (!user) {
      return res.status(400).json({error : "Account not found!"});
    }

    // Generate 6-Digit OTP
    const otp = Math.floor(Math.random() * 899999 + 100000);

    // Create or update VerificationSession for current OTP and email, which is expire in 5 minutes
    await VerificationSession.updateOne({ email: req.body.email }, { email: req.body.email, otp }, { upsert: true });

    // Send OTP on user email for forgot password validation
    const info = await sendForgotPasswordOtpOnEmail(req.body.email, otp);
    
    if (!info.messageId)
      return res.status(200).json({ error : "Internal server error!" });
    
    // Send response
    res.status(200).json({ message : `Password reset OTP sent successfully on ${req.body.email}, Please check your email.` });
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
    const emailIsExist = await User.exists({ email: req.body?.email });

    if (!emailIsExist) {
      return res.status(400).json({error : "Account not Exist!"});
    }

    // Check VerificationSession OTP and email validity
    const otpIsValid = await VerificationSession.exists({ email: req.body?.email, otp: Number(req.body?.otp) });

    if (!otpIsValid) {
      return res.status(403).json({ error : "Invalid OTP!" });
    }

    // Send OTP verification status
    res.json({ otpIsVerified : !!otpIsValid });
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
    const user = await User.findOne({ email: req.body.email }, { password: 1 });

    if (!user) {
      return res.status(400).json({error : "Account not found!"});
    }

    // Check verificationSession is valid and delete
    const isValidSession = await VerificationSession.deleteOne({ email: req.body.email, otp: req.body.otp });

    if (!isValidSession.deletedCount) {
      return res.status(403).json({ error : "Session has expired!" });
    }

    // check password validity
    if (!(req.body.password.length >= 6)) {
      return res.status(400).json({ error : "Password must contain atleast 6-digit!" });
    }
    
    // Update password and save user
    user.password = req.body.password;
    await user.save()

    // Send response
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
    // remove token from database
    await User.updateOne({ _id: req.user._id }, { $pull: { tokens: { token: req.token } } });

    // Send response
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
    // Checking/Create list updatable request properites
    const updateRequest = Object.keys(req.body);

    // Create allowed update list
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

    // Check update request is valid or not
    const isValidUpdate = updateRequest.every((update) =>
      allowedUpdate.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).json({ error: "Invalid update!" });
    }

    // Update properites of current user
    updateRequest.forEach((update) => (req.user[update] = req.body[update]));

    // Update profilePicture if provide
    if (req.files?.profilePicture) {
      req.user.profilePicture = req.files.profilePicture[0];
      req.user.profilePictureUrl =
        `/api/user/profile-picture/${req.user._id}`;
    }

    // Update coverPicture if provide
    if (req.files?.coverPicture) {
      req.user.coverPicture = req.files.coverPicture[0];
      req.user.coverPictureUrl =
        `/api/user/cover-picture/${req.user._id}`;
    }

    // Save current updated user in database
    await req.user.save();

    // Send updated user as response
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get/Serve user profile-picture by url link
exports.serveUserProfilePicture = async (req, res) => {
  try {
    // Fetching user profilePicture from database
    const user = await User.findById(req.params.userId, { _id: 0, profilePicture: 1 });

    if (!user || !user.profilePicture) {
      return res.status(404).json({ error: "Profile picture not found!" });
    }

    // Set Content-Type and server profilePicture
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
    // Fetching user coverPicture from database
    const user = await User.findById(req.params.userId, { _id: 0, coverPicture: 1 });

    if (!user || !user.coverPicture) {
      return res.status(400).json({ error: "Cover picture not found!" });
    }

    // Set Content-Type and server coverPicture
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

// Create/Update user story
exports.createOrUpdateStroy = async (req, res) => {
  try {
    // Create story Url
    const storyUrl = `/api/user/story/${req.user._id.toString()}`;

    // Update story
    await User.updateOne({ _id: req.user._id }, { story: req?.file, storyUrl });

    // Send story updated response 
    res.status(201).json({ message: "Story updated!" });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get/Serve user story image by url link
exports.serveStoryImage = async (req, res) => {
  try {
    // Fetching user story from database
    const user = await User.findById(req.params.userId, { _id: 0, story: 1 });

    if (!user || !user.story) {
      return res.status(404).json({ error: "Story not found!" });
    }

    // Set Content-Type and server story
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

// Get all timeline story
exports.getAllTimelineStory = async (req, res) => {
  try {
    // Fetch current user all followers and followings story 
    const currentUser = await req.user
      .populate({ path: "followers followings", select: "_id username storyUrl"});

    // store all stories
    let stories = [...currentUser.followers, ...currentUser.followings];

    // Remove duplicate story
    stories = [...stories.reduce( (map, story) => map.set(story._id.toString(), story), new Map()).values()];

    // send Stories
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get user itself
exports.getMe = async (req, res) => {
  try {
    // Send user as response
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a user
exports.getUser = async (req, res) => {
  try {
    // Get userId or username from query
    const userId = req.query.userId;
    const username = req.query.username;

    // Fetching user from database
    const user = userId
      ? await User.findById(userId, { profilePicture: 0, coverPicture: 0, story: 0, tokens: 0, password: 0, isAdmin: 0 })
      : await User.findOne({ username: username }, { profilePicture: 0, coverPicture: 0, story: 0, tokens: 0, password: 0, isAdmin: 0 });

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Send user as response
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
    // Fetch users from database
    const users = await User.find({
      $nor: [{ $and: [{ _id: req.user._id }] }],
    }, {_id: 1, username: 1, profilePictureUrl: 1});

    // Send users as response
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Get follow status
exports.getFollowStatus = async (req, res) => {
  try {
    // Check followed status
    const hasFollowed = req.user.followings.find( following => following.toString() === req.params.userId);

    // Send followed status
    res.json({ hasFollowed: !!hasFollowed });
  } catch (error) {
    res.status(500).json({ error: error._message });
  }
};

// Suggestion users/firends for user
exports.getUserSuggestionUsers = async (req, res) => {
  try {
    // Create SuggestionList
    let suggestionList = [];

    // Getting all followers and followings Id's of user followers
    for (const followerId of req.user?.followers) {
      const follower = await User.findById({ _id: followerId }, { _id: 0, followers: 1, followings: 1 })
        .populate({ path: "followers followings", select: "_id username profilePictureUrl"})

      // Update/Add new suggestion items in suggestionList
      suggestionList = [...suggestionList, ...follower?.followers, ...follower?.followings];
    };

    // getting all followers and followings Id's of user followings
    for (const followingId of req.user?.followings) {
      const following = await User.findById({ _id: followingId }, { _id: 0, followers: 1, followings: 1 })
        .populate({ path: "followers followings", select: "_id username profilePictureUrl"})

      // Update/Add new suggestion items in suggestionList
      suggestionList = [...suggestionList, ...following?.followers, ...following?.followings];
    };

    // Remove duplicate suggestion from suggestionList
    suggestionList = [...suggestionList.reduce((map, suggestion) => map.set(suggestion._id.toString(), suggestion), new Map()).values()]

    // Remove direct followers and followings from suggestionList
    suggestionList = suggestionList.filter(suggestion => {
      if (req.user.followers.includes(suggestion._id) || req.user.followings.includes(suggestion._id) || suggestion._id.equals(req.user._id))
        return false;
      return true;
    });

    // Send suggestionList as response
    res.json(suggestionList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Friends
exports.getAllFriends = async (req, res) => {
  try {
    // Fetch user and its follower and followings from database
    const user = await User.findById(req.params.userId, { followers: 1, followings: 1 })
      .populate({ path: "followers followings", select: "_id username profilePictureUrl"})

    if (!user) {
      return res.status(400).json({ error: "Invalid user!" });
    }

    // Create friendList
    let friendList = [...user.followers, ...user.followings];

    // Remove duplicate from friends from friendList
    friendList = [...friendList.reduce((map, friend) => map.set(friend._id.toString(), friend), new Map()).values()];

    // Send friendList as response
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
      // Fetch user from database
      const user = await User.findById(req.params.userId, { followers: 1, followings: 1 });
      const currentUser = req.user;

      // Unfollow a user
      if (currentUser.followings.includes(user._id)) {
        await currentUser.update({
          $pull: { followings: user._id },
        });
        await user.update({
          $pull: { followers: currentUser._id },
        });

        // Send unfollow status
        return res.json({ hasFollow: false });
      }
      // Follow a user
      else {
        await user.update({
          $push: { followers: req.user._id },
        });
        await currentUser.update({
          $push: { followings: user._id },
        });

        // Send follow status
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
    // Fetching user form database
    const user = await User.findById(req.params.userId, { followings: 1, followers: 1 });
    const currentUser = req.user;

    if (!user) {
      return res.status(400).json({ error: "Unable to remove!" });
    }
    
    // Remove user from currentUser followings and followers
    await currentUser.update({ $pull: { followers: user._id, followings: user._id }});
    
    // Remove currentUser from user followings and followers
    await user.update({ $pull: { followers: currentUser._id, followings: currentUser._id }});

    // Send removed status
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
    const comments = await Comment.find({ owner: req.user._id }, { post: 1 });

    // Remove user comments and decrement commentCounter from posts
    for (comment of comments) {
      await Post.updateOne({ _id : comment.post }, { $inc: { commentCounter: -1 } });
      await comment.remove();
    };


    // Getting all user likes
    const likes = await Like.find({ owner: req.user._id }, { post: 1});

    // Remove user likes and decrement likeCounter from posts
    for (like of likes) {
      await Post.updateOne({ _id: like.post }, { $inc: { likeCounter: -1 } });
      await like.remove();
    };

    // Delete all user post
    await Post.deleteMany({ owner: req.user._id });

    // Remove user followings
    for (followingId of req.user.followings) {
      await User.updateOne({ _id: followingId }, { $pull: { followers: req.user._id } });
    };

    // Remove user followers
    for (followerId of req.user.followers) {
      await User.updateOne({ _id: followerId }, { $pull: { followings: req.user._id } });
    };

    // Remove user from database
    await req.user.remove();

    // Send response
    res.json({ message: "Account deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};