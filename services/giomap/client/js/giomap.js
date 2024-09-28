// depends on

// libraries:
//  - Leaflet
//  - Leaflet.Editable
//  - Leaflet.draw
//  
// local:
//  - leafletIOclient.js
// - leafletgraticule.js    

class Giomap {
    constructor(mapId) {
        this.mapId = mapId;
        // clean up map id (only allow alphanumeric characters)
        this.mapId = this.mapId.replace(/[^a-zA-Z0-9]/g, '');
        this.metadata = "havent called init yet";
        this.map = null;
        this.leafletIO = null;
        this.typologies = null;
    }
    
    async init () {
        
        // 1. fetch map metadata
        // 2. create map object
        // 3. connect map to backend and other users (leafletIO)
        io = io || window.io;
        
        const mapCanvas = await this.fetchMapMetaData(mapId);
        this.metadata = mapCanvas;
        
        this.map = L.map('map',{
            zoomControl: false,
            editable: true
        });
        
        this.map.setView(mapCanvas.leafletView.center, mapCanvas.leafletView.zoom);
        
        // add giomap typologies to map object
        this.typologies = mapCanvas.typologies;
        // add a regular grid overlay
        this.#addGraticule(this.map);
        // add base map tiles
        this.#addBaseMapTiles(mapCanvas, this.map);
        // add zoom control to map
        L.control.zoom({position: 'bottomright'}).addTo(this.map);
        
        
        // connect this map to the backend and to other users 
        // this contains all the logic for editing the map and keeping users in sync.
        // see leafletJS service for more details.
        this.leafletIO = leafletIOclient(
            this.map,
            this.mapId,
            '/giomap/leafletIO');
            
            // get user details and set drawing color accordingly
            await this.fetchUser();
            
            // newFeature events must be handled by the leafletIO instance, as they come in through different channels
            // (drawn by user, live received through socket.io, or downloaded from server on initial load)
            this.leafletIO.on('newFeature', (layer) => {
                // add base properties to layer if they don't exist
                layer.feature = layer.feature ? layer.feature : {};
                layer.feature.properties = layer.feature.properties ? layer.feature.properties : {};
                layer.feature.properties.username = layer.feature.properties.username ? layer.feature.properties.username : this.user.username;
                layer.feature.properties.color = layer.feature.properties.color ? layer.feature.properties.color : this.user.drawingColor;
                this.addEditPropertiesPopupToLayer(layer);
            });
            
            
            return this;
            
        }
        
        async fetchUser () {
            
            
            // get the user
            return fetch('../user/me')
            .then(res => res.json())
            .then(user => {
                this.user = user;
                console.log('got user', user);
                // if the user already has a drawing color, set it
                if(this.user && this.user.data && this.user.data.drawingColor){
                    this.leafletIO.changeDrawingColor(this.user.drawingColor);
                    return;
                }
                
                console.log('user has no drawing color');
                // if not, assign a random color
                const randomInt = (min, max) => {
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                };
                
                const random_color_h = randomInt(0, 360);
                const random_color_s = 100;
                const random_color_l = randomInt(40, 90);
                const random_color = `hsl(${random_color_h},${random_color_s}%,${random_color_l}%)`
                
                this.user.drawingColor = random_color;
                this.leafletIO.changeDrawingColor(random_color);
                
                // post random_color as d color to server
                fetch('/giomap/drawingColor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        drawingColor: random_color
                    })
                })
                
            })
            .catch(err => {
                console.error('Could not get user', err);
            });
            
            
            
        }
        
        
        addEditPropertiesPopupToLayer (somelayer){   
            // parameter called "someLayer" because scope is a little confusing here.   
            
            // this whole portion is a bit convoluted:
            // - addEditPropertiesPopupToLayer is a method of the Giomap class. It adds a popup to a layer,
            // which contains a form for editing the layer's properties.
            
            // it is passed to the leafletIO instance as a callback for the 'newFeature' event, 
            // because leafletio handles all incoming features (drawn, live received or downloaded from server history),
            // That way, all new features get a popup.
            
            // however the submission of the form is handled by a TypologySelector instance,
            // which needs to know which layer it is working with.
            // by defining the TypologySelector instance within the addEditPropertiesPopupToLayer method,
            // as a js "closure", it has access to the layer variable.
            
            // long story short: refactoring this part to get rid of the nested function definitions will cause PROBLEMS <3 because the whole thing relies on the environment each function is created in. Good luck!
            
            
            somelayer.bindPopup();
            somelayer.on('popupopen', function(e) {
                
                
                
                const submitPopupForm = (e) =>{
                    
                    e.preventDefault(); // prevent default submit action
                    e.stopImmediatePropagation(); // prevent other event listeners from firing
                    
                    // if cancel button was clicked, close popup and return 
                    if(e.submitter.value=="cancel"){
                        somelayer.closePopup();
                        return;
                        
                    }
                    
                    // if save button was clicked, copy form data to layer and send to server
                    if(e.submitter.value=="save"){
                        // make sure layer has a feature object with properties key
                        var feature = somelayer.feature = somelayer.feature || {};
                        feature.type = "Feature";
                        feature.properties = feature.properties || {};
                        // set typology based on selected typology
                        feature.properties.typology = typologySelector.selectedTypology();
                        feature.properties.custom = typologySelector.data;    
                        
                        giomap.leafletIO.setLayerForEveryone(somelayer);
                    }
                    somelayer.closePopup();
                    
                }
                
                // create typology selector & form
                const typologySelector = new TypologySelector(giomap.typologies, null, submitPopupForm);
                
                var feature = somelayer.feature = somelayer.feature || {};
                feature.type = "Feature";
                feature.properties = feature.properties || {};
                
                // set typology based on existing data
                if(feature.properties.typology && feature.properties.typology.name && feature.properties.typology.name !== ""){
                    typologySelector.update(
                        feature.properties.typology,
                        feature.properties.custom ? feature.properties.custom : {}
                        
                    );
                }
                
                
                // "created by" info (not editable)
                if(feature.properties.username){
                    var createdByParagraph = document.createElement('p');
                    createdByParagraph.style.fontSize = "0.8em";
                    createdByParagraph.style.color = "gray";
                    createdByParagraph.innerHTML = `by <span id="createdBy">${feature.properties.username}</span>`;
                    // add to parent
                    // popupContainer.appendChild(createdByParagraph);
                    // popupContainer.appendChild(document.createElement('br'));
                    // popupContainer.appendChild(document.createElement('br'));
                    
                }
                
                // delete layer button. Not a submit button. It just deletes the layer straight away.
                //  div with boxicon bx bx-trash
                
                //position:absolute;width:15px;right:5px;bottom:5px
                var deleteButton = document.createElement('div');
                deleteButton.style.position = "absolute";
                deleteButton.style.width = "15px";
                deleteButton.style.right = "5px";
                deleteButton.style.bottom = "5px";
                
                
                // deleteButton.innerHTML = '<a href="#" title="Delete layer" role="button" aria-label="Delete Layer" id="deleteLayer"><i class="bx bx-trash" style="font-size: 2rem; display: flex; align-items: center; justify-content: center; color:red; margin: auto;"></i></a>';
                // instead, place in bottom right corner of popup
                deleteButton.innerHTML = '<a href="#" title="Delete layer" role="button" aria-label="Delete Layer" id="deleteLayer"><i class="bx bx-trash" style="font-size: 2rem; display: flex; align-items: center; justify-content: center; color:black; margin: auto;"></i></a>';
                // above is top center.
                deleteButton.onclick = function(e){
                    giomap.leafletIO.deleteLayerFromServer(somelayer);
                    somelayer.remove();
                }
                
                
                
                
                // build html
                var popupContainer = document.createElement('div');
                popupContainer.appendChild(typologySelector.html);
                popupContainer.appendChild(typologySelector.typologyPropertiesForm.form);
                
                if(feature.properties.username){
                    popupContainer.appendChild(createdByParagraph);
                    popupContainer.appendChild(document.createElement('br'));
                    popupContainer.appendChild(document.createElement('br'));
                }
                popupContainer.appendChild(deleteButton);
                
                
                // append form to popup content
                somelayer.setPopupContent(popupContainer);
                
                
                
            });
            
            
            
            return somelayer;
            
        }
        
        
        fetchMapMetaData (mapCanvasID){
            // get map details from server
            return fetch('/giomap/list/json/' + mapCanvasID)
            .then(res => {
                if(res.status === 200) {
                    return res.json();
                } else {
                    throw new Error('Could not get map details');
                }
            })
        }
        
        
        
        
        #addBaseMapTiles (mapCanvas, map) {
            
            if(!mapCanvas.backgroundMaps || mapCanvas.backgroundMaps.length == 0){
                // if no background maps, add open street map
                mapCanvas.backgroundMaps = ['osm', 'googleHybrid', 'googleSatellite'];
            }
            
            // warn if basemap array contains invalid strings
            var validBaseMaps = ['osm', 'googleHybrid', 'googleSatellite', 'googleMap'];
            mapCanvas.backgroundMaps.forEach(function(bm){
                if(!validBaseMaps.includes(bm)){
                    console.warn('unsupported background map name: ' + bm);
                }
            });
            
            
            var googleMapLanguageUrlSuffix = '';
            if(mapCanvas.preferredMapLanguage && mapCanvas.preferredMapLanguage != 'user'){
                googleMapLanguageUrlSuffix = '&hl=' + mapCanvas.preferredMapLanguage;
            }
            var osm = {};
            var googleSatHybrid = {};
            var googleSat = {};
            
            if(mapCanvas.backgroundMaps.includes('osm')){
                osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);
            }
            
            if(mapCanvas.backgroundMaps.includes('googleHybrid')){
                var url = 'http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'+googleMapLanguageUrlSuffix;
                googleSatHybrid = L.tileLayer(url,{
                    maxZoom: 20,
                    subdomains:['mt0','mt1','mt2','mt3']
                }).addTo(map);
            }
            
            if(mapCanvas.backgroundMaps.includes('googleSatellite')){
                var url = 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'+googleMapLanguageUrlSuffix;
                googleSat = L.tileLayer(url,{
                    maxZoom: 20,
                    subdomains:['mt0','mt1','mt2','mt3']
                }).addTo(map);
            }
            
            if(mapCanvas.backgroundMaps.includes('googleMap')){
                var url = 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'+googleMapLanguageUrlSuffix;
                googleMap = L.tileLayer(url,{
                    maxZoom: 20,
                    subdomains:['mt0','mt1','mt2','mt3']
                }).addTo(map);
            }
            
            
            
            // controls to toggle between base map tile layers
            
            var baseMaps = {};
            
            if(mapCanvas.backgroundMaps.includes('osm')){
                baseMaps["OSM Map"] = osm;
            }
            
            
            if(mapCanvas.backgroundMaps.includes('googleMap')){
                baseMaps["Google Map"] = googleMap;
            }
            
            if(mapCanvas.backgroundMaps.includes('googleHybrid')){
                baseMaps["Google Hybrid"] = googleSatHybrid;
            }
            
            if(mapCanvas.backgroundMaps.includes('googleSatellite')){
                baseMaps["Google Satellite"] = googleSat;
            }
            
            L.control.layers(baseMaps, null, {position: 'bottomleft'}).addTo(map);
            
        }
        
        
        #addGraticule () {
            // add graticule
            var graticule = zoomLimitedGraticule(this.map, 0.5, 7);
            graticule.on();
            
            // add control to toggle graticule
            L.Control.ToggleGraticule = L.Control.extend({
                onAdd: function(map) {
                    
                    var controlDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');                           
                    controlDiv.innerHTML = '<a href="#" title="Toggle grid" role="button" aria-label="Toggle Grid" id="toggleGrid"><i class="bx bx-grid" style="font-size: 2rem; display: flex; align-items: center; justify-content: center; color:black; margin: auto;"></i></a>';
                    
                    controlDiv.onclick = function(e){
                        e.preventDefault();
                        if(graticule.isOn){
                            graticule.off();
                            // change icon color
                            controlDiv.innerHTML = '<a href="#" title="Toggle grid" role="button" aria-label="Toggle Grid" id="toggleGrid"><i class="bx bx-grid" style="font-size: 2rem; display: flex; align-items: center; justify-content: center; color:gray; margin: auto;"></i></a>'
                        } else {
                            graticule.on();
                            // change icon color
                            controlDiv.innerHTML = '<a href="#" title="Toggle grid" role="button" aria-label="Toggle Grid" id="toggleGrid"><i class="bx bx-grid" style="font-size: 2rem; display: flex; align-items: center; justify-content: center; color:black; margin: auto;"></i></a>'
                        }
                    }
                    return controlDiv;
                },
                onRemove: function(map) {
                    // Nothing to do here
                }
            });
            
            L.control.toggleGraticule = function(opts) {
                return new L.Control.ToggleGraticule(opts);
            }
            L.control.toggleGraticule({ position: 'bottomright' }).addTo(this.map);
            
            const updateGridControlButtonVisibility = ()=>{
                if(this.map.getZoom() <= graticule.minZoom){
                    document.getElementById('toggleGrid').style.display = 'none';
                } else {
                    document.getElementById('toggleGrid').style.display = 'block';
                }
            }
            
            updateGridControlButtonVisibility();
            // on zoom, show or hide graticule button depending on zoom level
            this.map.on('zoomend', updateGridControlButtonVisibility);
            
        }
        
        
        cleanShareLinkId (shareLinkId) {
            // remove any non-alphanumeric characters
            return shareLinkId.replace(/[^a-zA-Z0-9]/g, '');
        }
        
        
    }
    