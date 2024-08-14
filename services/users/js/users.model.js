const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {type:String, default:null, unique:true},
  password: { type: String },
  token: { type: String },
  role: {type: String, default: 'basic'}
});

module.exports = mongoose.model("user", userSchema);
