const mongoose = require("mongoose");
const validator = require("validator");

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
          throw new Error("Email is not valid!");
        }
      },
    },
    otp: {
      type: Number,
      required : true
    },
    expireAt : {
      type: Date,
      default: Date,
      expires : 300
    }
  }
);

module.exports = mongoose.model("VerificationSession", sessionSchema);