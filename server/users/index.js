
// This file is the entry point for the users module. It imports all the necessary files and exports them as a single object.
const users = function(app, parentRoute){
    const authorizeAdmin = require("./js/users.authorize").authorizeAdmin
    const authorizeBasic = require("./js/users.authorize").authorizeBasic
    const {loginUser, registerUser, updateUser, deleteUser, getAllUsers, getUser, createNewUser} = require("./js/users.authenticate");
    const server = require("./js/users.server")(app, parentRoute)
    const User = require("./js/users.model")
    
    return {
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
    
}
// add all imports to export
module.exports = users;

