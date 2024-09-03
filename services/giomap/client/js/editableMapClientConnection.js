// OVERVIEW (short lines)

// mapio is a global object that is created when the page is loaded, and is used to connect to the server and edit the map.
// on init, it creates a socket connection to the server, and listens for incoming edits and sends outgoing edits.
// it also has a method to add existing geometries from the server to the editing layer.
// it has a method to save a layer to the server, and a method to delete a layer from the server.
// it has a method to change the drawing color, and a method to style a geometry.
// it has a method to add editing controls to the map, and a method to connect the map to the server.




mapio = function(map, mapCanvasShareLinkId, onEachNewFeature, editingLayer){
    mapio = {
        map: map,
        mapCanvasShareLinkId: mapCanvasShareLinkId, // a string unique ID to create an 'obscure' url for the map
        onEachNewFeature: onEachNewFeature, // function that is applied to each drawn 'feature' before it is added to leaflet  
        editingLayer: null, // the leaflet layer object that the user is currently editing 
        layers: [], // array of leaflet layers that users can select and draw on
        socket: io({
            path: "/giomap-socket-io"
        }),
        controls: [],
        user: null,
        init: function (map) {
            // Initialise the FeatureGroup to store editable layers
            if(!editingLayer){
                this.editingLayer = new L.FeatureGroup();
                this.editingLayer.addTo(map);
                this.layers.push({layer:this.editingLayer, name: 'shared'});
            }else{
                this.editingLayer = editingLayer;
                if(!map.hasLayer(editingLayer)){
                    this.editingLayer.addTo(map);
                }
            }
            
            fetch('/giomap/user/me')
            // catch unauthorized
            .then(response => {
                if (response.status === 401) {
                    console.log('Not authorized');
                    return;
                }
                return response.json();
            })
            .then(data => {
                if(data){
                    this.user = data;
                    // asign random color to user (hex)
                    const randomColor = (() => {
                        "use strict";
                      
                        const randomInt = (min, max) => {
                          return Math.floor(Math.random() * (max - min + 1)) + min;
                        };
                      
                        return () => {
                          var h = randomInt(0, 360);
                          var s = 100;
                          var l = randomInt(40, 90);
                          return `hsl(${h},${s}%,${l}%)`;
                        };
                      })();

                    this.changeDrawingColor(randomColor());                    
                }
                this.addEditingControls(this.map);
                this.connectMapToServer(this.map, this.editingLayer);
                // resize window to make sure map is displayed correctly
                window.dispatchEvent(new Event('resize'));
            });
            
        },
        
        addEditingControls: function (map) {
            
            
            // remove all controls
            this.controls.forEach((control)=>{
                map.removeControl(control);
            }
            );
            this.controls = [];
            
            // exclude clear all button from editing controls
            L.EditToolbar.Delete.include({
                removeAllLayers: false
            });
            
            // Initialise the draw control and pass it the FeatureGroup of editable layers
            // set all drawing options color to user color
            // no fill!!!!
            //  edit: {
            // featureGroup: this.editingLayer
            // }
            var drawControl = new L.Control.Draw({
                draw: {
                    polyline: {
                        shapeOptions: {
                            color: this.user.color,
                            fill: false,
                            opacity: 1

                        }
                    },
                    polygon: {
                        shapeOptions: {
                            color: this.user.color,
                            fill: true,
                            opacity: 1
                        }
                    },
                    // circle: {
                    //     shapeOptions: {
                    //         color: this.user.color,
                    //         fill: false
                            
                    //     }
                    // },
                    circle: false,
                    // rectangle: {
                    //     shapeOptions: {
                    //         color: this.user.color,
                    //         fill: false
                            
                    //     },
                    //     // remove marker from draw control
                    // },
                    rectangle: false,
                    circlemarker:
                    {
                        shapeOptions: {
                            color: this.user.color,
                            fill: true,
                            opacity: 1,
                            fillOpacity: 1
                            
                        }
                    },
                    marker: false
                },
                edit: {
                    featureGroup: this.editingLayer
                }
            });
            
            this.map.addControl(drawControl);
            this.controls.push(drawControl);
            
            
            L.Control.UploadGeoJson = L.Control.extend({
                onAdd: function(map) {
                    var controlDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');                           
                    controlDiv.innerHTML = '<a href="#" title="Upload GeoJSON" role="button" aria-label="Upload GeoJSON" id="uploadGeoJson"><i class="bx bx-upload" style="font-size: 2rem; display: flex; align-items: center; justify-content: center;"></i></a>';
                    
                    controlDiv.addEventListener('click', function(e){
                        
                        // show_prompt('Upload GeoJSON', 'Upload a GeoJSON file to add geometries to the map.',false, "Select File", "Cancel", openGeoJsonFileDialog);
                        
                        
                        show_prompt(
                            'Upload GeoJSON',
                            'Upload a GeoJSON file to add geometries to the map. Multi-Geometries will be flattened; 3D geometries will be converted to 2D. <a href="https://geojson.org/" target="_blank">Learn more about GeoJSON</a>.', 
                            false,
                            'Cancel',
                            'Upload File',
                            'openGeoJsonFileDialog()');
                            
                            
                        });
                        return controlDiv;
                    },
                    
                    onRemove: function(map) {
                        // Nothing to do here
                    }
                });
                
                
                L.control.uploadgeojson = function(opts) {
                    return new L.Control.UploadGeoJson(opts);
                }
                
                jsonuploadcontrol = L.control.uploadgeojson({ position: 'topright' });
                jsonuploadcontrol.addTo(map);
                this.controls.push(jsonuploadcontrol);


                // custom radio buttons to select which layer to edit / draw on
                
                // L.Control.LayerSelection = L.Control.extend({
                //     onAdd: function(map) {
                //         var controlDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');                           
                //         controlDiv.innerHTML = '<div class="layer-selection" style="display: flex; align-items: center; justify-content: center; gap: 5px; background:#FFFFFF;padding:4px;"><label for="layer-selection">Layer:</label><input type="radio" id="layer-selection" name="layer-selection" value="editing" checked><label for="editing">Editing</label><input type="radio" id="layer-selection" name="layer-selection" value="background"><label for="background">Background</label></div>';
                        
                //         controlDiv.addEventListener('click', function(e){
                //             if(e.target.value == 'editing'){
                //                 map.removeLayer(mapio.backgroundLayer);
                //                 map.addLayer(mapio.editingLayer);
                //             }else if(e.target.value == 'background'){
                //                 map.removeLayer(mapio.editingLayer);
                //                 map.addLayer(mapio.backgroundLayer);
                //             }
                //         });
                //         return controlDiv;
                //     },
                    
                //     onRemove: function(map) {
                //         // Nothing to do here
                //     }
                // });

                // L.control.layerselection = function(opts) {
                //     return new L.Control.LayerSelection(opts);
                // }

                // layerselectioncontrol = L.control.layerselection({ position: 'topright' });
                // layerselectioncontrol.addTo(map);

                // this.controls.push(layerselectioncontrol);


                
                
            },
            
            
            
            connectMapToServer: function (map, editingLayer) {
                this.socket.emit('joinMapRoom', this.mapCanvasShareLinkId, this.onEachNewFeature);
                this.listenForIncomingEdits(map, editingLayer);
                this.sendOutgoingEdits(map, editingLayer);
                this.addGeometriesFromServerToLayer('/giomap/geojson/'+ this.mapCanvasShareLinkId, this.editingLayer);
                
            },
            
            listenForIncomingEdits: function (map, editingLayer) {
                this.socket.on('someoneMadeAGeometry!', (geojsonFeature)=>{
                    newLayer = GeoJsonToLayer(geojsonFeature);
                    
                    // remove layer if it already exists
                    var newuuid = geojsonFeature.properties.uuid;
                    
                    editingLayer.eachLayer(function (layer) {
                        if(layer.feature.properties.uuid == newuuid){
                            editingLayer.removeLayer(layer);
                        }
                    });
                    
                    
                    // add popup to layer
                    newLayer.forEach( l => this.onEachNewFeature(l) );
                    
                    
                    // add layer to map
                    newLayer.forEach( l => editingLayer.addLayer(l) );
                    
                    // style
                    newLayer.forEach( l => this.styleGeometry(l) );
                    
                    
                });
                
                this.socket.on('someoneDeletedAGeometry!', (geojsonFeature)=>{
                    newLayer = GeoJsonToLayer(geojsonFeature);
                    var uuid = geojsonFeature.properties.uuid;
                    // var geojsonLayer = L.geoJson(geojsonFeature);
                    
                    // remove layer with uuid from editingLayer
                    editingLayer.eachLayer(function (layer) {
                        if(layer.feature.properties.uuid == uuid){
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
                    
                    // add user 
                    // layer.feature.properties.user = this.user;
                    // layerWithPopup.openPopup();
                    setTimeout(function(){layer.openPopup();}, 0); // waiting 0ms resolves the popup not opening when a rectangle is created by dragging instead of two clicks
                    
                    editingLayer.addLayer(layer);
                    // save layer to server
                    this.saveLayerToServer(layer);
                    
                    
                    
                    
                });
                
                map.on('draw:edited', (e) => {
                    // leaflet attaches the edited layers to the event object
                    var editedLayers = e.layers._layers
                    // for each edited layer
                    Object.keys(editedLayers).forEach((key) => {
                        this.saveLayerToServer(editedLayers[key]);
                        
                    });
                    
                    
                    
                    
                });
                
                map.on('draw:deleted',  (e)=> {
                    // leaflet attaches the deleted layers to the event object
                    var deletedLayers = e.layers._layers
                    // for each item in layers (layers is an object, not an array)
                    Object.keys(deletedLayers).forEach((key)=> {
                        // send to server as geojson
                        this.deleteLayerFromServer(deletedLayers[key]);
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
                    show_prompt('Not logged in!', 'You need to be logged in to edit this map. <a href="giomap/user/login">Login</a> or <a href="giomap/user/register">register</a> to continue.',false, "OK");
                })
                
                
            },
            
            
            saveLayerToServer: function (layer) {
                feature = layer.feature = layer.feature || {};
                // make sure layer has all required properties
                var feature = layer.feature = layer.feature || {};
                feature.type = feature.type || "Feature";
                feature.properties = feature.properties || {};
                feature.properties.uuid = feature.properties.uuid || crypto.randomUUID();

                // custom properties should already be set.

                // add user to feature
                feature.properties.createdBy = this.user;
                
                // add color to feature
                feature.properties.color = this.user.color;
                feature.properties.opacity = 1;
                feature.properties.fill = true;
                feature.properties.fillColor = this.user.color;
                feature.properties.fillOpacity = 1;
                this.styleGeometry(layer);
                
                this.socket.emit('iMadeAGeometry!', {"layer": LayerToGeoJson(layer), "mapcanvasShareLinkId": mapCanvasShareLinkId});
                
            },
            
            deleteLayerFromServer: function (layer) {
                this.socket.emit('iDeletedAGeometry!', LayerToGeoJson(layer));
            },
            
            addGeometriesFromServerToLayer: async function (endpoint, targetLayer) {
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
                            this.styleGeometry(l);
                            
                        });
                        
                        // check if there's already a geometry by this user and if yes, copy color to this.user.color
                        geojsonLayer.forEach((l)=>{
                            
                            if(l.feature.properties.createdBy._id == this.user.id){
                                if(l.feature.properties.color){
                                    this.user.color = l.feature.properties.color;
                                    // stop loop
                                    return;
                                }
                                
                            }   
                        }
                        );

                        this.addEditingControls(this.map);
                        
                        
                    });
                    
                },
                changeDrawingColor: function (color) {
                    this.user.color = color;
                    // edit draw control options
                    this.addEditingControls(this.map);
                    
                    
                },
                styleGeometry: function(layer){
                    color = layer.feature.properties.color ? layer.feature.properties.color : "#FF0000";
                    opacity = layer.feature.properties.opacity ? layer.feature.properties.opacity : 1;
                    if(layer.setStyle){
                        layer.setStyle({color: color, fill: false, opacity: opacity});
                    }
                    
                    
                    
                },
                
            }
            mapio.init(map);
            return mapio;
        }