const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("./services/db/db")
const app = express();
app.use(express.json())

// user management
users = require("./services/users")(app, "/giomap");
// users.server(app, "/giomap");

// add debugging routes only in devmode
if (process.argv.includes("devmode")){
  require("./services/debug.db.routes")(app)
}


// giomap service 
const server = http.createServer(app);
const io = socketio(server,
  {
    path: '/giomap-socket-io'
  });

require("./services/giomap/js/giomap.server")(app, io);



// Set static folder
app.use(express.static(path.join(__dirname, "public")));



// log all existing routes to server cosole
require("./services/utils/logroutes")(app);

// redirect root route to /giomap/list
app.get("/", (req, res) => {
  res.redirect("/giomap/list");
});


const PORT = process.env.PORT || 3000;


// when not in dev mode,  dont stop server on error
if (!process.argv.includes("devmode")){
  process.on("unhandledRejection", (err) => {
    console.log(`An fatal error occurred: ${err.message}`);
  });
}


server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); 
