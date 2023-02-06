const mongoose = require("mongoose");
const dotenv = require("dotenv");
const tryCatch = require("../middleware/tryCatch");
dotenv.config();

const mongoConnection = process.env.MONGO_URL;

const connectDB = tryCatch(async () => {
  await mongoose.connect(mongoConnection, () => {
    console.log("MongoDB connected!");
  });
});

module.exports = connectDB;
