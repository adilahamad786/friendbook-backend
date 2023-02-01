const router = require("express").Router();
const auth = require("../middleware/auth");
const like = require("../controllers/like");

// LIKE/DISLIKE A POST
router.put("/:postId", auth, like.likeAndDislike);

// GET LIKE STATUS
router.get("/status/:postId", auth, like.getLikeStatus);

module.exports = router;
