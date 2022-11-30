const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
const userRoute = require("./src/routes/users");
const postRoute = require('./src/routes/posts');

dotenv.config();

const port = process.env.PORT;
const mongoConnection = process.env.MONGO_URL;

mongoose.connect(mongoConnection, () => {
  console.log("MongoDB connected!");
});

// middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);

app.get("/", (req, res) => {
  res.send("Welcome to homepage!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
