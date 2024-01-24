const mongoose = require('mongoose');

const mapCanvasSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: false,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: false
    },
    leafletView: {
        // center looks like this: "[ { lat: 51.505, lng: -0.09 } ]"
        center: {
            type: Array,
            required: false
        },
        zoom: {
            type: Number,
            required: false
        }
    },
    mapdrawings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'mapdrawing'
    }],
    shareLinkId: {
        type: String,
        required: false
    }
});

const MapCanvas = mongoose.model('mapcanvas', mapCanvasSchema);

module.exports = MapCanvas;
