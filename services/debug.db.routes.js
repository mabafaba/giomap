// This file contains the routes for debugging and manipulating the database.
// It includes routes for dropping users, retrieving all users, and dropping giomap entries.
// Should never be included in production!

const {mapdrawing} = require("./giomap")
const {MapCanvas} = require("./giomap")


// log a bright red warning to the console that vulnerable routes are active
console.log('\x1b[31m%s\x1b[0m', 'WARNING: VULNERABLE DEBUG ROUTES ACTIVE! - ANYONE CAN DELETE THE DATABASES!');
// in yellow, how to remove these routes
console.log('\x1b[33m%s\x1b[0m', 'Remove server/debug.db.routes from server.js before hosting production.');

module.exports = function(app){
    app.get('/debug/delte/users', function(req, res){
        db.User.collection.drop();
        res.send("users dropped!")
    });
    
    
    
    // get all users from db
    app.get('/debug/users', async function(req, res){
        const users = await User.find();
        res.send(users);
    });
    
    // delete all giomap entries
    app.get('/debug/delete/maps', async function(req, res){
        await mapdrawing.collection.drop();
        await MapCanvas.collection.drop();
        res.send("giomap entries dropped!")
    });



    // delete specific map
    app.get('/debug/delete/map/:id', async function(req, res){
        await mapdrawing.findByIdAndDelete(req.params.id);
        res.send("giomap entry dropped!")
    });
    
    
}


