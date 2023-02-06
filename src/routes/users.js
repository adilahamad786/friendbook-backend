const router = require("express").Router();
const auth = require("../middleware/auth");
const uploadFile = require("../middleware/uploadFile");
const user = require("../controllers/user");

// SEND OTP ON EMAIL
router.post("/send-otp", user.sendVerificationOtp);

// REGISTER/CREATE/SIGNUP A USER
router.post("/register", user.register);

// LOGIN/SIGNIN
router.post("/login", user.login);

// FORGOT PASSWORD
router.post("/forgot-otp", user.sendForgotOtp);

// VERIFY OTP
router.post("/verify-otp", user.verifyOtp);

// FORGOT PASSWORD
router.post("/reset-password", user.resetPassword);

// LOGOUT
router.get("/logout", auth, user.logout);

// UPDATE USER
router.patch(
  "/update",
  auth,
  uploadFile.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ]),
  user.update
);

// GET/SERVE USER PROFILEPICTURE BY URL LINK
router.get("/profile-picture/:userId", user.serveUserProfilePicture);

// GET/SERVE USER COVERPICTURE BY URL LINK
router.get("/cover-picture/:userId", user.serveUserCoverPicture);

// CREATE OR UPDATE USER STORY
router.put(
  "/create-story",
  auth,
  uploadFile.single("story"),
  user.createOrUpdateStroy
);

// GET ALL TIMELINE STORIES
router.get('/story/timeline', auth, user.getAllTimelineStory);

// GET/SERVE USER STORY IMAGE BY URL LINK
router.get("/story/:userId", user.serveStoryImage);

// GET USER ITSELF
router.get("/me", auth, user.getMe);

// GET A USER
router.get("/", auth, user.getUser);

// GET ALL USERS
router.get("/all-users", auth, user.getAllUsers);

// GET FOLLOW STATUS
router.get("/follow-status/:userId", auth, user.getFollowStatus);

// GET ALL FRIENDS
router.get("/friends/:userId", auth, user.getAllFriends);

// FOLLOW/UNFOLLOW A USER
router.put("/follow-unfollow/:userId", auth, user.followOrUnfollow);

// REMOVE USER Friend
router.put("/remove/:userId", auth, user.removeUserFriend);

// DELETE USER
router.delete("/delete", auth, user.delete);

// Suggestion users/friends for User
router.get("/suggestion", auth, user.getUserSuggestionUsers);

module.exports = router;