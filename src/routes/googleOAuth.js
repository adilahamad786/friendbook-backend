const router = require('express').Router();
const googleOAuthHandler = require('../controllers/googleOAuthHandler');

router.get('/google', googleOAuthHandler);

module.exports = router;