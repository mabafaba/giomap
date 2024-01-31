
// import users.server as server - here comes code:
// import all other js files here so that they can be imported from a single file
// rquire all other js files here so that they can be imported from a single file


const users = function(app, parentRoute){
    const authorizeAdmin = require("./js/users.authorize").authorizeAdmin
    const authorizeBasic = require("./js/users.authorize").authorizeBasic
    const {loginUser, registerUser, updateUser, deleteUser, getAllUsers, getUser, createNewUser} = require("./js/users.authenticate");
    const server = require("./js/users.server")(app, parentRoute)
    const User = require("./js/users.model")
    
    const userIndex = {
        authorizeAdmin, 
        authorizeBasic,
        loginUser,
        registerUser,
        createNewUser,
        updateUser,
        deleteUser,
        getAllUsers,
        getUser,
        server, // server(app) to add routes, settinggs, views, etc to express app
        User // User model
    }
    return userIndex;
    
}
// add all imports to export
module.exports = users;

