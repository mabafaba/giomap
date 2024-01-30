const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("./server/db/db")
const app = express();
app.use(express.json())

// user management
users = require("./server/users")
users.server(app, "/drawmap");

// debugging routes only in devmode
if (process.argv.includes("devmode")){
  require("./server/debug.db.routes")(app)
}


// drawmap 
const server = http.createServer(app);
const io = socketio(server);
require("./server/drawmap/js/drawmap.server")(app, io);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));



// log all existing routes to server cosole
require("./server/utils/logroutes")(app);

// redirect root route to /drawmap/list
app.get("/", (req, res) => {
  res.redirect("/drawmap/list");
});


const PORT = process.env.PORT || 3000;


// when not in dev mode,  dont stop server on error
if (!process.argv.includes("devmode")){
  process.on("unhandledRejection", (err) => {
    console.log(`An fatal error occurred: ${err.message}`);
  });
}


server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); 
