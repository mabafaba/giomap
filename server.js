const path = require("path");
const http = require("http");
const express = require("express");
const mongoose = require("./services/db/db")
const userService = require("./services/users");
const giomapService = require("./services/giomap");


// initialize express/sockets
const app = express();
const server = http.createServer(app);
// io on path /leafletIO-socket-io
const io = require("socket.io")(server, {path: "/leafletIO-socket-io"});
app.use(express.json())

// mout services
app.use("/giomap/", giomapService(io));
app.use('/giomap/user/',userService.app);

const debug = require("./services/debug.db.routes")(app);

// mount public folder
app.use(express.static(path.join(__dirname, "public")));

// redirect root to /giomap/list
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
