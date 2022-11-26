const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// REGISTER USER
router.post('/register', async (req, res) => {
    try {
        // Generate hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create a user
        const user = new User({
            username : req.body.username,
            email : req.body.email,
            password : hashedPassword
        })

        // Save user and respond
        const data = await user.save();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email : req.body.email });
        !user && res.status(404).json('User not found!');

        const passwordIsValid = await bcrypt.compare(req.body.password, user.password);
        !passwordIsValid && res.status(400).json("Password is invalid!");

        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;