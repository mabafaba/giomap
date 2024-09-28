const user = require("../../users");
const {authorizeToken, authorizeBasic} = user;
const MapCanvas = require("./mapcanvas.model");

const authorizeAndRedirect = [authorizeBasic, (req, res, next) => {
      if (req.body.authorized) {
        next();
    } else {
        res.redirect('/giomap/user/login');
    }
  }]
  
  
  
const socketVerifyUser = async function (socket, json) {
    // get JWT from cookie
    const token = socket.request.cookies.jwt;
    // if no token, return
    if (!token) {
      socket.emit('notAuthorized', {success: false, message: "Not authorized, token not available"});
      return false;
    }
    // verify JWT
    const verified = await authorizeToken(token, ["admin", "basic"]);
    
    // if not verified, send error message to user
    if (!verified.success) {
      socket.emit('notAuthorized', verified);
      return false;
    }

    // replace user data in json with verified user info
    // this also makes sure user name changes if an item is edited
    if (json.layer && json.layer.properties) {
        json.layer.properties.username = verified.user.username;
    }
    json.user = {
      id: verified.user.id,
      username: verified.user.username
    }
    
    return json;
  }
  
  
  const socketVerifyUserIsMapOwner = async function(socket, json) {
    // is user logged in?
    const verifiedJson = await socketVerifyUser(socket, json);
    if (!verifiedJson) {
      return false;
    }
    console.log(verifiedJson);
    // is user the map canvas owner?
    const mapcanvas = await MapCanvas.findOne({shareLinkId: json.mapRoom});
    if (mapcanvas.createdBy != verifiedJson.user.id) {
      return false;
    }

    return json;
  
  }

module.exports = {
    authorizeAndRedirect,
    socketVerifyUser,
    socketVerifyUserIsMapOwner

}
