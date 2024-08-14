const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    user: {
        type: String,
        required: true
    },
    chatroom: {
        type: String,
        required: true
    },
    isBot: {
        type: Boolean,
        default: false
    }
});

const Message = mongoose.model('Message', chatMessageSchema);

module.exports = Message;