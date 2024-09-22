// Define your giomap module
const LeafletIOFeature = require("./js/leafletIOFeature.model");
const eventHandlers = require('./js/leafletIO.socketEventHandlers');
const cookieParser = require('cookie-parser');

// require socket.io
const io = require('socket.io');
const express = require('express');
const path = require('path');


// export a class

module.exports = class LeafletIO {
    /**
     * Creates a new instance of the LeafletIO class.
     * @constructor
     * @param {Object} app - The Express app object.
     * @param {string} route - The endpoint route for the LeafletIO routes.
     * @param {Object} io - The socket.io object.
     * @param {Function} [beforeContributorAction] - The function to be executed before contributor actions. Should accept json and socket parameters and return json. Return false to stop the action.
     * @param {Function} [beforeHostAction] - The function to be executed before host actions. Should accept json and socket parameters and return json. Return false to stop the action.
     */
    constructor(
        app, 
        route = '/leafletIO',
        io,
       beforeGetRequest = (req, res, next) => {next()},
       beforeContributorAction = (socket, json)=>{return json},
       beforeHostAction = (socket, json)=>{return json}

    ){ 

        this.LeafletIOFeature = LeafletIOFeature
        this.eventHandlers = eventHandlers
        this.io = io
        this.route = route
        this.beforeGetRequest = beforeGetRequest
        this.beforeContributorAction = beforeContributorAction
        this.beforeHostAction = beforeHostAction
        
        app.use(express.json());
        app.use(cookieParser());
        this.#addRoutes(app, route);
        this.#addSocketEventHandlers();
        
    }
    
    #addRoutes(app, route){
        console.log('adding routes')
        console.log("route", route)

        // add geojson route with beforeGetRequest as first middleware
        app.get(route + '/geojson/:room', this.beforeGetRequest, (req, res) => {
            this.#getGeoJSON(req.params.room)
            .then((featureCollection) => {
                res.send(featureCollection);
            })
            .catch((err) => {
                console.log('Could not get GeoJSON', err);
            });
        });


        // add data route with beforeGetRequest as first middleware
        app.get(route + '/raw/:room', this.beforeGetRequest, (req, res) => {
            console.log('getting raw data')
            this.#getData(req.params.room)
            .then((ioFeatures) => {
                console.log('ioFeatures', ioFeatures)
                // send back json file
                res.send(ioFeatures);
            })
            .catch((err) => {
                console.log('Could not get raw data', err);
            });
        });
        // serve client side js
        console.log('leafletIO static path', route + '/js')
        console.log('path', path.join(__dirname, './client/js'))
        app.use(route + '/leafletIOclient.js', express.static(path.join(__dirname, './client/js/leafletIO.js')));
        app.use(route + '/example.html', express.static(path.join(__dirname, './client/example.html')));
    }
    
    #addSocketEventHandlers(){
        
        this.io.use((socket, next) => {
            cookieParser()(socket.request, socket.request.res, next);
        });
        
          
        this.io.on('connection', (socket) => {

            socket.on("connect_error", (err) => {
                console.log(`connect_error due to ${err.message}`);
              });
    
            
            socket.on('joinMapRoom', async (json) => {
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                console.log('joining MapRoom', json.mapRoom);
                socket.join(json.mapRoom);
                
            });
            
            socket.on('iMadeAGeometry!', async (json) => {
                console.log('iMadeAGeometry!', json)
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                eventHandlers.handleGeometry(socket, json);
                
            });
            
            socket.on('iDeletedAGeometry!', async (json) => {
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                eventHandlers.handleDeleteGeometry(socket, json);
                
            });
            
            socket.on('iUploadedGeometriesFromFile!', async (json) => {
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                eventHandlers.handleUploadedGeometriesFromFile(socket, this.io, json);
                
            });
            
            
            socket.on('iHighlightedAGeometryForEveryone!', async json => {
                json = await this.beforeHostAction(socket, json);
                if(!json) return;
                eventHandlers.handleHighlightGeometryForEveryone(socket, io, json);
                
            });
            
            
            socket.on('iBringEveryoneToMyView!', async json => {
                json = await this.beforeHostAction(socket, json);
                if(!json) return;
                eventHandlers.handleBringEveryoneToMyView(socket, io, json);
            })
        });
    }

    #getData(room){
        console.log('getting raw data for room', room);
    return this.LeafletIOFeature.find({ mapRoom: room })
    .then((ioFeatures) => {

        return ioFeatures;
    })
    .catch((err) => {
        console.log('Could not get raw data', err);
    });
        
    }

    #getGeoJSON(room){
        return this.LeafletIOFeature.find({ mapRoom: room })
        .then(async (ioFeatures) => {
            // populate user details for all mapdrawings
            // only keep user id and username
            // copy user data to properties
            geojson = ioFeatures.map((ioFeature) => {
                // convert to object
                ioFeature = ioFeature.toObject();
                ioFeature.feature.properties.createdBy = ioFeature.createdBy;
                ioFeature.feature.properties._id = ioFeature._id;
                ioFeature.feature.properties.room = ioFeature.room;
                ioFeature.feature.type = 'Feature';
                
                // remove top level properties
                delete ioFeature.createdBy;
                delete ioFeature.room;
                delete ioFeature._id;
                return ioFeature.feature;
            });
            // wrap into feature collection
            featureCollection = {
                type: 'FeatureCollection',
                features: geojson
            }
            return featureCollection;
            
        })
        .then((featureCollection) => {
            return featureCollection;
        })
        .catch((err) => {
            console.log('Could not get GeoJSON', err);
        })
    }

}