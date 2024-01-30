/**
 * This module exports a function that sets up the user-related routes and middleware for an Express app.
 * @module users.server.js
 * @param {Object} app - The Express app object.
 * @param {string} parentRoute - The parent route for the user-related routes as a string. will change localhost:3000/user/login to localhost:3000/parentRoute/login
 */
const express = require("express");
// const connectDB = require("./users.db"); // not required if a db connection exists
// connectDB(); 
const app = express();
const cookieParser = require("cookie-parser");
const path = require('path');
const User = require("./users.model");




module.exports = function(app, parentRoute = ""){
  
  const userRouter = require("./users.router")(parentRoute);
  // add view folder to existing app view paths
  app.set("view engine", "ejs");
  let views = app.get('views');
  if (!Array.isArray(views)) views = [views];
  views.push(path.join(__dirname, '../views'));
  app.set('views', views);
  
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use(parentRoute+"/user", userRouter);


}

