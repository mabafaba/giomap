handleGeometry = async (socket, json) => {
  // save geometry to db and broadcast to all users in room
      // this handles new geometries and updates to existing geometries (overwrites by uuid)
      verified = await socketVerifyUser(socket);

      if (!verified.success) {
        socket.emit('notAuthorized', verified);
        return;
      }

      const layer = await saveGeometryToDatabase(json.layer, json.mapcanvasShareLinkId, verified.user.id);

      broadcastGeometry(layer, json.mapcanvasShareLinkId, socket);

}

handleDeleteGeometry = async (socket, json) => {
    // make sure user is authorized
    const verified = await socketVerifyUser(socket);
    if (!verified.success) {
        socket.emit('notAuthorized', verified);
      return;
    }
    console.log("deleting geometry", json);
    deleteGeometryFromDataBase(json).then((layer) => {
      socket.broadcast.emit('someoneDeletedAGeometry!', layer);
    });
  }


handleUploadedGeometriesFromFile = async (socket, io, json) => {

      // make sure user is authorized
      const verified = await socketVerifyUser(socket);
      if (!verified.success) {
          socket.emit('notAuthorized', verified);
        return;
      }

      // flatten each feature in the json.layer array with turf.flatten
      // then save each feature to the database and broadcast to all users on the map
      layer_flat = turf.flatten(json.layer);
      layer_flat.features.forEach((feature) => {
        // reconstruct json, save to db and broadcast to room
        const room = cleanShareLinkId(json.mapcanvasShareLinkId);
        saveGeometryToDatabase(feature, room, verified.user.id)
        .then((data) => {
          // not using broadcastGeometry, because we want to send to the uploader as well since the json is processed server side
          io.to(json.mapcanvasShareLinkId).emit('someoneMadeAGeometry!', data);
        });

      });
    }


handleHighlightGeometryForEveryone = async (socket, io, json) => {
  // verify user

  const verified = await socketVerifyUser(socket);

  // if not verified, send error message to user
  if (!verified.success) {
      socket.emit('notAuthorized', verified);
    return;
  }

  // insure user is the map owner
  
  const isMapOwner = await verifyUserIsMapOwner(socket, json.mapcanvasShareLinkId);
  if (!isMapOwner) {
    socket.emit('notAuthorized', {success: false, message: "You are not the map owner"});
    return;
  }
  // let everyone know to highlight the geometry
  io.to(json.mapcanvasShareLinkId).emit('someoneHighlightedAGeometryForEveryone!', json);

}



handleBringEveryoneToMyView = async (socket, io, json) => {

  // // verify user

  const verified = await socketVerifyUser(socket);

  // if not verified, send error message to user
  if (!verified.success) {
      socket.emit('notAuthorized', verified);
    return;
  }

  // insure user is the map owner
  
  const isMapOwner = await verifyUserIsMapOwner(verified.user.id, json.mapcanvasShareLinkId);
  if (!isMapOwner) {
    socket.emit('notAuthorized', {success: false, message: "You are not the map owner"});
    return;
  }

  // let everyone know to go to the map owner's view
  io.to(json.mapcanvasShareLinkId).emit('someoneBringsEveryoneToTheirView!', json.mapView);

}



    
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



verifyUserIsMapOwner = async function(socket, mapcanvasShareLinkId) {
  // is user logged in?
  const verified = await socketVerifyUser(socket);
  // if not verified, send error message to user
  if (!verified.success) {
    return false;
  }
  // is user the map canvas owner?
  const mapcanvas = await MapCanvas.findOne({shareLinkId: mapcanvasShareLinkId});
  if (mapcanvas.createdBy == verified.user.id) {
    return true;
  }
  return false;

}

cleanShareLinkId = (shareLinkId) => {
  // remove any non-alphanumeric characters
  return shareLinkId.replace(/[^a-zA-Z0-9]/g, '');
}

// broadcast a geometry to a room
broadcastGeometry = async (layer, room, socket) => {
  // expect socket to exist
  must(socket, "socket object must exist, should be called inside io.on('connection', (socket) => { ... })");
  roomCleaned = cleanShareLinkId(room);
  socket.broadcast.to(roomCleaned).emit('someoneMadeAGeometry!', layer);
}

// save geometry to database

const saveGeometryToDatabase = async (layer, room, userId) => {
  // expect socket to exist

  const roomCleaned = cleanShareLinkId(room);

  must(layer && layer.geometry && layer.geometry.type && layer.geometry.coordinates, "geometry must be a valid geojson feature");
  must(layer.properties && layer.properties.uuid, "geometry must have a uuid property");
  
  // convert 3d coordinates to 2d

  layer = feature2Dify(layer);

  // find the mapcanvas that this geometry belongs to
  const mapCanvas = await MapCanvas.findOne({shareLinkId: roomCleaned});
  // if not found, return
  if (!mapCanvas) {
    throw new Error('mapcanvas '+roomCleaned+' not found');
  }
  
  // check if uuid already exists in db
  const existing = await mapdrawing.findOne({"feature.properties.uuid": layer.properties.uuid});
  // if it does, update it
  if (existing){
    existing.feature = layer;
    existing.userId = null;
    existing.mapcanvas = mapCanvas._id;
    const saved = await existing.save();

  } else {
    // if not, create a new entry
    let giomapEntry = await mapdrawing.create({
      feature: layer,
      userId: null,
      mapcanvas: mapCanvas._id,
      createdBy: userId
    })
    const saved = await giomapEntry.save();
    
    // add the new entry to the mapcanvas
    
    mapCanvas.mapdrawings.push(giomapEntry._id);
    await mapCanvas.save();
    
  }
  return layer;

}

const deleteGeometryFromDataBase = async function (layer) {
  console.log("deleting geometry");
 
  must(layer && layer.properties && layer.properties.uuid, "geometry must have a uuid property");
  const deleted = await mapdrawing.deleteOne({"feature.properties.uuid": layer.properties.uuid});
  return layer;
}



// default export
module.exports = {
  handleGeometry,
  handleDeleteGeometry,
  handleUploadedGeometriesFromFile,
  handleHighlightGeometryForEveryone,
  handleBringEveryoneToMyView
}


