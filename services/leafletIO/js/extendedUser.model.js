// mongoose model the a giomap user, which contains just a regular User model,
//  and a drawingColor string.
// All basic user stuff is put away into the user service.

const mongoose = require("mongoose");
const User = require("../users/js/users.model");

;

const giomapUserSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    drawingColor: {type: String, default: randomColor}
});

module.exports = mongoose.model("giomapUser", giomapUserSchema);