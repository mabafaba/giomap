// Define your giomap module
const mapdrawing = require("./js/mapdrawing.model");
const MapCanvas = require("./js/mapcanvas.model");
const server = require("./js/giomap.server");

// Export the giomap module
module.exports = {
    mapdrawing,
    MapCanvas,
    server
};

