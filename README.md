# giomap


giomap is a web application that allows users to place markers, lines, and polygons on a map - simultaneously and in real time.
giomap is open source and free to use (MIT License).

## Installation

### Via Docker

*prerequisites*

- [Docker Installed](https://www.docker.com/)
- [Docker Compose Installed](https://docs.docker.com/compose/install/)


### If you have node/npm installed:

```
git clone https://github.com/mabafaba/giomap
cd giomap
```

generate a secret key for JWT authentication. Run the following command in the terminal:

```
sh generate_secret_JWT.sh
```

build and run the docker container:

```
npm run docker
```

open in browser: http://localhost:3000


### Without node/npm installation:
```
git clone https://github.com/mabafaba/giomap
cd giomap
sh generate_secret_JWT.sh
docker build -t giomap .
docker-compose up
browser http://localhost:3000
```


### Installation without Docker 

*Prerequisites*

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [MongoDB](https://www.mongodb.com/)

### Install MongoDB

See [MongoDB installation instructions](https://docs.mongodb.com/manual/installation/).

### Install node app
```
git clone https://github.com/mabafaba/giomap
cd giomap
npm install

```

### Set environment variables

by running the bash script

```
sh generate_secret_JWT.sh

```
## Usage
For production:

```
npm install
npm run start
```

For development:
```
npm install
npm run dev
```

App runs at localhost:3000 by default.


## Reverse Proxy Configuration

You need to configure a reverse proxy to route requests to the giomap server.
Including one for the socket.io connection.
Example with NGINX below.

## NGINX configuration

```
location /giomap {
        proxy_pass http://localhost:3000/giomap;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
}

location /giomap-socket-io {
        proxy_pass http://localhost:3000/giomap-socket-io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
}


```

after changing nginx config, test the configuration and reload nginx:

```
# test configuration
sudo nginx -t
# if all is well, reload nginx
sudo systemctl reload nginx
```

# Stack

- Server: [Node.js](https://nodejs.org/en/), [Express](https://expressjs.com/), [Socket.io](https://socket.io/)
- Client state management: [Alpine.js](https://alpinejs.dev/)
- Map: [Leaflet](https://leafletjs.com/)
- Styling: [sakura.css](https://github.com/oxalorg/sakura)


# Get involved

## Contributing

Best way to start is to open an issue to discuss the feature you would like to add / change!
Feel free to contact me directly.


## Architecture



The whole application is divided into services. Each service is responsible for a specific part of the application.


### Dependency Hierarchy

- server.js
        - giomap service
                - leafletIO service
                - user service 

### Services

- user: handles user authentication and authorization
- giomap: handles map creation, editing, and viewing
- leafletIO: handles real-time communication between clients and the server. For now, this is under the giomap service, but it should be a separate service or npm package eventually.

Each service handles its own back and frontend including routes, views, and database, and client-side logic.
That way, each service is independent and can be developed and tested separately, and be reused in other projects.

Service folder structure is:

```
services / serviceName // service folder

services / serviceName / index.js // exports service as a module

services / serviceName / client / // static client side logic & assets

services / serviceName / js / serviceName.server.js // server logic
services / serviceName / js / serviceName.modelName.model.js // database model
services / serviceName / js / serviceName.routes.js // routes

services / serviceName / views / // views

```


### Flow

Overall Entry point is `server.js`.
It loads all services that are activitated by calling service(app, ...).
That 'activates' the full stack of each service, including routes, views, and database.


The giomap service

- backend models to store maps ('mapCanvas') and map features ('mapdrawing')
- routes to handle map creation, editing, and viewing


The leafletIO service (part of giomap for now)

- communicates map edits in real-time between clients and the server






ser



## TO DO
- add authentification (who can see which maps)
- move cleanSharelinkID from leafletIO service to giomap service

### Simplify Codebase

- get rid of Alpine.js and replace with vanilla JS / jQuery. Frontend frameworks are overrated.
- get rid of ejs templating enginge. Use plain HTML. // see https://dev.to/andreygermanov/modular-html-19o6
- use socket.io only to alert clients of changes. Use REST API for everything else.

### Refactoring
- leafletIO as fully independent service, standard structure as in user & giomap module
- should independent services get their own repo? C
- handle inconsistent typologies on the same map
- map details editing to include typologies
- move js in giomap.ejs to appropriate files (leafletIO.js, giomap.js, another?)
- leafletIO and mapio name consistency
- leafletIO to accept IO as input (client side)
- more clarity regarding what depends on / contains what (i.e. having a reference to the global map object in giomap.io.map is confusing). 

- files that are too large and should be split up into components:
        - giomap.ejs
        - createmap.ejs


## version history

prototype 2 

- user defined map features
- action buttons for typologies
- select basemaps
- base map langauge
- workshop host panel: focus on feature
- workshop host panel: share map view
- add user name and id to drawings on upon creation