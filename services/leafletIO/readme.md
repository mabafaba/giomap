# leafletIO

Keeps leaflet maps in sync between users.
This is a back- and front-end service that allows users to share a map and see each other's changes in real-time, including database to store the map data.


## Adding the leafletIO service to your app 


**server side code:**
```javascript 

LeafletIO = require('./services/leafletIO');
app = express();
leafletIO = new LeafletIO(app, '/myLeafletIO');
```
leafletIO  accepts as parameters:

- `app` - the express app
- `route` - the endpoint where you want the service to be available
- `beforeGetRequest` - a next.js middleware function that is called before the get request is processed
- `beforeContributorAction` and `beforeHostAction` - what to do before passing on contributor actions such as adding or deleting features from a map, or host actions such as changing everyone's map view. should be (socket, json) => json, or return false to prevent the action from being processed. This is useful for example for user authentication.
 
**client side code:**

```html
<script src="/myLeafletIO/leafletIOclient.js"></script>
// leflet
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

create map
```html
<div id="map" style="height: 100vh;"></div>

<script>
    // create a new leafletIO object
    const map = L.map('map')

    leafletIOclient(map,
             'unique_identifier_for_this_shared_map',
             '/where/app/runs/myLeafletIO'
             );
</script>

```

## Server Endpoints


The server side script adds the following endpoints to the express app:

**GET /data/:room**

Retrieves raw data for a specific room.

- `room` - The room identifier.

Returns:
- The raw data for the specified room.


**GET /geojson/room**

Retrieves GeoJSON data for a specific room.

- `room` - The room identifier.

Returns:
- The GeoJSON data for the specified room.


**GET /leafletIOclient.js**

Retrieves the Leaflet IO client script.

Returns:
- The Leaflet IO client script.



## Client Side API


`myLeafletIO = leafletIOclient(...)` just needs to be run and all should be connected.

However to customise,  here's some useful functions of the returned object:

```javascript
myLeafletIO.on('newFeature', (feature) => {
    // do something when any features are added to the map, for example add popups.
});

myLeafletIO.enableEditing();
myLeafletIO.disableEditing();

// functions to run on leaflet features
myLeafletIO.setLayerForEveryone(someLayer);


myLeafletIO.deleteLayerFromServer(someFeature);

myLeafletIO.flyToFeature(someFeature);
myLeafletIO.highlightFeature(someFeature);
myLeafletIO.unhighlightFeature(someFeature);
myLeafletIO.bringEveryoneToMyView(someLayer);

myLeafletIO.highighlightLayerForEveryone(someLayer);

```