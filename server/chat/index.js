express = require('express');
const path = require('path');
const Message = require('./js/chatmessage.model');
const User = require('../users/js/users.model');
var router = express.Router();

// import user authentication
const {authorizeBasic, authorizeAdmin} = require('../users/js/users.authorize');

router.get('/', function(req, res, next) {
    res.render('chat');
    }
);
// route to get chat messages

router.get('/messages', async function(req, res, next) {
    const messages = await Message.find();
    res.send(messages);
});

// route to get chat messages for a specific chatroom
router.get('/messages/:room', async function(req, res, next) {
    const messages = await Message.find({chatroom: req.params.room});
    res.send(messages);
});

// serve all static files in all folders (everything in ./static will be served)
router.use('/static', express.static(path.join(__dirname, './static')));





const server = function(app, io, parentRoute = ''){
    console.log('chat server started');
    // log in fat green letters
    console.log('\x1b[32m%s\x1b[0m', 'Chat server started!');

    app.set("view engine", "ejs");
    let views = app.get('views');
    if (!Array.isArray(views)) views = [views];
    views.push(path.join(__dirname, './views'));
    app.set('views', views);
    
    app.use(express.json());


    // Routes
    app.use('/chat', router);

    // static paths
    // app.use('/chat/js', express.static(path.join(__dirname, './client/js')));
    // app.use('/chat/graphics', express.static(path.join(__dirname, './client/graphics')));

    // io chat messages

    io.on('connection', (socket) => {
        socket.on('disconnect', () => {
        });
        socket.on('chat message', (msg) => {
            console.log('message: ' + msg);
            // store message in database
            const mongoose = require('mongoose');

// const chatMessageSchema = new mongoose.Schema({
//     text: {
//         type: String,
//         required: true
//     },
//     time: {
//         type: Date,
//         default: Date.now
//     },
//     user: {
//         type: String,
//         required: true
//     },
//     chatroom: {
//         type: String,
//         required: true
//     },
//     isBot: {
//         type: Boolean,
//         default: false
//     }
// });
// assert msg object is valid (consider isbot is boolean)

            if (!msg.content || !msg.username || typeof msg.isBot !== 'boolean') {
                console.error('Invalid message object', msg);
                return;
            }



            if(!msg.room){
                msg.room = 'none';
            }


            const message = new Message({
                text: msg.content,
                user: msg.username,
                chatroom: msg.room,
                isBot: msg.isBot,
            });

            // save message to database
            message.save()
                .then((message) => {
                    console.log('message saved', message);
                                // broadcast message to all connected clients except the one who sent the message
                    socket.broadcast.emit('chat message', msg);

                })
                .catch((err) => {
                    console.error('message save error', err);
                });
            
            
        });

        socket.on('connect', () => {
            // get user id from socket
            userid = socket.request.session.userid;
            console.log('new user connected' + userid);
        }   );

    });
    

}

module.exports = {server};
