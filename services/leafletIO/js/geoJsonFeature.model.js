const mongoose = require('mongoose');

const geoJsonFeatureSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Feature'],
        required: true
    },
    geometry: {
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
            type: [[Number]],
            required: true
        }
    },
    properties: {
        // keep this open
        type: Object,
        required: true
    }
});

const GeoJsonFeature = mongoose.model('GeoJsonFeature', geoJsonFeatureSchema);

module.exports = GeoJsonFeature;