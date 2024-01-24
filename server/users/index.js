
// import users.server as server - here comes code:
// import all other js files here so that they can be imported from a single file
// rquire all other js files here so that they can be imported from a single file



const authorizeAdmin = require("./js/users.authorize").authorizeAdmin
const authorizeBasic = require("./js/users.authorize").authorizeBasic
const {loginUser, registerUser, updateUser, deleteUser, getAllUsers, getUser, createNewUser} = require("./js/users.authenticate");
const server = require("./js/users.server")
const User = require("./js/users.model")


// add all imports to export
module.exports = {
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

