const express = require("express");
// const connectDB = require("./users.db"); // not required if a db connection exists
// connectDB(); 
const app = express();
const cookieParser = require("cookie-parser");
const path = require('path');
const User = require("./users.model");




module.exports = function(app){
  
  const userRouter = require("./users.router");
  // add view folder to existing app view paths
  app.set("view engine", "ejs");
  let views = app.get('views');
  if (!Array.isArray(views)) views = [views];
  views.push(path.join(__dirname, '../views'));
  app.set('views', views);
  
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use("/user", userRouter);


}

