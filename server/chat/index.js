express = require('express');
const path = require('path');

var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('chat');
    }
);

const server = function(app, io){

    app.set("view engine", "ejs");
    let views = app.get('views');
    if (!Array.isArray(views)) views = [views];
    views.push(path.join(__dirname, './views'));
    app.set('views', views);
    
    app.use(express.json());


    // Routes
    app.use('/chat', router);

    // static paths
    app.use('/chat/js', express.static(path.join(__dirname, './client/js')));

    // io chat messages

    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
        socket.on('chat message', (msg) => {
            console.log('message: ' + msg);
            // broadcast message to all connected clients except the one who sent the message
            socket.broadcast.emit('chat message', msg);
        });
    });
    

}

module.exports = {server};
