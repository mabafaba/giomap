// Define your drawmap module
const MapDrawing = require("./js/mapdrawing.model");
const MapCanvas = require("./js/mapcanvas.model");
const server = require("./js/drawmap.server");

// Export the drawmap module
module.exports = {
    MapDrawing,
    MapCanvas,
    server
};

