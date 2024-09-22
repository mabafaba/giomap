leafletIO = function(map, mapRoom, userID, leafletIOEndpoint, socket){
    leafletIO = {
        map: map,
        mapRoom: mapRoom, // a string unique ID to create an 'obscure' url for the map
        editingLayer: null, // the leaflet layer object that the user is currently editing 
        layers: [], // array of leaflet layers that users can select and draw on
        socket: socket,
        leafletIOEndpoint: leafletIOEndpoint,
        controls: [],
        user: {
            id: userID,
            color: null
        },
        
        
        
        // allow users to do map.io.on('newFeature', ...)
        // to add other events, add them to the events object
        // with the same structure as newFeature
        // then call leafletIO.events[event].fire(layer) where the event should be fired.
        on : function (event, func) {
            this.events[event].add(func);
        },
        
        off : function (event, func) {
            this.events[event].remove(func);
        },
        
        events: {
            
            newFeature: {
                callbacks: [],
                add: function (callback) {
                    this.callbacks.push(callback);
                },
                remove: function (callback) {
                    this.callbacks = this.callbacks.filter(f => f !== callback);
                },
                fire: function (layer) {
                    this.callbacks.forEach(callback => callback(layer));
                }
            }
            
            
        },
        
        init: function (map) {
            this.loadDependencies();
            // Initialise the FeatureGroup to store editable layers
                // layer for editing:
                this.editingLayer = new L.FeatureGroup();
                this.editingLayer.addTo(map);
                this.layers.push({layer:this.editingLayer, name: 'shared'});
                this.editingLayer.addTo(map);
            
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
            // check if there's already geometries by this user, if yes, use the color
            var color = null;
            this.editingLayer.eachLayer((layer)=>{
                if(layer.feature.properties.createdBy.id == this.user.id){
                    if(layer.feature.properties.color){
                        color = layer.feature.properties.color;
                        this.user.color = color;
                        // stop loop
                        return;
                    }
                }
            });
            if(!color){
                color = randomColor();
            }
            this.changeDrawingColor(color);                    
            
            this.addEditingControls(this.map);
            this.connectMapToServer(this.map, this.editingLayer);
            // resize window to make sure map is displayed correctly
            window.dispatchEvent(new Event('resize'));
            
        },


        loadDependencies: function () {
            // function that loads dependency only if it's not already loaded
            function loadScript(src) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = src;
                script.onload = callback;
                document.head.appendChild(script);
            }

            function loadCSS(href) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = href;
                document.head.appendChild(link);
            }

            loadCSS('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css');


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
                        // fill: true,
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
            onAdd: (map) =>{
                var controlDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');                           
                controlDiv.innerHTML = '<a href="#" title="Upload GeoJSON" role="button" aria-label="Upload GeoJSON" id="uploadGeoJson"><i class="bx bx-upload" style="font-size: 1.5rem; color:#666666;padding-top:3px;display: flex; align-items: center; justify-content: center;"></i></a>';
                
                controlDiv.addEventListener('click', (e)=>{
                    
                    // show_prompt('Upload GeoJSON', 'Upload a GeoJSON file to add geometries to the map.',false, "Select File", "Cancel", openGeoJsonFileDialog);
                    
                    
                    // this.show_prompt(
                    //     'Upload GeoJSON',
                    //     'Upload a GeoJSON file to add geometries to the map. Multi-Geometries will be flattened; 3D geometries will be converted to 2D. <a href="https://geojson.org/" target="_blank">Learn more about GeoJSON</a>.', 
                    //     false,
                    //     'Cancel',
                    //     'Upload File',
                    //     'openGeoJsonFileDialog()');
                    // manual prompt
                    var input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.geojson';
                    input.onchange = e => { 
                        var file = e.target.files[0]; 
                        var reader = new FileReader();
                        reader.onload = (e) => {
                                                    // prevent default action
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        // get file contents
                        var contents = e.target.result;
                        // parse contents as json
                        var geojson = JSON.parse(contents);
                        // create layers from geojson features and add them to the editing layer
                        // not included in leafletIO, so doing it manually here
                        geojson.features.forEach((feature)=>{
                            // add uuid to feature
                            feature.properties.uuid = crypto.randomUUID();
                            feature.properties.createdBy = this.user;
                            feature.properties.color = this.user.color;

                            // make sure Points are declared as circle markers
                            // add properties.markerType: "circle"
                            if(feature.geometry.type == "Point"){
                                feature.properties.markerType = "circle";
                            }
                            
                            
                            // send to server 
                            this.socket.emit('iUploadedGeometriesFromFile!',
                            {layer: feature, mapRoom: this.mapRoom, userId: this.user.id}
                            );
                        });
                        }
                        reader.readAsText(file);
                    }
                    input.click();
                    
                      
                        
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
            
            
            
        },        
        
        
        connectMapToServer: function (map, editingLayer) {
            this.socket.emit('joinMapRoom', {mapRoom:this.mapRoom});
            this.listenForIncomingEdits(map, editingLayer);
            this.sendOutgoingEdits(map, editingLayer);
            this.addGeometriesFromServerToLayer(this.leafletIOEndpoint +"/raw/" +this.mapRoom, this.editingLayer);
            this.listenForWorkshopHostInstructions();
            
        },
        
        listenForWorkshopHostInstructions: function () {
            this.socket.on('someoneHighlightedAGeometryForEveryone!', (json)=>{
                
                // close all popups, highlight feature, fly to feature
                uuid = json.uuid;
                
                this.editingLayer.eachLayer( (layer) => {
                    if(layer.feature.properties.uuid == uuid){
                        layer.closePopup();
                        this.highlightFeature(layer);
                        this.flyToFeature(layer);
                    }
                });
                
                
            });
            
            this.socket.on('someoneBringsEveryoneToTheirView!', (json)=>{
                this.map.setView(json.center, json.zoom);
            })
            
            
        },
        
        
        disableEditing: function () {
            this.editingLayer.eachLayer(function (layer) {
                layer.unbindPopup();
                
            });
            
        },
        
        enableEditing: function () {
            this.editingLayer.eachLayer(function (layer) {
                // enable popups
                layer.bindPopup();
            });
            
        },
        
        
        highlightLayerForEveryone: function (layer) {
            // send layer as geojson to server
            toHighlight = {
                "uuid": layer.feature.properties.uuid,
                "mapRoom": this.mapRoom
                
            }
            this.socket.emit('iHighlightedAGeometryForEveryone!', toHighlight);
        },
        
        
        listenForIncomingEdits: function (map, editingLayer) {
            this.socket.on('someoneMadeAGeometry!', (geojsonFeature)=>{
                console.log('someoneMadeAGeometry!', geojsonFeature);
                
                
                newLayer = this.GeoJsonToLayer(geojsonFeature);
                
                // remove layer if it already exists
                var newuuid = geojsonFeature.properties.uuid;
                
                editingLayer.eachLayer(function (layer) {
                    if(layer.feature.properties.uuid == newuuid){
                        editingLayer.removeLayer(layer);
                    }
                });
                
                
                
                
                // run newFeature event
                newLayer.forEach( l => this.events.newFeature.fire(l) );                
                
                // add layer to map
                newLayer.forEach( l => editingLayer.addLayer(l) );
                
                // style
                newLayer.forEach( l => this.styleGeometry(l) );
                
                
            });
            
            this.socket.on('someoneDeletedAGeometry!', (geojsonFeature)=>{
                newLayer = this.GeoJsonToLayer(geojsonFeature);
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
            this.map.on('draw:created', (e) => {

                var type = e.layerType,
                layer = e.layer;
                
                // add popup to layer
                this.events.newFeature.fire(layer);
                
                // add user 
                // layer.feature.properties.user = this.user;
                // layerWithPopup.openPopup();
                setTimeout(function(){layer.openPopup();}, 0); // waiting 0ms resolves the popup not opening when a rectangle is created by dragging instead of two clicks
                this.editingLayer.addLayer(layer);
                
                // save layer to server
                this.setLayerForEveryone(layer);
                
                
                
            });
            
            this.map.on('draw:edited', (e) => {
                // leaflet attaches the edited layers to the event object
                var editedLayers = e.layers._layers
                // for each edited layer
                Object.keys(editedLayers).forEach((key) => {
                    this.setLayerForEveryone(editedLayers[key]);
                    
                });
                
                
                
                
            });
            
            this.map.on('draw:deleted',  (e)=> {
                // leaflet attaches the deleted layers to the event object
                var deletedLayers = e.layers._layers
                // for each item in layers (layers is an object, not an array)
                Object.keys(deletedLayers).forEach((key)=> {
                    // send to server as geojson
                    this.deleteLayerFromServer(deletedLayers[key]);
                });
                
            });
            
            
            this.map.on('draw:editstart', function (e) {
                // prevent popups from opening while editing geometries
                editingLayer.eachLayer(function (layer) {
                    // close any open popups
                    layer.closePopup();
                    // disable popup on click
                    layer.off('click');
                });
            });
            
            this.map.on('draw:editstop', function (e) {
                // reactivate popups after editing geometries
                editingLayer.eachLayer(function (layer) {
                    layer.on('click', function(e) {
                        layer.openPopup();
                    });
                });
            });
            
            
            this.socket.on('notAuthorized', (msg)=>{
                console.log('notAuthorized', msg);
                // show_prompt('Not logged in!', 'You need to be logged in to edit this map. <a href="giomap/user/login">Login</a> or <a href="giomap/user/register">register</a> to continue.',false, "OK");
            })
            
            
        },
        
        
        setLayerForEveryone: function(layer) {
            feature = layer.feature = layer.feature || {};
            // make sure layer has all required properties
            var feature = layer.feature = layer.feature || {};
            feature.type = feature.type || "Feature";
            feature.properties = feature.properties || {};
            feature.properties.uuid = feature.properties.uuid || crypto.randomUUID();
            console.log('this', this);
            feature.properties.createdBy = this.user;
            
            feature.properties.color = this.user.color;
            feature.properties.opacity = 1;
            feature.properties.fill = true;
            feature.properties.fillColor = this.user.color;
            feature.properties.fillOpacity = 1;
            // count how often setLayerForEveryone is called
            feature.properties.setLayerForEveryoneCount = feature.properties.setLayerForEveryoneCount ? feature.properties.setLayerForEveryoneCount + 1 : 1;
            
            this.styleGeometry(layer);
            console.log('iMadeAGeometry!', {"layer": this.LayerToGeoJson(layer), "mapRoom": mapRoom, "userId": this.user.id});
            this.socket.emit('iMadeAGeometry!', {"layer": this.LayerToGeoJson(layer), "mapRoom": mapRoom, "userId": this.user.id});
            
        },
        
        deleteLayerFromServer: function (layer) {
            console.log('iDeletedAGeometry!', {layer:this.LayerToGeoJson(layer)});
            this.socket.emit('iDeletedAGeometry!', {layer:this.LayerToGeoJson(layer)});
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
                    var geojsonLayer = this.GeoJsonToLayer(data);
                    
                    
                    
                    geojsonLayer.forEach(
                        (l)=>{
                            this.events.newFeature.fire(l);
                            targetLayer.addLayer(l);
                            this.styleGeometry(l);
                            // add internal onclick event
                            
                            
                            
                            
                        });
                        
                        // check if there's already a geometry by this user and if yes, copy color to this.user.color
                        geojsonLayer.forEach((l)=>{
                            console.log(l.feature.properties);
                            if(l.feature.properties.createdBy && l.feature.properties.createdBy.id){
                            
                                if(l.feature.properties.createdBy.id == this.user.id){
                                    if(l.feature.properties.color){
                                        this.user.color = l.feature.properties.color;
                                        // stop loop
                                        return;
                                    }
                                    
                                }   
                            }
                        });
                    
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
                opacity = layer.feature.properties.opacity ? layer.feature.properties.opacity : 0.9;
                fill = layer.feature.properties.fill ? layer.feature.properties.fill : true;
                // set weight to 2 if not set
                weight = layer.feature.properties.weight ? layer.feature.properties.weight : 4;
                fillOpacity = 0.6;
                // if layer is polygon or polyline , set fill to false
                if(layer instanceof L.Polygon || layer instanceof L.Polyline){
                    fill = false;
                }
                if(layer.setStyle){
                    
                    layer.setStyle({color: color, fill: fill, opacity: opacity, weight: weight, fillOpacity: fillOpacity});
                }
                
                
                
            },
            
            highlightFeature: function (layer) {
                // make all other features gray
                this.editingLayer.eachLayer(function (l) {
                    if(l.setStyle){
                        l.setStyle({color: '#808080'});
                    }
                    
                });
                // make selected feature white
                if(layer.setStyle){
                    layer.setStyle({
                        weight: 5,
                        color: '#FF0000'
                    });
                }
                layer.feature.properties.highlighted = true;
                
                // disable popup event on this layer
                // fly to feature
                this.flyToFeature(layer);
                
                // click anywhere to unhighlight
                // after 3 seconds
                setTimeout(()=>{
                    this.map.on('click', this.unhighlightFeature.bind(this));
                }
                , 0);
                
                
            },
            
            unhighlightFeature: function () {
                // return all features to original color and weight
                this.editingLayer.eachLayer(function (l) {
                    if(l.setStyle){
                        l.setStyle({color: l.feature.properties.color});
                        l.setStyle({weight: l.feature.properties.weight ? l.feature.properties.weight : 2});
                    }
                    // remove highlighted property (dont set to false, get rid)
                    delete l.feature.properties.highlighted;
                });
                
                // remove click event (only the particular unhighlight event)
                this.map.off('click', this.unhighlightFeature.bind(this));
                
                
                
                
            },
            
            flyToFeature: function (layer) {
                if(layer.getBounds){
                    this.map.flyToBounds(layer.getBounds());
                }else{
                    // fly to point, zooming in one level
                    
                    const newZoom = this.map.getZoom() + 1;
                    this.map.flyTo(layer.getLatLng(), newZoom);
                    
                }
                
            },
            
            bringEveryoneToMyView: function () {
                
                function getMapPerspective(map) {
                    const center = map.getCenter();
                    return {
                        center: [center.lat, center.lng],
                        zoom: map.getZoom()
                    };
                }
                
                
                // fly to all geometries
                var mapView = getMapPerspective(this.map);
                this.socket.emit('iBringEveryoneToMyView!', {
                    "mapRoom": this.mapRoom,
                    "mapView": mapView
                });
            },
            
            
            
            LayerToGeoJson: function(layer) {
                const json = layer.toGeoJSON();
                
                if (layer instanceof L.Circle) {
                    json.properties.radius = layer.getRadius();
                }
                else if (layer instanceof L.CircleMarker) {
                    json.properties.markerType = 'circle';
                }
                
                return json;
            },
            
            GeoJsonToLayer: function(data) {
                const layers = [];
                
                L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {
                        // handle circles
                        if (feature.properties && feature.properties.radius) {
                            return new L.Circle(latlng, feature.properties.radius);
                        }
                        // handle circlemarkers
                        else if (feature.properties && feature.properties.markerType === 'circle') {
                            return new L.CircleMarker(latlng);
                        }
                        else {
                            return new L.Marker(latlng);
                        }
                    },
                    onEachFeature: (feature, layer) => {
                        layers.push(layer);
                    },
                });
                return layers;
                
                
                
            }   
        }
        leafletIO.init(map);
        return leafletIO;
    }