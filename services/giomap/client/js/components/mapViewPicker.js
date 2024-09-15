mapViewPicker = function(parentID){

var map = L.map('leafletMap').setView([13.121387978520586, 14.419215391995849], 2);
// add osm layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a>'
}).addTo(map);

return map;

}

