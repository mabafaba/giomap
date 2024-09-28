const express = require("express");

const cookieParser = require("cookie-parser");
const path = require('path');
const socketIO = require('socket.io');
const MapCanvas = require('./js/mapcanvas.model');

const must = require('../utils/must');
const { authorizeBasic } = require("../users/js/users.authorize");
const { authorizeToken } = require("../users/js/users.authorize");
const LeafletIO = require('../leafletIO');
const {authorizeAndRedirect, socketVerifyUser, socketVerifyUserIsMapOwner} = require('./js/leafletIOVerification.utils');

module.exports = function(io) {

  if(!io){
    throw new Error("Socket.io server required");
  }
  app = express();
  
  // add view folder to existing app view paths
  app.set("view engine", "ejs");
  let views = app.get('views');
  if (!Array.isArray(views)) views = [views];
  views.push(path.join(__dirname, './views'));
  app.set('views', views);
  
  app.use(express.json());
  app.use(cookieParser());
  
  // add client side js to existing app static paths
  app.use('/js', express.static(path.join(__dirname, './client/js')));

  // add client side graphics to existing app static paths
  app.use('/graphics', express.static(path.join(__dirname, './client/graphics')));

  const router = require("./js/giomap.router");
  app.use("/", router);

  // create leafletIO instance
  leafletIO = new LeafletIO(
    io = io, // socket.io server
    beforeGetRequest = authorizeAndRedirect,
    beforeContributorAction = socketVerifyUser,
    beforeHostAction = socketVerifyUserIsMapOwner
    )

    app.use('/leafletIO', leafletIO.app);
    return app;

  }