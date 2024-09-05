const express = require("express");
// const connectDB = require("./users.db"); // not required if a db connection exists
// connectDB(); 

const app = express();
const cookieParser = require("cookie-parser");
const path = require('path');
const socketIO = require('socket.io');
const mapdrawing = require('./mapdrawing.model');
const MapCanvas = require('./mapcanvas.model');

const must = require('../../utils/must');
const { authorizeBasic } = require("../../users");
const { authorizeToken } = require("../../users/js/users.authorize");
const turf = require('@turf/turf');
const {feature2Dify} = require('./giomap.utils');

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
  // log static paths
  console.log('static paths:');
  app._router.stack.forEach(function(r){ 
    if (r.route && r.route.path){
      console.log(r.route.path)
    }
  })

  // add client side graphics to existing app static paths
  app.use('/giomap/graphics', express.static(path.join(__dirname, '../client/graphics')));


  // add views/giomap.ejs as a view on route /giomap
  const router = require("./giomap.router");
  app.use("/giomap", router);
  

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
        socket.emit('notAuthorized', {success: false, message: "Not authorized, token not available"});
        return {success: false, message: "Not authorized, token not available"};
      }
      // verify JWT
      const verified = await authorizeToken(token, ["admin", "basic"]);
      // if not verified, send error message to user
      if (!verified.success) {
        socket.emit('notAuthorized', verified);
        return {success: false, message: "Not authorized, token not available"};
      }
      return verified;
    }
    
    async function saveGeometry (json, socket) {
      // verify user
      const verified = await socketVerifyUser(socket);
      // if not verified, send error message to user
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }
      const mapcanvasShareLinkId = json.mapcanvasShareLinkId;
      var data = json.layer;


      must(data && data.geometry && data.geometry.type && data.geometry.coordinates, "geometry must be a valid geojson feature");
      must(data.properties && data.properties.uuid, "geometry must have a uuid property");
      
      // convert 3d coordinates to 2d

      data = feature2Dify(data);

      // find the mapcanvas that this geometry belongs to
      const mapCanvas = await MapCanvas.findOne({shareLinkId: mapcanvasShareLinkId});
      // if not found, return
      if (!mapCanvas) {
        throw new Error('mapcanvas '+mapcanvasShareLinkId+' not found');
      }
      
      // check if uuid already exists in db
      const existing = await mapdrawing.findOne({"feature.properties.uuid": data.properties.uuid});
      // if it does, update it
      if (existing){
        existing.feature = data;
        existing.userId = null;
        existing.socketId = socket.id;
        existing.mapcanvas = mapCanvas._id;
        const saved = await existing.save();

      } else {
        // if not, create a new entry
        let giomapEntry = await mapdrawing.create({
          feature: data,
          userId: null,
          socketId: socket.id,
          mapcanvas: mapCanvas._id,
          createdBy: verified.user.id
        })
        const saved = await giomapEntry.save();
        
        // add the new entry to the mapcanvas
        
        mapCanvas.mapdrawings.push(giomapEntry._id);
        await mapCanvas.save();
        
      }
      return data;

    }


    // LIVE UPDATES BETWEEN USERS
    // handle user creating/editing a geometry
    socket.on("iMadeAGeometry!",
      async json => {
        saveGeometry(json, socket)
        .then((data) => {
          // broadcast to mapcanvasShareLinkId room
          socket.broadcast.to(json.mapcanvasShareLinkId).emit('someoneMadeAGeometry!', data);
        })
      }
    );
    
    // handle user deleting a geometry
    
    socket.on("iDeletedAGeometry!", async data => {

      // verify user

      const verified = await socketVerifyUser(socket);
      // if not verified, send error message to user
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }
      must(data && data.properties && data.properties.uuid, "geometry must have a uuid property");
      const deleted = await mapdrawing.deleteOne({"feature.properties.uuid": data.properties.uuid});
      // broadcast to mapcanvasShareLinkId room
      socket.broadcast.emit('someoneDeletedAGeometry!', data);
    })


    socket.on("iUploadedGeometriesFromFile!", async json => {

      // verify user

      const verified = await socketVerifyUser(socket);

      // if not verified, send error message to user
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }

      // flatten each feature in the json.layer array with turf.flatten
      // then send each feature to receiveGeometry
      


      layer_flat = turf.flatten(json.layer);

      layer_flat.features.forEach((feature) => {
        // reconstruct json, save to db and broadcast to room
        const  newJson = {
          layer: feature,
          mapcanvasShareLinkId: json.mapcanvasShareLinkId
        }

       saveGeometry(newJson, socket)
        .then((data) => {
          // broadcast to mapcanvasShareLinkId room
          io.to(json.mapcanvasShareLinkId).emit('someoneMadeAGeometry!', data);

        })
      })
      
    }
    )


    // handle workshop host instructions

    socket.on('iHighlightedAGeometryForEveryone!', async json => {
      console.log('iHighlightedAGeometryForEveryone!', json);

      // // verify user

      const verified = await socketVerifyUser(socket);

      // if not verified, send error message to user
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }

      // is user the map canvas owner?
      const mapcanvas = await MapCanvas.findOne({shareLinkId: json.mapcanvasShareLinkId});
      if (mapcanvas.createdBy != verified.user.id) {
        socket.emit('notAuthorized', {success: false, message: "Not authorized, must be map canvas owner"});
        return;
      }

      // broadcast to mapcanvasShareLinkId room including sender
      // socket.broadcast.to(json.mapcanvasShareLinkId).emit('someoneHighlightedAGeometryForEveryone!', json);
      io.to(json.mapcanvasShareLinkId).emit('someoneHighlightedAGeometryForEveryone!', json);

    })

    socket.on('iBringEveryoneToMyView!', async json => {
      console.log('iBringEveryoneToMyView!', json);

      io.to(json.mapcanvasShareLinkId).emit('someoneBringsEveryoneToTheirView!', json.mapView);

    })


  })
}

