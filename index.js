const express = require("express");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const userRoute = require("./src/routes/users");
const postRoute = require('./src/routes/posts');
const commentRoute = require('./src/routes/comment');
const likeRoute = require('./src/routes/like');
const googleOAuthRoute = require('./src/routes/googleOAuth');
const errorMiddleware = require("./src/middleware/errorMiddleware");
const connectDB = require("./src/config/database");
const cors = require('cors');

// Configure environment variables
dotenv.config();
const port = process.env.PORT;

// Connect with database
connectDB()

// middleware
app.use(cors({
  origin: process.env.ORIGIN,
  methods: ["GET", "POST", "PATCH", "UPDATE", "DELETE", "PUT"],
  credentials: true
}));
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(compression());

app.use("/api/oauth", googleOAuthRoute);
app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/comment", commentRoute);
app.use("/api/like", likeRoute);

// Page not found routers
app.get("/*", (req, res) => {
  res.status(404).send("Page not Found!")
});

// Error handler middleware
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});