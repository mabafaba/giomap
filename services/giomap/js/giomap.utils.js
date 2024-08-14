const must = require('../../utils/must');

/**
 * Removes the third dimension from the coordinates of a GeoJSON feature.
 * 
 * @param {Object} feature - The GeoJSON feature to modify.
 * @returns {Object} - The modified GeoJSON feature with 2D coordinates.
 * @throws {Error} - If the input feature is not a valid GeoJSON feature or if the geometry type changes.
 * @throws {Error} - If the deepest array in the coordinates does not have exactly 2 elements.
 */


function feature2Dify (feature) {
    // must be a valid geojson feature
    must(feature && feature.geometry && feature.geometry.type && feature.geometry.coordinates, "geometry must be a valid geojson feature");
    const previousFeature = feature;
    // if geometry is a point
    if (feature.geometry.type == "Point") {
        feature.geometry.coordinates = feature.geometry.coordinates.slice(0, 2);
    }
    // if geometry is a line
    if (feature.geometry.type == "LineString") {
        feature.geometry.coordinates = feature.geometry.coordinates.map((point) => {
            return point.slice(0, 2);
        });
    }
    // if geometry is a polygon
    if (feature.geometry.type == "Polygon") {
        feature.geometry.coordinates = feature.geometry.coordinates.map((line) => {
            return line.map((point) => {
                return point.slice(0, 2);
            });
        });
    }
    // if geometry is a multipoint
    if (feature.geometry.type == "MultiPoint") {
        feature.geometry.coordinates = feature.geometry.coordinates.map((point) => {
            return point.slice(0, 2);
        });
    }
    // if geometry is a multiline
    if (feature.geometry.type == "MultiLineString") {
        feature.geometry.coordinates = feature.geometry.coordinates.map((line) => {
            return line.map((point) => {
                return point.slice(0, 2);
            });
        });
    }
    // if geometry is a multipolygon
    if (feature.geometry.type == "MultiPolygon") {
        feature.geometry.coordinates = feature.geometry.coordinates.map((polygon) => {
            return polygon.map((line) => {
                return line.map((point) => {
                    return point.slice(0, 2);
                });
            });
        });
    }
    // if geometry is a geometrycollection
    if (feature.geometry.type == "GeometryCollection") {
        feature.geometry.geometries = feature.geometry.geometries.map((geometry) => {
            return feature2Dify(geometry);
        });
    }

    // make sure the geometry is now a valid geojson feature
    must(feature && feature.geometry && feature.geometry.type && feature.geometry.coordinates, "geometry must still be a valid geojson feature");
    must(feature.geometry.type == previousFeature.geometry.type, "geometry type must not change");
    
    // deepest array must have 2 elements
    // pick deepest array
    function deepestArray (array) {
        if (Array.isArray(array[0])) {
            return deepestArray(array[0]);
        } else {
            return array;
        }
    }
    const deepest = deepestArray(feature.geometry.coordinates);
    must(deepest.length == 2, "geometry must be 2D");


    return feature;
}

module.exports = {feature2Dify};