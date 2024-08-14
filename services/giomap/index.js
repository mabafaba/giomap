// Define your drawmap module
const mapdrawing = require("./js/mapdrawing.model");
const MapCanvas = require("./js/mapcanvas.model");
const server = require("./js/giomap.server");

// Export the drawmap module
module.exports = {
    mapdrawing,
    MapCanvas,
    server
};

