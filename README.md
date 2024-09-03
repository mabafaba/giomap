# giomap


giomap is a web application that allows users to place markers, lines, and polygons on a map - simultaneously and in real time.
giomap is open source and free to use (MIT License).

## Installation

### Via Docker

*prerequisites*

- [Docker Installed](https://www.docker.com/)
- [Docker Compose Installed](https://docs.docker.com/compose/install/)


If you have node/npm installed:

```
git clone https://github.com/mabafaba/giomap
cd giomap
npm run docker
```

Without node/npm installation:
```
git clone https://github.com/mabafaba/giomap
cd giomap
docker build -t giomap .
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
git clone https://github.com/mabafaba/giomap
cd giomap
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

- free text if no options selected on property field
- edit map data properties

- map creator can predefine different standard map entries

- Popup not working reliably on circle / rectangle
- add user name and id to drawings on upon creation
- add authentification (who can see which maps)


### Simplify Codebase

- get rid of Alpine.js and replace with vanilla JS / jQuery. Frontend frameworks are overrated.
- get rid of ejs templating enginge. Use plain HTML. // see https://dev.to/andreygermanov/modular-html-19o6
- use socket.io only to alert clients of changes. Use REST API for everything else.
