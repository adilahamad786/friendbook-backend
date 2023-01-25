const router = require('express').Router();
const googleOAuthHandler = require('../controller/googleOAuthHandler');

router.get('/google', googleOAuthHandler);

module.exports = router;