function LayerToGeoJson(layer) {
    const json = layer.toGeoJSON();
    
    if (layer instanceof L.Circle) {
        json.properties.radius = layer.getRadius();
    }
    else if (layer instanceof L.CircleMarker) {
        json.properties.markerType = 'circle';
    }
    
    return json;
}

function GeoJsonToLayer(data) {
    const layers = [];
    console.log('converting to layer',data);
    
    L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
            // handle circles
            if (feature.properties && feature.properties.radius) {
                return new L.Circle(latlng, feature.properties.radius);
            }
            // handle circlemarkers
            else if (feature.properties && feature.properties.markerType === 'circle') {
                return new L.CircleMarker(latlng);
            }
            else {
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