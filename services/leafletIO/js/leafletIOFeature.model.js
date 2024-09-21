const mongoose = require('mongoose');

// import geojson feature model
const GeoJsonFeature = require('./geoJsonFeature.model');


const leafletIOFeatureSchema = new mongoose.Schema({
    // geojson feature. must be a valid geojson feature.
    // must contain a geometry object and a properties object
    // the geometry object must contain a type and coordinates
    feature: GeoJsonFeature.schema,
    
    // which map / socket.io room does this belong to?
    mapRoom: {
        type: String,
        required: true
    },

    uuid: {
        type: String,
        required: true
    },
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: false,
        default: null
    }
});

const LeafletIOFeature = mongoose.model('leafletIOFeature', leafletIOFeatureSchema);

module.exports = LeafletIOFeature;