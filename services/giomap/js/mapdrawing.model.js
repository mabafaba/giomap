const mongoose = require('mongoose');

const mapdrawingSchema = new mongoose.Schema({
    // geojson feature. must be a valid geojson feature.
    // must contain a geometry object and a properties object
    // the geometry object must contain a type and coordinates
    feature: {
        // specify all the fields in the geojson feature
        type: {
            type: String,
            enum: ['Feature'],
            required: true
        },
        properties: {
            type: Object,
            required: true
        }, 
        geometry: {
            // must contain type and coordinates
            type: {
                type: String,
                enum: [
                    "Point",
                    "MultiPoint",
                    "LineString",
                    "MultiLineString",
                    "Polygon",
                    "MultiPolygon",
                    "GeometryCollection",
                    "Feature",
                    "FeatureCollection"
                ],
                required: true
            },
            coordinates: {
                type: Array,
                required: true
            }
        }
    },
    
    // which mapcanvas does this belong to?
    mapcanvas: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'mapcanvas',
        required: true
    },
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: false,
        default: null
    },
    socketId: {
        type: String,
        required: false,
        default: null
    }
});

const mapdrawing = mongoose.model('mapdrawing', mapdrawingSchema);

module.exports = mapdrawing;