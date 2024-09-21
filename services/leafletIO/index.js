// Define your giomap module
const LeafletIOFeature = require("./js/leafletIOFeature.model");
const turf = require('@turf/turf');
const cookieParser = require('cookie-parser');


const eventHandlers = require('./leafletIO.socketEventHandlers');

// export a class

module.exports = class LeafletIO {
    /**
     * Creates a new instance of the LeafletIO class.
     * @constructor
     * @param {Object} app - The Express app object.
     * @param {string} route - The endpoint route for the LeafletIO routes.
     * @param {Function} [beforeContributorAction] - The function to be executed before contributor actions. Should accept json and socket parameters and return json. Return false to stop the action.
     * @param {Function} [beforeHostAction] - The function to be executed before host actions. Should accept json and socket parameters and return json. Return false to stop the action.
     */
    constructor(
        app, 
        route = '/leafletIO',
        beforeGetRequest = (req, res)=>{return req},
        beforeContributorAction = (json, socket)=>{return json},
        beforeHostAction = (json, socket)=>{return json}

    ){ 

        this.LeafletIOFeature = LeafletIOFeature
        this.eventHandlers = eventHandlers
        this.app = app
        this.io = io(
            {
                path: '/leafletIO-socket-io'
            }
        )
        this.parentRoute = parentRoute
        this.beforeContributorAction = beforeContributorAction
        this.beforeHostAction = beforeHostAction
        
        this.app.use(express.json());
        this.app.use(cookieParser());
        this.#addRoutes(route);
        this.#addSocketEventHandlers();
        
    }
    
    #addRoutes(route){
        // add geojson route with beforeGetRequest as first middleware
        this.app.get(route + '/geojson/:room', this.beforeGetRequest, (req, res) => {
            this.#getGeoJSON(req.params.room)
            .then((featureCollection) => {
                res.send(featureCollection);
            })
            .catch((err) => {
                console.log('Could not get GeoJSON', err);
            });
        });

        // add data route with beforeGetRequest as first middleware
        this.app.get(route + '/raw/:room', this.beforeGetRequest, (req, res) => {
            this.#getData(req.params.room)
            .then((ioFeatures) => {
                res.send(ioFeatures);
            })
            .catch((err) => {
                console.log('Could not get raw data', err);
            });
        });
        
        this.app.use(route, router);
        this.app.use(route + '/leafletIO.js', express.static(path.join(__dirname, '../client/js/lefaletIO.js')));
    }
    
    #addSocketEventHandlers(){
        
        this.io.use((socket, next) => {
            cookieParser()(socket.request, socket.request.res, next);
        });
        
        this.io.on('connection', (socket) => {
            
            socket.on('joinMapRoom', async (json) => {
                json = await this.beforeContributorAction(json, socket);
                if(!room) return;
                socket.join(json);
                
            });
            
            socket.on('iMadeAGeometry!', async (json) => {
                json = await this.beforeContributorAction(json, socket);
                if(!json) return;
                eventHandlers.handleGeometry(socket, json);
                
            });
            
            socket.on('iDeletedAGeometry!', async (json) => {
                json = await this.beforeContributorAction(json, socket);
                if(!json) return;
                eventHandlers.handleDeleteGeometry(socket, json);
                
            });
            
            socket.on('iUploadedGeometriesFromFile!', async (json) => {
                json = await this.beforeContributorAction(json, socket);
                if(!json) return;
                eventHandlers.handleUploadedGeometriesFromFile(socket, io, json);
                
            });
            
            
            socket.on('iHighlightedAGeometryForEveryone!', async json => {
                json = await this.beforeHostAction(json, socket);
                if(!json) return;
                eventHandlers.handleHighlightGeometryForEveryone(socket, io, json);
                
            });
            
            
            socket.on('iBringEveryoneToMyView!', async json => {
                json = await this.beforeHostAction(json, socket);
                if(!room) return;
                eventHandlers.handleBringEveryoneToMyView(socket, io, json);
            })
        });
    }

    #getData(room){
    return this.LeafletIOFeature.find({ mapRoom: req.params.room })
    .then((ioFeatures) => {
        res.send(ioFeatures);
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