import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import routes from "./routes/routes.js"; // ES module import

dotenv.config();

const app = express(); // create Express app

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connection Established"))
  .catch(err => console.log("Failed to connect", err));

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "views")); // fixed path

// Routes
app.use("/", routes);

// Start server
app.listen(3000, () => console.log("Server started on port 3000"));
