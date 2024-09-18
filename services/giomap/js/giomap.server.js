const express = require("express");
// const connectDB = require("./users.db"); // not required if a db connection exists
// connectDB(); 

const cookieParser = require("cookie-parser");
const path = require('path');
const socketIO = require('socket.io');
const mapdrawing = require('./mapdrawing.model');
const MapCanvas = require('./mapcanvas.model');

const must = require('../../utils/must');
const { authorizeBasic } = require("../../users");
const { authorizeToken } = require("../../users/js/users.authorize");

const leafletIO = require('./leafletIO.socket');

// returns a function that modifies existing app and io objects
module.exports = function(app, io){
  
  // add view folder to existing app view paths
  app.set("view engine", "ejs");
  let views = app.get('views');
  if (!Array.isArray(views)) views = [views];
  views.push(path.join(__dirname, '../views'));
  app.set('views', views);
  
  app.use(express.json());
  app.use(cookieParser());
  
  // add client side js to existing app static paths
  app.use('/giomap/js', express.static(path.join(__dirname, '../client/js')));

  // add client side graphics to existing app static paths
  app.use('/giomap/graphics', express.static(path.join(__dirname, '../client/graphics')));


  // add views/giomap.ejs as a view on route /giomap
  const router = require("./giomap.router");
  app.use("/giomap", router);

  // live updates between users through socket.io
  leafletIO(io);

}

