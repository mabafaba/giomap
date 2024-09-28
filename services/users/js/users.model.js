const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {type:String, default:null, unique:true},
  password: { type: String },
  token: { type: String },
  role: [{type: String, default: 'basic'}],
  // here you can store any other data you want.
  // probably best to keep it simple and flat.
  // or include other mongoose models
  data: { type: Object, default: {} }
  }, 
  { strict: false });  

module.exports = mongoose.model("user", userSchema);
