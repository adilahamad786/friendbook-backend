const router = require("express").Router();
const auth = require("../middleware/auth");
const uploadFile = require("../middleware/uploadFile");
const post = require("../controllers/post");

// CREATE/ADD A POST
router.post(
  "/create",
  auth,
  uploadFile.single("image"),
  post.add
);

// UPDATE A POST
router.patch(
  "/update/:postId",
  auth,
  uploadFile.single("image"),
  post.update
);

// DELETE A POST
router.delete("/delete/:postId", auth, post.delete);

// GET USER ALL POSTS
router.get("/my-posts/:userId", auth, post.getUserPosts);

// GET ALL/TIMELINE POSTS
router.get("/timeline", auth, post.getAllTimelinePosts);

// GET/SERVE POST IMAGE BY URL LINK
router.get("/:postId", post.servePostImage);

module.exports = router;
