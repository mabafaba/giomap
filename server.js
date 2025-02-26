const path = require("path");
const http = require("http");
const express = require("express");
const mongoose = require("./services/db/db")
const userService = require("./services/users");
const giomapService = require("./services/giomap");


// initialize express/sockets
const app = express();
const server = http.createServer(app);
// io on path /giomap-socket-io
const io = require("socket.io")(server, {
  path: "/giomap-socket-io",
  maxHttpBufferSize: 25 * 1024 * 1024 // 25 MB
});
app.use(express.json())

// mout services
app.use("/giomap/", giomapService(io));
app.use('/giomap/user/',userService.app);


// DONT USE IN PRODUCTION: debug routes (ALLOWS TO SEE AND DELETE ALL DATA VIA SIMPLE ENDPOINTS)
// const debug = require("./services/debug.db.routes")(app);

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
