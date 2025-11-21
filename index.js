const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Router = require("./routes/routes")
const app = express();
require("dotenv").config();



mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("Connection Established"))
.catch(()=>console.log("Failed to connect"));




app.use(express.static("public"));
app.use(express.urlencoded({extended:false}));
app.use(express.urlencoded({extended:false}));

app.use("/",Router)






app.set("view engine","ejs");
app.set("./views",path.join("views"));


app.listen(3000,()=>console.log("Server started"))