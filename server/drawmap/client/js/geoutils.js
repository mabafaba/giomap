function LayerToGeoJson(layer) {
    const json = layer.toGeoJSON();
    
    if (layer instanceof L.Circle) {
        json.properties.radius = layer.getRadius();
    }
    
    return json;
}

function GeoJsonToLayer(data) {
    const layers = [];
    console.log('converting to layer',data);
    
    L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
            if (feature.properties && feature.properties.radius) {
                return new L.Circle(latlng, feature.properties.radius);
            } else {
                return new L.Marker(latlng);
            }
        },
        onEachFeature: (feature, layer) => {
            layers.push(layer);
        },
    });
    console.log("layers created from geojson",layers);
    return layers;
};