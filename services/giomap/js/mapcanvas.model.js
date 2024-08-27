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
      // array of any length where each element is an object with at least a name and a type and a value
    geometryPropertyFields:  [
        {
            name: {
                type: String,
                required: true
            },
            type: { // must be 'categorical' or 'text'
                type: String,
                required: true,
                enum: ['categorical', 'text']
            },
            // additional information for categorical fields. required when type is 'categorical'
            categoricalValues: {
                type: Array,
                required: false
            }
        }
    ],
  
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
