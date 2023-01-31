const router = require("express").Router();
const auth = require("../middleware/auth");
const comment = require("../controllers/comment");

// CREATE/ADD A COMMENT
router.post("/add/:postId", auth, comment.add);

// UPDATA A COMMENT
router.patch('/update/:commentId', auth, comment.update);

// DELETE A COMMENT
router.delete("/remove/:commentId", auth, comment.delete);

// GET ALL POST RELATED COMMENTS
router.get("/post/:postId", auth, comment.getAllPostRelatedComments);

module.exports = router;
