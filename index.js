const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const userRoute = require("./src/routes/users");
const postRoute = require('./src/routes/posts');
const commentRoute = require('./src/routes/comment');
const likeRoute = require('./src/routes/like');
const googleOAuthRoute = require('./src/routes/googleOAuth');

dotenv.config();

const port = process.env.PORT;
const mongoConnection = process.env.MONGO_URL;

mongoose.connect(mongoConnection, () => {
  console.log("MongoDB connected!");
});

// mongoose.set('debug', true);

// middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(compression());

app.use("/api/oauth", googleOAuthRoute);
app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/comment", commentRoute);
app.use("/api/like", likeRoute);

app.get("/*", (req, res) => {
  res.status(404).send("Page not Found!")
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
