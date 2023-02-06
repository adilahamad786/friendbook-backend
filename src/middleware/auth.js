const jwt = require("jsonwebtoken");
const User = require("../models/User");
const tryCatch = require("./tryCatch");
const ErrorHandler = require("../utils/errorHandler");

const auth = tryCatch(async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ErrorHandler("unauthorized", "Please authenticate!", 401);
  }

  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findOne({
    _id: decoded._id,
    "tokens.token": token,
  }, { profilePicture: 0, coverPicture: 0, story: 0 });

  if (!user) {
    throw new ErrorHandler("unauthorized", "Please authenticate!", 401);
  }

  req.token = token;
  req.user = user;

  next();
});

module.exports = auth;
