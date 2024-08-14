// leaflet graticule plugin
// from https://github.com/turban/Leaflet.Graticule/blob/master/L.Graticule.js
// added some functionality to adjust to zoom level:





/*
Graticule plugin for Leaflet powered maps.
*/
L.Graticule = L.GeoJSON.extend({
    
    options: {
        style: {
            color: '#333',
            weight: 1
        },
        interval: 20
    },
    
    initialize: function (options, map) {
        L.Util.setOptions(this, options);
        this._layers = {};
        
        if (this.options.sphere) {
            this.addData(this._getFrame());
        } else {
            this.addData(this._getGraticule(map));
        }
    },
    
    _getFrame: function() {
        return { "type": "Polygon",
        "coordinates": [
            this._getMeridian(-180).concat(this._getMeridian(180).reverse())
        ]
    };
},

_getGraticule: function (map) {
    var features = [], interval = this.options.interval;
    
    
    // find regular gridline coordinates within visible map bounds 
    var latLngBounds = map.getBounds();
    leftLng = latLngBounds.getWest();
    rightLng = latLngBounds.getEast();
    topLat = latLngBounds.getNorth();
    bottomLat = latLngBounds.getSouth();

    // find closet multiple of interval to leftLng
    startLng = Math.floor(leftLng / interval) * interval;
    // find closet multiple of interval to rightLng
    endLng = Math.ceil(rightLng / interval) * interval;
    // find closet multiple of interval to bottomLat
    startLat =Math.floor(bottomLat / interval) * interval;
    // find closet multiple of interval to topLat
    endLat = Math.ceil(topLat / interval) * interval;

    for (var lng = startLng; lng <= endLng; lng = lng + interval) {
        // if lng is not in visible bounds, skip
        if (lng < latLngBounds.getWest() || lng > latLngBounds.getEast()){
            continue;
        }
        features.push(this._getFeature(this._getMeridian(lng), {
            "name": (lng) ? lng.toString() + "° E" : "Prime meridian"
        }));
        if (lng !== 0) {
            features.push(this._getFeature(this._getMeridian(-lng), {
                "name": lng.toString() + "° W"
            }));
        }
    }

    for (var lat = startLat; lat <= endLat; lat = lat + interval) {
        features.push(this._getFeature(this._getParallel(lat), {
            "name": (lat) ? lat.toString() + "° N" : "Equator"
        }));
        if (lat !== 0) {
            features.push(this._getFeature(this._getParallel(-lat), {
                "name": lat.toString() + "° S"
            }));
        }
    }
    
    return {
        "type": "FeatureCollection",
        "features": features
    };
},

_getMeridian: function (lng) {
    lng = this._lngFix(lng);
    var coords = [];
    for (var lat = -90; lat <= 90; lat++) {
        coords.push([lng, lat]);
    }
    return coords;
},

_getParallel: function (lat) {
    var coords = [];
    for (var lng = -180; lng <= 180; lng++) {
        coords.push([this._lngFix(lng), lat]);
    }
    return coords;
},

_getFeature: function (coords, prop) {
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coords
        },
        "properties": prop
    };
    // feature to identify as graticule
    feature.properties.graticule = true;
    return feature;
},

_lngFix: function (lng) {
    if (lng >= 180) return 179.999999;
    if (lng <= -180) return -179.999999;
    return lng;
}

});

L.graticule = function (options, map) {
    return new L.Graticule(options, map);
};


removeGatriculeLayers = function(map){
    // remove graticule layers
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties && layer.feature.properties.graticule){
            map.removeLayer(layer);
        }
    });
}

function zoomLimitedGraticule(map, interval, minZoom=5){
    graticuleOptions = {
        interval: interval,
        style: {
            color: '#333',
            weight: 1
        }
    };
    
    zoomGridToggle = function () {
        if (map.getZoom() <= minZoom){
            removeGatriculeLayers(map);
        } else {
            // updateOpacity();
            graticule = L.graticule(graticuleOptions, map);
            graticule.addTo(map);
        }
    }
    let graticule = {
        isOn: false,
        minZoom: minZoom,
        on: function(){
            zoomGridToggle();
            map.on('zoomend', zoomGridToggle);
            map.on('moveend', zoomGridToggle);
            this.isOn = true;
        },
        off: function(){
            removeGatriculeLayers(map);
            map.off('zoomend', zoomGridToggle);
            map.off('moveend', zoomGridToggle);
            this.isOn = false;
        }
    }

    return graticule;
}