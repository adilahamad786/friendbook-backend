const router = require('express').Router();

router.get('/', (req, res) => {
    res.send("This is post page!");
});

module.exports = router;