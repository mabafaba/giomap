
mapio = function(map, mapCanvasShareLinkId, onEachNewFeature, editingLayer){
    mapio = {
        map: map,
        mapCanvasShareLinkId: mapCanvasShareLinkId,
        onEachNewFeature: onEachNewFeature,
        editingLayer: null,
        socket: io(),
        init: function (map) {
            // Initialise the FeatureGroup to store editable layers
            if(!editingLayer){
                console.log('no editingLayer provided, creating new one');
                this.editingLayer = new L.FeatureGroup();
                this.editingLayer.addTo(map);
            }else{
                this.editingLayer = editingLayer;
                if(!map.hasLayer(editingLayer)){
                    this.editingLayer.addTo(map);
                }
            }

            // Initialise the draw control and pass it the FeatureGroup of editable layers
            var drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: this.editingLayer
                }
            });
            this.map.addControl(drawControl);
            this.connectMapToServer(this.map, this.editingLayer);

        },
        
        
        connectMapToServer: function (map, editingLayer) {
            this.socket.emit('joinMapRoom', this.mapCanvasShareLinkId, this.onEachNewFeature);
            this.listenForIncomingEdits(map, editingLayer);
            this.sendOutgoingEdits(map, editingLayer);
            this.addGeometriesFromServerToLayer('/drawmap/geojson/'+ this.mapCanvasShareLinkId, this.editingLayer);
            
        },
        
        listenForIncomingEdits: function (map, editingLayer) {
            this.socket.on('someoneMadeAGeometry!', (geojsonFeature)=>{
                console.log('received geometries!', geojsonFeature);
                newLayer = GeoJsonToLayer(geojsonFeature);
                
                // remove layer if it already exists
                var newuuid = geojsonFeature.properties.uuid;
                
                editingLayer.eachLayer(function (layer) {
                    console.log('layer',layer);
                    console.log('layer.feature.properties.uuid',layer.feature.properties.uuid);
                    if(layer.feature.properties.uuid == newuuid){
                        console.log('layer already exists');
                        console.log('removing layer',layer);
                        editingLayer.removeLayer(layer);
                    }
                });
                
                
                // add popup to layer
                newLayer.forEach( l => this.onEachNewFeature(l) );
                
                
                // add layer to map
                newLayer.forEach( l => editingLayer.addLayer(l) );
                
                
            });
            
            this.socket.on('someoneDeletedAGeometry!', (geojsonFeature)=>{
                console.log('received geometries!', geojsonFeature);
                newLayer = GeoJsonToLayer(geojsonFeature);
                var uuid = geojsonFeature.properties.uuid;
                // var geojsonLayer = L.geoJson(geojsonFeature);
                
                // remove layer with uuid from editingLayer
                editingLayer.eachLayer(function (layer) {
                    if(layer.feature.properties.uuid == uuid){
                        console.log('removing layer',layer);
                        editingLayer.removeLayer(layer);
                    }
                });
                
                
                // Add the layer to the map
                // receivedLayer.addTo(map);
            })
            
        },
        
        sendOutgoingEdits: function (map, editingLayer) {
            map.on('draw:created', (e) => {
                var type = e.layerType,
                layer = e.layer;
                
                // add popup to layer
                this.onEachNewFeature(layer);
                editingLayer.addLayer(layer);
                // layerWithPopup.openPopup();
                setTimeout(function(){layer.openPopup();}, 0); // waiting 0ms resolves the popup not opening when a rectangle is created by dragging instead of two clicks
                // save layer to server
                mapio.saveLayerToServer(layer);
                
                
            });
            
            map.on('draw:edited', function (e) {
                // leaflet attaches the edited layers to the event object
                var editedLayers = e.layers._layers
                // for each edited layer
                Object.keys(editedLayers).forEach(function(key) {
                    mapio.saveLayerToServer(editedLayers[key]);
                    
                });
                
                
                
                
            });
            
            map.on('draw:deleted', function (e) {
                // leaflet attaches the deleted layers to the event object
                var deletedLayers = e.layers._layers
                // for each item in layers (layers is an object, not an array)
                Object.keys(deletedLayers).forEach(function(key) {
                    // send to server as geojson
                    mapio.deleteLayerFromServer(deletedLayers[key]);
                });
                
            });
            
            
            map.on('draw:editstart', function (e) {
                // prevent popups from opening while editing geometries
                editingLayer.eachLayer(function (layer) {
                    // close any open popups
                    layer.closePopup();
                    // disable popup on click
                    layer.off('click');
                });
            });
            
            map.on('draw:editstop', function (e) {
                // reactivate popups after editing geometries
                editingLayer.eachLayer(function (layer) {
                    layer.on('click', function(e) {
                        layer.openPopup();
                    });
                });
            });
            
            
            this.socket.on('notAuthorized', (msg)=>{
                show_prompt('Not logged in!', 'You need to be logged in to edit this map. <a href="/user/login">Login</a> or <a href="/user/register">register</a> to continue.',false, "OK");
            })
            
            
        },
        
        
        saveLayerToServer: function (layer) {
            feature = layer.feature = layer.feature || {};
            // make sure layer has all required properties
            var feature = layer.feature = layer.feature || {};
            feature.type = feature.type || "Feature";
            feature.properties = feature.properties || {};
            feature.properties["name"] = feature.properties["name"] || "";
            feature.properties["description"] = feature.properties["description"] || "";
            
            // add uuid to feature if it doesn't exist yet
            feature.properties.uuid = feature.properties.uuid || crypto.randomUUID();
            console.log("sending geometries!", LayerToGeoJson(layer));
            this.socket.emit('iMadeAGeometry!', {"layer": LayerToGeoJson(layer), "mapcanvasShareLinkId": mapCanvasShareLinkId});
            
        },
        
        deleteLayerFromServer: function (layer) {
            this.socket.emit('iDeletedAGeometry!', LayerToGeoJson(layer));
        },
        
        addGeometriesFromServerToLayer: async function (endpoint, targetLayer) {
            console.log('EDITINGLAYER', this.editingLayer);
            console.log('TARGETLAYER', targetLayer);
            fetch(endpoint)
            // check status
            .then(response => {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                    response.status);
                    return;
                }
                
                return response;
            })
            .then(response => response.json())
            .then(data => {
                // get feature from data 
                data = data.map(x=>x.feature);
                // add geojson to editingLayer
                var geojsonLayer = GeoJsonToLayer(data);
                geojsonLayer.forEach(
                    (l)=>{
                        this.onEachNewFeature(l);
                        targetLayer.addLayer(l);
                        
                    });
                    
                });
                
            }
            
        }
        mapio.init(map);
        console.log('mapio',mapio);
        return mapio;
    }