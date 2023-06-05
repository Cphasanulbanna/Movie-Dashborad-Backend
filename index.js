//modules
const express = require("express");
const cors = require("cors");
require("dotenv").config();

//functions
const { connectDb } = require("./config/db");

const PORT = process.env.PORT || 5005;
const app = express();

//middlewares
app.use(cors());
app.use(express.json());

connectDb();

app.listen(PORT, () => console.log(`Server is running onn port: ${PORT}`));
