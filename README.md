# Drawmap

## Description


<h2>Realtime Collaborative Mapping</h2>
<p> DrawMap is a web application that allows users to place markers, lines, and polygons on a map - simultaneously and in real time. 
</p>
    <!-- link to source code -->
<p>
DrawMap is open source and free to use. The <a href="https://github.com/mabafaba/mapdraw">source code</a> is available on GitHub."
</p>
<!-- based on leaflet, socket.io, node, express, alpine.js, sakura.css -->

Built with <a href="https://leafletjs.com/">Leaflet</a>, <a href="https://socket.io/">Socket.io</a>, <a href="https://nodejs.org/en/">Node.js</a>, <a href="https://expressjs.com/">Express</a>, <a href="https://alpinejs.dev/">Alpine.js</a>, 
and <a href="https://github.com/oxalorg/sakura">sakura.css</a>.


[AGAIN DESCRIPTION BUT AS MARKDOWN]

DrawMap is a web application that allows users to place markers, lines, and polygons on a map - simultaneously and in real time.
DrawMap is open source and free to use (MIT License).


## Prerequisites

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [MongoDB](https://www.mongodb.com/)

## Installation

### Install MongoDB

See [MongoDB installation instructions](https://docs.mongodb.com/manual/installation/).

### Install node app
```
git clone https://github.com/mabafaba/mapdraw
cd drawmap
npm install
```

### Set environment variables

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
```
npm install
npm run dev
```

App runs at localhost:3000

# Stack

- Server: [Node.js](https://nodejs.org/en/), [Express](https://expressjs.com/), [Socket.io](https://socket.io/)
- Client state management: [Alpine.js](https://alpinejs.dev/)
- Map: [Leaflet](https://leafletjs.com/)
- Styling: [sakura.css](https://github.com/oxalorg/sakura)


# Get involved

## Contributing

Best way to start is to open an issue to discuss the feature you would like to add / change!

## TO DO

- Popup not working reliably on circle / rectangle
- add user name and id to drawings on upon creation
- add authentification (who can see which maps)