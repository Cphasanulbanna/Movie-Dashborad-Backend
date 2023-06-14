//modules
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cloudinary = require("cloudinary");
const fileupload = require("express-fileupload");

//routes
const movieRouter = require("./routes/moviesRouter.js");
const genreRouter = require("./routes/genreRouter.js");
const userRouter = require("./routes/userRouter");

//functions
const { connectDb } = require("./config/db");

const PORT = process.env.PORT || 5005;
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload({ useTempFiles: true }));

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

connectDb();

app.use("/api/movies/", movieRouter);
app.use("/api/genres/", genreRouter);
app.use("/api/auth/", userRouter);

app.listen(PORT, () => console.log(`Server is running onn port: ${PORT}`));
