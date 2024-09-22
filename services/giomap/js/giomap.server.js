const express = require("express");
// const connectDB = require("./users.db"); // not required if a db connection exists
// connectDB(); 

const cookieParser = require("cookie-parser");
const path = require('path');
const socketIO = require('socket.io');
const mapdrawing = require('./mapdrawing.model');
const MapCanvas = require('./mapcanvas.model');

const must = require('../../utils/must');
const { authorizeBasic } = require("../../users/js/users.authorize");
const { authorizeToken } = require("../../users/js/users.authorize");
console.log("user", authorizeBasic);
// const leafletIO = require('./leafletIO.socket');
const LeafletIO = require('../../leafletIO');




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

  const router = require("./giomap.router");
  app.use("/giomap", router);

  
  

  // user verification middleware
  const authorizeAndRedirect = [authorizeBasic, (req, res, next) => {
    if (req.body.authorized) {
        next();
    } else {
        res.redirect('/giomap/user/login');
    }
  }];
  
  
  
  async function socketVerifyUser (socket, json) {
    console.log("socketVerifyUser", socket);
    // get JWT from cookie
    const token = socket.request.cookies.jwt;
    // if no token, return
    if (!token) {
      socket.emit('notAuthorized', {success: false, message: "Not authorized, token not available"});
      return false;
    }
    // verify JWT
    const verified = await authorizeToken(token, ["admin", "basic"]);
    // if not verified, send error message to user
    if (!verified.success) {
      socket.emit('notAuthorized', verified);
      return false;
    }
    json.user = {
      id: verified.user.id,
      username: verified.user.username
    }
    return json;
  }
  
  
  socketVerifyUserIsMapOwner = async function(socket, json) {
    // is user logged in?
    const verified = await socketVerifyUser(socket, json);
    if (!verified) {
      return false;
    }
    console.log('json', json);
    // is user the map canvas owner?
    const mapcanvas = await MapCanvas.findOne({shareLinkId: json.mapRoom});
    if (mapcanvas.createdBy != verified.user.id) {
      return false;
    }
    json.user = {
      id: verified.user.id,
      username: verified.user.username
    }
    return json;
  
  }

  // create leafletIO instance
  leafletIO = new LeafletIO(
    app = app, // express app
    route = "/giomap/leafletIO", // route for leafletIO, will [route]/geojson/:room and [route]/raw/:room
    io = io // socket.io instance
    // beforeGetRequest = authorizeAndRedirect,
    // beforeContributorAction = socketVerifyUser,
    // beforeHostAction = socketVerifyUserIsMapOwner
    )
  }
  


