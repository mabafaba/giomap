// Define your giomap module
const LeafletIOFeature = require("./js/leafletIOFeature.model");
const eventHandlers = require('./js/leafletIO.socketEventHandlers');
const cookieParser = require('cookie-parser');
const http = require('http');
// const socketio = require('socket.io');
const { Server } = require("socket.io");
const express = require('express');
const path = require('path');


// export a class

module.exports = class LeafletIO {
    /**
     * Creates a new instance of the LeafletIO class.
     * @constructor
     * @param {Object} io - The Socket.io server object.
     * @param {Function} [beforeGetRequest] - The function to be executed before get requests. Should accept req, res, and next parameters.
     * @param {Function} [beforeContributorAction] - The function to be executed before contributor actions. Should accept json and socket parameters and return json. Return false to stop the action.
     * @param {Function} [beforeHostAction] - The function to be executed before host actions. Should accept json and socket parameters and return json. Return false to stop the action.
     */
    constructor(
       io,
       beforeGetRequest = (req, res, next) => {next()},
       beforeContributorAction = (socket, json)=>{return json},
       beforeHostAction = (socket, json)=>{return json}

    ){ 
        this.app = express();

    


        this.io = io

        this.LeafletIOFeature = LeafletIOFeature
        this.eventHandlers = eventHandlers
        this.beforeGetRequest = beforeGetRequest
        this.beforeContributorAction = beforeContributorAction
        this.beforeHostAction = beforeHostAction
        
        this.app.use(express.json());
        this.app.use(cookieParser());
        this.#addRoutes(app);
        this.#addSocketEventHandlers();
        
    }
    
    #addRoutes(app){

        // add geojson route with beforeGetRequest as first middleware
        this.app.get('/geojson/:room', this.beforeGetRequest, (req, res) => {
            this.#getGeoJSON(req.params.room)
            .then((featureCollection) => {
                res.send(featureCollection);
            })
            .catch((err) => {
                console.log('Could not get GeoJSON', err);
            });
        });


        // add data route with beforeGetRequest as first middleware
        this.app.get('/data/:room', (req, res) => {
            this.#getData(req.params.room)
            .then((ioFeatures) => {
                // send back json file
                res.send(ioFeatures);
            })
            .catch((err) => {
                console.log('Could not get raw data', err);
            });
        });
        this.app.use('/leafletIOclient.js', express.static(path.join(__dirname, './client/js/leafletIOclient.js')));
        this.app.use('/example.html', express.static(path.join(__dirname, './client/example.html')));
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
                socket.join(json.mapRoom);
                
            });
            
            socket.on('iMadeAGeometry!', async (json) => {
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                eventHandlers.handleGeometry(socket, json);
                
            });
            
            socket.on('iDeletedAGeometry!', async (json) => {
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                eventHandlers.handleDeleteGeometry(socket, json);
                
            });

            socket.on('iDeletedAllGeometries!', async (json) => {
                json = await this.beforeHostAction(socket, json);
                if(!json) return;
                eventHandlers.handleDeleteAllGeometries(socket, json);
            });
            
            socket.on('iUploadedGeometriesFromFile!', async (json) => {
                json = await this.beforeContributorAction(socket, json);
                if(!json) return;
                eventHandlers.handleUploadedGeometriesFromFile(socket, this.io, json);
                
            });
            
            
            socket.on('iHighlightedAGeometryForEveryone!', async json => {
                json = await this.beforeHostAction(socket, json);
                if(!json) return;
                eventHandlers.handleHighlightGeometryForEveryone(socket, this.io, json);
                
            });
            
            
            socket.on('iBringEveryoneToMyView!', async json => {
                json = await this.beforeHostAction(socket, json);
                if(!json) return;
                eventHandlers.handleBringEveryoneToMyView(socket, this.io, json);
            })
        });
    }

    #getData(room){
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
            const geojson = ioFeatures.map((ioFeature) => {
                // convert to object
                ioFeature = ioFeature.toObject();
                ioFeature.feature.properties._id = ioFeature._id;
                ioFeature.feature.properties.mapRoom = ioFeature.mapRoom;
                ioFeature.feature.type = 'Feature';

                return ioFeature.feature;
            });
            // wrap into feature collection
            const featureCollection = {
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