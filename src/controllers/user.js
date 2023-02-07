const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require('../models/Like');
const VerificationSession = require("../models/VerificationSession");
const { sendAccountVerificationOtpOnEmail, sendForgotPasswordOtpOnEmail } = require("../services/email");
const validator = require("validator");
const ErrorHandler = require("../utils/errorHandler");
const tryCatch = require("../middleware/tryCatch");


// SEND OTP FOR EMAIL/ACCOUNT VERIFICATION
exports.sendVerificationOtp = tryCatch(async (req, res, next) => {
  // Check email is valid or not
  if ( !(req.body.email && validator.isEmail(req.body.email)) ) {
    throw new ErrorHandler("bad_request", "Invalid email address!", 400);
  }

  // Check email/account is exist or not in database
  const emailIsExist = await User.exists({ email: req.body.email });

  if (emailIsExist) {
    throw new ErrorHandler("bad_request", "Account already exist!", 400);
  }

  // Generate 6-Digit OTP
  const otp = Math.floor(Math.random() * 899999 + 100000);

  // Create or update VerificationSession for current OTP and email, which is expire in 5 minutes
  await VerificationSession.updateOne({ email: req.body.email }, { email: req.body.email, otp }, { upsert: true });

  // Send OTP on user email for account validation
  await sendAccountVerificationOtpOnEmail(req.body.email, otp);
  
  // Send response
  res.status(200).json({ message : `Account verification otp sent successfully on ${req.body.email}, Please check your email!` });
});


// REGISTER A NEW USER
exports.register = tryCatch(async (req, res) => {
  // Check all required information availability
  if (!(req.body.email && req.body.username && req.body.password && req.body.otp)) {
    throw new ErrorHandler("bad_request", "All fields mandatory for creating an account!", 400);
  }

  // Check verificationSession is valid and delete
  const isValidSession = await VerificationSession.deleteOne({ email: req.body.email, otp: req.body.otp });

  if (!isValidSession.deletedCount) {
    throw new ErrorHandler("unauthorized", "Invalid OTP!", 401);
  }

  // Create a user
  const user = new User(req.body);

  // Generate a jwt token and save in database
  await user.generateAuthToken();

  // send response
  res.status(201).json({ message: "Account created successfully!" });
});


// LOGIN A USER
exports.login = tryCatch(async (req, res) => {
  // Checking email and password provide or not
  if (!(req.body.email && req.body.password))
    throw new ErrorHandler("bad_request", "Email and password required for login!", 400);

  // Checking use credentials is valid or not
  const user = await User.findByCredentials(
    req.body.email,
    req.body.password
  );

  // Generate jwt token for login user
  const token = await user.generateAuthToken();

  // Send response
  res.json({ user, token });
});


// FORGOT PASSWORD OTP
exports.sendForgotOtp = tryCatch(async (req, res) => {
  // Check email/user is valid/exist or not
  const user = await User.exists({ email: req.body.email });

  if (!user) {
    throw new ErrorHandler("bad_request", "Account not found!", 400);
  }

  // Generate 6-Digit OTP
  const otp = Math.floor(Math.random() * 899999 + 100000);

  // Create or update VerificationSession for current OTP and email, which is expire in 5 minutes
  await VerificationSession.updateOne({ email: req.body.email }, { email: req.body.email, otp }, { upsert: true });

  // Send OTP on user email for forgot password validation
  await sendForgotPasswordOtpOnEmail(req.body.email, otp);
  
  // Send response
  res.status(200).json({ message : `Password reset OTP sent successfully on ${req.body.email}, Please check your email.` });
});


// VERIFY FORGOT OTP PASSWORD
exports.verifyOtp = tryCatch(async (req, res) => {
  // Check VerificationSession OTP and email validity
  const otpIsValid = await VerificationSession.exists({ email: req.body.email, otp: Number(req.body.otp) });

  if (!otpIsValid) {
    throw new ErrorHandler("unauthorized", "Invalid Email and OTP!", 401);
  }

  // Send OTP verification status
  res.json({ otpIsVerified : !!otpIsValid });
});


// RESET PASSWORD
exports.resetPassword = tryCatch(async (req, res) => {
  // check email/user is valid
  const user = await User.findOne({ email: req.body.email }, { password: 1 });

  if (!user) {
    throw new ErrorHandler("bad_request", "Account not found!", 400);
  }

  // Check verificationSession is valid and delete
  const isValidSession = await VerificationSession.deleteOne({ email: req.body.email, otp: req.body.otp });

  if (!isValidSession.deletedCount) {
    throw new ErrorHandler("unauthorized", "Session has expired!", 401);
  }

  // check password validity
  if (!(req.body.password.length >= 6)) {
    throw new ErrorHandler("bad_request", "Password must contain atleast 6-digit!", 400);
  }
  
  // Update password and save user
  user.password = req.body.password;
  await user.save()

  // Send response
  res.json({ message : "Password updated successfully!" });
});


// LOGOUT A USER
exports.logout = tryCatch(async (req, res) => {
  // remove token from database
  await User.updateOne({ _id: req.user._id }, { $pull: { tokens: { token: req.token } } });

  // Send response
  res.json({ message: "Logout account succesfully!" });
});


// UPDATE A USER
exports.update = tryCatch(async (req, res) => {
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
    throw new ErrorHandler("bad_request", "Invalid update!", 400);
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
});


// GET/SERVER USER PROFILE-PICTURE BY URL LINK
exports.serveUserProfilePicture = tryCatch(async (req, res) => {
  // Fetching user profilePicture from database
  const user = await User.findById(req.params.userId, { _id: 0, profilePicture: 1 });

  if (!user || !user.profilePicture) {
    throw new ErrorHandler("not_found", "Profile picture not found!", 404);
  }

  // Set Content-Type and server profilePicture
  res.set("Content-Type", user.profilePicture.mimetype);
  res.send(user.profilePicture.buffer.buffer);
});


// GET/SERVER USER COVER-PICTURE BY URL LINK
exports.serveUserCoverPicture = tryCatch(async (req, res) => {
  // Fetching user coverPicture from database
  const user = await User.findById(req.params.userId, { _id: 0, coverPicture: 1 });

  if (!user || !user.coverPicture) {
    throw new ErrorHandler("not_found", "Cover picture not found!", 404);
  }

  // Set Content-Type and server coverPicture
  res.set("Content-Type", user.coverPicture.mimetype);
  res.send(user.coverPicture.buffer.buffer);
});


// CREATE/UPDATE USER SOTRY
exports.createOrUpdateStroy = tryCatch(async (req, res) => {
  // Create story Url
  const storyUrl = `/api/user/story/${req.user._id}`;

  // Update story
  await User.updateOne({ _id: req.user._id }, { story: req?.file, storyUrl });

  // Send story updated response 
  res.status(201).json({ message: "Story updated!" });
});


// GET/SERVER USER STORY IMAGE BY URL LINK
exports.serveStoryImage = tryCatch(async (req, res) => {
  // Fetching user story from database
  const user = await User.findById(req.params.userId, { _id: 0, story: 1 });

  if (!user || !user.story) {
    throw new ErrorHandler("not_found", "Story not found!", 404);
  }

  // Set Content-Type and server story
  res.set("Content-Type", user.story.mimetype);
  res.send(user.story.buffer.buffer);
});


// GET ALL TIMELINE STORIES
exports.getAllTimelineStory = tryCatch(async (req, res) => {
  // Fetch current user all followers and followings story 
  const currentUser = await req.user
    .populate({ path: "followers followings", select: "_id username storyUrl"});

  // store all stories
  let stories = [...currentUser.followers, ...currentUser.followings];

  // Remove duplicate story
  stories = [...stories.reduce( (map, story) => map.set(story._id.toString(), story), new Map()).values()];

  // send Stories
  res.json(stories);
});


// GET USER ITSELF
exports.getMe = tryCatch(async (req, res) => {
  // Send user as response
  res.status(200).json(req.user);
});


// GET A USER
exports.getUser = tryCatch(async (req, res) => {
  // Get userId or username from query
  const userId = req.query.userId;
  const username = req.query.username;

  // Fetching user from database
  const user = userId
    ? await User.findById(userId, { profilePicture: 0, coverPicture: 0, story: 0, tokens: 0, password: 0, isAdmin: 0 })
    : await User.findOne({ username: username }, { profilePicture: 0, coverPicture: 0, story: 0, tokens: 0, password: 0, isAdmin: 0 });

  if (!user) {
    throw new ErrorHandler("not_found", "User not found!", 404);
  }

  // Send user as response
  res.status(200).json(user);
});


// GET ALL USERS
exports.getAllUsers = tryCatch(async (req, res) => {
  // Fetch users from database
  const users = await User.find(
    { $nor: [{ $and: [{ _id: req.user._id }] }] },
    {_id: 1, username: 1, profilePictureUrl: 1}
  );

  // Send users as response
  res.status(200).json(users);
});


// GET FOLLOW STATUS
exports.getFollowStatus = tryCatch(async (req, res) => {
  // Check followed status
  const hasFollowed = req.user.followings.find( following => following.toString() === req.params.userId);

  // Send followed status
  res.json({ hasFollowed: !!hasFollowed });
});


// SUGGESTION USER/FRIENDS FOR USER
exports.getUserSuggestionUsers = tryCatch(async (req, res) => {
  // Crate promise array for parallel data fetching from MongoDB
  const promises  = [];

  // Getting all followers and followings Id's of user followers
  for (const followerId of req.user.followers) {
    // Push all promise in promises array
    promises.push(User.findById({ _id: followerId }, { _id: 0, followers: 1, followings: 1 })
      .populate({ path: "followers followings", select: "_id username profilePictureUrl"}));
  };

  // Getting all followers and followings Id's of user followings
  for (const followingId of req.user.followings) {
    // Push all promise in promises array
    promises.push(User.findById({ _id: followingId }, { _id: 0, followers: 1, followings: 1 })
      .populate({ path: "followers followings", select: "_id username profilePictureUrl"}));
  };
  
  // Resolve result of all promises parallely
  let suggestionList = await Promise.all(promises);

  // Clean data as requirement
  suggestionList = suggestionList.reduce((suggestions, user) => {
    suggestions = [...suggestions, ...user.followers, ...user.followings];
    return suggestions;
  }, [])
  
  // Remove duplicate suggestion from suggestionList
  suggestionList = [...suggestionList.reduce((map, suggestion) => map.set(suggestion._id.toString(), suggestion), new Map()).values()]

  // Remove direct followers and followings from suggestionList
  suggestionList = suggestionList.filter(suggestion => {
    if (req.user.followers.includes(suggestion._id) || req.user.followings.includes(suggestion._id) || suggestion._id.equals(req.user._id))
      return false;
    return true;
  });

  if (suggestionList.length === 0) {
    suggestionList = await User.find({}, { username: 1, profilePictureUrl: 1 }).limit(5)
  }

  // Send suggestionList as response
  res.json(suggestionList);
});


// GET ALL FRIENDS
exports.getAllFriends = tryCatch(async (req, res) => {
  // Fetch user and its follower and followings from database
  const user = await User.findById(req.params.userId, { followers: 1, followings: 1 })
    .populate({ path: "followers followings", select: "_id username profilePictureUrl"})

  if (!user) {
    throw new ErrorHandler("bad_request", "Invalid user!", 400);
  }

  // Create friendList
  let friendList = [...user.followers, ...user.followings];

  // Remove duplicate from friends from friendList
  friendList = [...friendList.reduce((map, friend) => map.set(friend._id.toString(), friend), new Map()).values()];

  // Send friendList as response
  res.status(200).json(friendList.sort());
});


// FOLLOW/UNFOLLOW A USER
exports.followOrUnfollow = tryCatch(async (req, res) => {
  if (req.params.userId !== req.user._id.toString()) {
    // Fetch user from database
    const currentUser = req.user;
    const user = await User.findById(req.params.userId, { followers: 1, followings: 1 });

    if (!user) {
      throw new ErrorHandler("bad_request", "Follower not exist!", 400);
    }
    
    // Unfollow a user
    if (currentUser.followings.includes(user._id)) {
      // Update currnetUser followings and user followers parallely
      await Promise.all([
        currentUser.updateOne({ $pull: { followings: user._id } }),
        user.updateOne({ $pull: { followers: currentUser._id } })
      ])
      
      // Send unfollow status
      return res.json({ hasFollow: false });
    }
    // Follow a user
    else {
      // Update currnetUser followings and user followers parallely
      await Promise.all([
        currentUser.updateOne({ $push: { followings: user._id } }),
        user.updateOne({ $push: { followers: req.user._id } })
      ]);

      // Send follow status
      return res.json({ hasFollow: true });
    }
  } else {
    throw new ErrorHandler("bad_request", "You can't follow yourself!", 400);
  }
});


//  REMOVE USER FRIEND
exports.removeUserFriend = tryCatch(async (req, res) => {
  // Fetching user form database
  const currentUser = req.user;
  const user = await User.findById(req.params.userId, { followings: 1, followers: 1 });

  if (!user) {
    throw new ErrorHandler("bad_request", "Friend not exist!", 400);
  }
  
  // Remove to each other from each other's followings and followers parallely
  await Promise.all([
    currentUser.updateOne({ $pull: { followers: user._id, followings: user._id }}),
    user.updateOne({ $pull: { followers: currentUser._id, followings: currentUser._id }})
  ]);

  // Send removed status
  res.json({ removed: true });
});


// DELETE USER
exports.delete = tryCatch(async (req, res) => {
  // Getting all user comments
  const comments = await Comment.find({ owner: req.user._id }, { post: 1 });
  
  // Getting all user likes
  const likes = await Like.find({ owner: req.user._id }, { post: 1});

  // Create promise array for resolve parallely
  const promises = [];

  // Store user comments and decrement commentCounter from posts, promises in promises array
  for (comment of comments) {
    promises.push(
      Post.updateOne({ _id : comment.post }, { $inc: { commentCounter: -1 } }),
      comment.remove()
    );
  };

  // Store user likes and decrement likeCounter from posts, , promises in promises array
  for (like of likes) {
    promises.push(
      Post.updateOne({ _id: like.post }, { $inc: { likeCounter: -1 } }),
      like.remove()
    )
  };

  // Resolve all likePromises parallely
  await Promise.all(promises);

  // Delete all user post
  await Post.deleteMany({ owner: req.user._id });

  // Craete userPromises for storing remove user followings and followers, promises
  const userPromises = [];

  // Store remove user followings promises in userPromises
  for (followingId of req.user.followings) {
    userPromises.push(User.updateOne({ _id: followingId }, { $pull: { followers: req.user._id } }));
  };

  // Store remove user followers promises in userPromises
  for (followerId of req.user.followers) {
    userPromises.push(User.updateOne({ _id: followerId }, { $pull: { followings: req.user._id } }));
  };

  // Resolve all userPromises parallely
  await Promise.all(userPromises);

  // Remove user from database
  await req.user.remove();

  // Send response
  res.json({ message: "Account deleted successfully!" });
});