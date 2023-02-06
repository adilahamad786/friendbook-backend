const mongoose = require("mongoose");
const validator = require("validator");
const ErrorHandler = require("../utils/errorHandler");

const sessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new ErrorHandler("bad_request", "Email is not valid!", 400);
        }
      },
    },
    otp: {
      type: Number,
      required : true
    },
    expireAt : {
      type: Date,
      default: () => Date.now(),
      expires : 300
    }
  }
);

module.exports = mongoose.model("VerificationSession", sessionSchema);