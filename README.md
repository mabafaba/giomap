# Drawmap


DrawMap is a web application that allows users to place markers, lines, and polygons on a map - simultaneously and in real time.
DrawMap is open source and free to use (MIT License).

## Installation

### Via Docker

*prerequisites*

- [Docker Installed](https://www.docker.com/)
- [Docker Compose Installed](https://docs.docker.com/compose/install/)


If you have node/npm installed:

```
git clone https://github.com/mabafaba/mapdraw
cd drawmap
npm run docker
```

Without node/npm installation:
```
git clone https://github.com/mabafaba/mapdraw
cd drawmap
docker build -t drawmap .
docker-compose up
browser http://localhost:3000
```


### Manually

*Prerequisites*

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [MongoDB](https://www.mongodb.com/)

### Install MongoDB

See [MongoDB installation instructions](https://docs.mongodb.com/manual/installation/).

### Install node app
```
git clone https://github.com/mabafaba/mapdraw
cd drawmap
npm install
```


### Set environment variables

Generate a secret key for JWT authentication. Run the following command in the terminal:

```
node -e "console.log(require('crypto').randomBytes(256).toString('base64'));"
```

Create a file named `.env` in the root directory of the project with the following content:
```
JWT_SECRET=secret
```
Where `secret` is the secret key generated in the previous step.


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

## NGINX configuration

```
location /drawmap {
        proxy_pass http://localhost:3000/drawmap;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
}

location /drawmap-socket-io {
        proxy_pass http://localhost:3000/drawmap-socket-io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
}


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

## TO DO

- Popup not working reliably on circle / rectangle
- add user name and id to drawings on upon creation
- add authentification (who can see which maps)