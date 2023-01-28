const getGoogleOAuthTokens = require("../services/getGoogleOAuthTokens");
const jwt_decode = require("jwt-decode");
const User = require("../models/User");

const googleOAuthHandler = async (req, res) => {
  try {
    // get the code from qs
    const code = req.query.code;

    // get the id_token with the code
    const { id_token } = await getGoogleOAuthTokens(code);
    const googleUser = jwt_decode(id_token);

    // Check email is valid or not
    if (!googleUser.email_verified) {
      return res.status(403).json({ error: "User email is not verified!" });
    }

    // Find user
    let user = await User.findOne({ email: googleUser.email });

    // If new user try to login with google
    if (!user) {
      user = new User({
        username: googleUser.name,
        email: googleUser.email,
        hasProfilePicture: true,
        profilePictureLink: googleUser.picture,
        password: googleUser.at_hash,
      });

      // Generate jwt tokens for new user
      const token = await user.generateAuthToken();
      return res.cookie("token", token).redirect(process.env.ORIGIN);
    }

    // Generate jwt tokens for existing user
    const token = await user.generateAuthToken();
    res.cookie("token", token).redirect(process.env.ORIGIN);
  } catch (error) {
    console.log("Failed to authorize google user!");
    res.status(403).redirect(`${process.env.ORIGIN}/oauth/error`);
  }
};

module.exports = googleOAuthHandler;
