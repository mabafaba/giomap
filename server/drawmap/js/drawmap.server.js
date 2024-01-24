const express = require("express");
// const connectDB = require("./users.db"); // not required if a db connection exists
// connectDB(); 

const app = express();
const cookieParser = require("cookie-parser");
const path = require('path');
const socketIO = require('socket.io');
const MapDrawing = require('./mapdrawing.model');
const MapCanvas = require('./mapcanvas.model');

const must = require('../../utils/must');
const { authorizeBasic } = require("../../users");
const { authorizeToken } = require("../../users/js/users.authorize");
module.exports = function(app, io){
  
  // add view folder to existing app view paths
  app.set("view engine", "ejs");
  let views = app.get('views');
  if (!Array.isArray(views)) views = [views];
  views.push(path.join(__dirname, '../views'));
  app.set('views', views);
  
  app.use(express.json());
  app.use(cookieParser());
  
  // add views/drawmap.ejs as a view on route /drawmap
  const router = require("./drawmap.router")
  app.use("/drawmap", router);
  

  io.use((socket, next) => {
    cookieParser()(socket.request, socket.request.res, next);
  });


  io.on('connection', (socket) => {
    
    socket.on('disconnect', () => {
      // what to do when user disconnects
    });
    
    
    // join a map room
    socket.on('joinMapRoom', async (room) => {
      socket.join(room);
    }
    );
    
    async function socketVerifyUser (socket) {
      // get JWT from cookie
      const token = socket.request.cookies.jwt;
      // if no token, return
      if (!token) {
        console.log('no token');
        socket.emit('notAuthorized', {success: false, message: "Not authorized, token not available"});
        return {success: false, message: "Not authorized, token not available"};
      }
      // verify JWT
      const verified = await authorizeToken(token, ["admin", "basic"]);
      console.log('verified:', verified);
      // if not verified, send error message to user
      if (!verified.success) {
        socket.emit('notAuthorized', verified);
        return {success: false, message: "Not authorized, token not available"};
      }
      return verified;
    }
    

    // LIVE UPDATES BETWEEN USERS
    // handle user creating/editing a geometry
    socket.on("iMadeAGeometry!", async json => {
      
      // verify user
      const verified = await socketVerifyUser(socket);
      // if not verified, send error message to user
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }
      const mapcanvasShareLinkId = json.mapcanvasShareLinkId;
      const data = json.layer;

      must(data && data.geometry && data.geometry.type && data.geometry.coordinates, "geometry must be a valid geojson feature");
      must(data.properties && data.properties.uuid, "geometry must have a uuid property");
      
      // find the mapcanvas that this geometry belongs to
      const mapCanvas = await MapCanvas.findOne({shareLinkId: mapcanvasShareLinkId});
      console.log('searched canvas '+ mapcanvasShareLinkId, mapCanvas);
      // if not found, return
      if (!mapCanvas) {
        console.log('mapcanvas '+mapcanvasShareLinkId+' not found');
        throw new Error('mapcanvas '+mapcanvasShareLinkId+' not found');
      }
      
      // check if uuid already exists in db
      const existing = await MapDrawing.findOne({"feature.properties.uuid": data.properties.uuid});
      // if it does, update it
      if (existing){
        console.log('found existing entry:', existing);
        existing.feature = data;
        existing.userId = null;
        existing.socketId = socket.id;
        existing.mapcanvas = mapCanvas._id;
        const saved = await existing.save();

      } else {
        // if not, create a new entry
        let drawMapEntry = await MapDrawing.create({
          feature: data,
          userId: null,
          socketId: socket.id,
          mapcanvas: mapCanvas._id,
          createdBy: verified.user.id
        })
        const saved = await drawMapEntry.save();
        
        // add the new entry to the mapcanvas
        
        mapCanvas.mapdrawings.push(drawMapEntry._id);
        await mapCanvas.save();
        
      }
      // send newly created / updated geometry to everyone currently editing the map 
      socket.broadcast.to(mapcanvasShareLinkId).emit('someoneMadeAGeometry!', data);
    })
    
    // handle user deleting a geometry
    
    socket.on("iDeletedAGeometry!", async data => {

      // verify user

      const verified = await socketVerifyUser(socket);
      // if not verified, send error message to user
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }
      console.log(`${socket.id} deleted geometry: ${data}`);
      must(data && data.properties && data.properties.uuid, "geometry must have a uuid property");
      const deleted = await MapDrawing.deleteOne({"feature.properties.uuid": data.properties.uuid});
      console.log('deleted:', deleted);
      // broadcast to mapcanvasShareLinkId room
      // socket.broadcast.to(mapcanvasShareLinkId).emit('someoneDeletedAGeometry!', data);
      socket.broadcast.emit('someoneDeletedAGeometry!', data);
    })
    
  });
  
  
  
}

