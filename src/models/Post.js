const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      max: 50,
    },
    img: {
      // type: Buffer,
      type: String,
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: [{
      user : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : "User",
      },
      message : {
        type : String,
      },
      time : {
        type : Date,
        required : true,
        default : new Date()
      }
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
