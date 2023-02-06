const getGoogleOAuthTokens = require("../services/getGoogleOAuthTokens");
const jwt_decode = require("jwt-decode");
const User = require("../models/User");
const ErrorHandler = require("../utils/errorHandler");
const tryCatch = require("../middleware/tryCatch");

const googleOAuthHandler = tryCatch(async (req, res) => {
  // get the code from qs
  const code = req.query.code;

  // get the id_token with the code
  const { id_token } = await getGoogleOAuthTokens(code);
  const googleUser = jwt_decode(id_token);

  // Check email is valid or not
  if (!googleUser.email_verified) {
    throw new ErrorHandler("google_oauth_error", "User email is not verified!", 401)
  }

  // Find user
  let user = await User.findOne({ email: googleUser.email });

  // If new user try to login with google
  if (!user) {
    user = new User({
      username: googleUser.name,
      email: googleUser.email,
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
});

module.exports = googleOAuthHandler;
