const mongoose = require("mongoose");
const validator = require("validator");

const verficationSchema = new mongoose.Schema(
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
      type: Number
    },
    token: {
      type: String
    },
    expireAt : {
      type: Date,
      default: Date(),
    }
  }
);

module.exports = mongoose.model("Verification", verficationSchema);