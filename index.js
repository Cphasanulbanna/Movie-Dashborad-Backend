//modules
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const movieRouter = require("./routes/moviesRouter.js");

//functions
const { connectDb } = require("./config/db");

const PORT = process.env.PORT || 5005;
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

connectDb();

app.use("/api/movies/", movieRouter);

app.listen(PORT, () => console.log(`Server is running onn port: ${PORT}`));
