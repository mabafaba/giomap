const LeafletIOFeature = require('./leafletIOFeature.model');
const must = require('../../utils/must');
const feature2Dify = require('./leafletIO.utils').feature2Dify;
const turf = require('@turf/turf');
handleGeometry = async (socket, json) => {
  console.log("handling geometry",json);
  must(socket, "socket object must be passed");
  must(json.layer, "json.layer must exist");
  must(json.mapRoom, "json.mapRoom must exist");
  must(json.userId, "json.userId must exist");
  // save geometry to db and broadcast to all users in room
      // this handles new geometries and updates to existing geometries (overwrites by uuid)
      const layer = await saveGeometryToDatabase(json.layer, json.mapRoom, json.userId);

      broadcastGeometry(layer, json.mapRoom, socket);

}

handleDeleteGeometry = async (socket, json) => {
  must(json.layer, "json.layer must exist");

    deleteGeometryFromDataBase(json.layer).then((layer) => {
      socket.broadcast.emit('someoneDeletedAGeometry!', layer);
    });
  }


handleUploadedGeometriesFromFile = async (socket, io, json) => {

  must(socket, "socket object must be passed");
  must(json.layer, "json.layer must exist");
  must(json.mapRoom, "json.mapRoom must exist");
  must(json.userId, "json.userId must exist");



      // flatten each feature in the json.layer array with turf.flatten
      // then save each feature to the database and broadcast to all users on the map
      layer_flat = turf.flatten(json.layer);
      layer_flat.features.forEach((feature) => {
        // reconstruct json, save to db and broadcast to room
        saveGeometryToDatabase(feature, json.mapRoom, json.userId)
        .then((data) => {
          // not using broadcastGeometry, because we want to send to the uploader as well since the json is processed server side
          io.to(json.mapRoom).emit('someoneMadeAGeometry!', data);
        });

      });
    }


handleHighlightGeometryForEveryone = async (socket, io, json) => {

  must(json.uuid, "json.uuid must exist");
  must(json.mapRoom, "json.mapRoom must exist");
  // let everyone know to highlight the geometry
  io.to(json.mapRoom).emit('someoneHighlightedAGeometryForEveryone!', json);

}



handleBringEveryoneToMyView = async (socket, io, json) => {
  must(socket, "socket object must be passed");
  must(json.mapRoom, "json.mapRoom must exist");
  must(json.mapView, "json.mapView must exist");

  // let everyone know to go to the map owner's view
  io.to(json.mapRoom).emit('someoneBringsEveryoneToTheirView!', json.mapView);

}


// broadcast a geometry to a room
broadcastGeometry = async (layer, mapRoom, socket) => {
  must(layer, "layer must exist");
  must(mapRoom, "room must exist");
  // expect socket to exist
  console.log("broadcasting geometry to room", mapRoom);

  socket.broadcast.to(mapRoom).emit('someoneMadeAGeometry!', layer);
}

// save geometry to database

const saveGeometryToDatabase = async (layer, room, userId) => {
  // expect socket to exist


  must(layer && layer.geometry && layer.geometry.type && layer.geometry.coordinates, "geometry must be a valid geojson feature");
  must(layer.properties && layer.properties.uuid, "geometry must have a uuid property");
  
  // convert 3d coordinates to 2d

  layer = feature2Dify(layer);

  // check if uuid already exists in db
  const existing = await LeafletIOFeature.findOne({"feature.properties.uuid": layer.properties.uuid});
  // if it does, update it
  if (existing){
    existing.feature = layer;
    existing.userId = null;
    existing.mapRoom = room;
    existing.uuid = layer.properties.uuid;
    const saved = await existing.save();

  } else {
    // if not, create a new entry
    let leafletIOEntry = await LeafletIOFeature.create({
      feature: layer,
      userId: null,
      mapRoom: room,
      uuid: layer.properties.uuid,
      createdBy: userId
    })
    console.log("saving...", leafletIOEntry);
    const saved = await leafletIOEntry.save();  
  }
  return layer;

}

const deleteGeometryFromDataBase = async function (layer) {
  console.log("deleting geometry");
  console.log('deleteGeometryFromDataBase', layer);
  must(layer && layer.properties && layer.properties.uuid, "geometry must have a uuid property");
  const deleted = await LeafletIOFeature.deleteOne({"feature.properties.uuid": layer.properties.uuid});
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


