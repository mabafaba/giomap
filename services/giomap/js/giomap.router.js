const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const MapCanvas = require('./mapcanvas.model');
const LeafletIOFeature = require('../../leafletIO/js/leafletIOFeature.model');
const User = require('../../users/js/users.model');

    const { authorizeBasic } = require('../../users/js/users.authorize')

    authorizeAndRedirect = [authorizeBasic, (req, res, next) => {
        if (req.body.authorized) {
            next();
        } else {
            res.redirect('/giomap/user/login');
        }
    }];

    
    router.route('/list')
    .get(authorizeAndRedirect, (req, res) => {
        res.render('listmaps');
    });

    
    router.route( '/list/json')
    .get(authorizeAndRedirect, async (req, res) => {
        var allMaps = await MapCanvas.find();
        // populate user details for all maps
        // only keep user id and username
        allMaps = await MapCanvas.populate(allMaps, { path: 'createdBy', select: 'i_d username role' });
        allMapsJson = allMaps.map((map) => {
            mapObj = map.toObject();
            // add boolean - is user creator?
            if (mapObj.createdBy && mapObj.createdBy._id == req.body.user.id) {
            mapObj.userIsCreator = true;
            } else {
            mapObj.userIsCreator = false;
            }
            return mapObj;
        })
        res.send(allMapsJson);
    });

      
    router.route('/list/json/:shareLinkId')
    .get(authorizeAndRedirect, async (req, res, next) => {
        // not standard id, we're using shareLinkId instead (unguessable link)
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        // fill in createdBy details // username, _id, role
        .populate('createdBy', 'username _id role')
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }

            res.status(200).send(mapCanvas);
        })
    });
    
    
    router.route('/create')
    .post(authorizeAndRedirect, async (req, res) => {
        req.body.shareLinkId = crypto.randomBytes(20).toString('hex');
        MapCanvas.create({
            name: req.body.name,
            description: req.body.description,
            createdBy: req.body.user.id,
            leafletView: req.body.leafletView,
            shareLinkId: req.body.shareLinkId,
            typologies: req.body.typologies,
            backgroundMaps: req.body.backgroundMaps,
            preferredMapLanguage: req.body.preferredMapLanguage
        })
        .then((mapCanvas) => {
            return mapCanvas.save();
        })
        .then((mapCanvas) => {
            res.status(200).send(mapCanvas);
        })
        .catch((err) => {
            console.log('Could not create map canvas', err);
            res.status(500).send(err);
        });
        
        
    });
    
    // 
    

    router.route('/shared/:shareLinkId')
    .get(authorizeAndRedirect, async (req, res, next) => {
        // not standard id, we're using shareLinkId instead (unguessable link)
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        // populate user details
        .populate('createdBy', 'username')
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }
            res.render('giomap', { mapCanvas });
        })
    });
    
    
    // edit map details - GET / VIEW
    router.route('/edit/:shareLinkId')
    .get(authorizeAndRedirect, async (req, res, next) => {
        // not standard id, we're using shareLinkId instead (unguessable link)
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }
            res.render('editmapcanvas', { mapCanvas });
        })
    });
    
    // edit map details - POST
    router.route('/update/:shareLinkId')
    .post(authorizeAndRedirect, async (req, res, next) => {
        // not standard id, we're using shareLinkId instead (unguessable link)
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }
            mapCanvas.name = req.body.name;
            mapCanvas.description = req.body.description;
            mapCanvas.leafletView = req.body.leafletView;
            return mapCanvas.save();
        })
        .then((mapCanvas) => {
            res.status(200).send(mapCanvas);
        })
    });
    
    // delete map
    router.route('/delete/:shareLinkId')
    .delete(authorizeAndRedirect, async (req, res, next) => {

        // find map, check if user is creator
        // if not, return 401
        LeafletIOFeature.deleteMany({ mapRoom: req.params.shareLinkId })
        
        mapcanvas = await MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        
        
        // if no user id, return 401
        if(!req.body.user.id){
            res.status(401).json({message: 'Not authorized'});
            return;
        }

        if(mapcanvas.createdBy!=req.body.user.id){

            res.status(401).json({message: 'Only the creator of this map can delete it'});
            return;
        }
        // not standard id, we're using shareLinkId instead (unguessable link)


        MapCanvas.findOneAndDelete({ shareLinkId: req.params.shareLinkId })
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).json({message: 'The map does not exist!'});
            }
            
        })
        .then((mapCanvas) => {
            res.status(200).json({message: 'The map was deleted!'});
        })
    }
    );
    
  
    
    
    
    
    
    router.route('/create')
    .get(authorizeAndRedirect, (req, res) => {
        res.render('createmap');
    });
    
    router.route('/')
    .get(authorizeAndRedirect, (req, res) => {
        res.render('listmaps');
    });
    
    
    router.route('/about')
    .get((req, res) => {
        res.render('about');
    });
    


    // special user stuff

    // set user drawing color
    router.route('/drawingColor')
    .post(authorizeAndRedirect, async (req, res) => {
        console.log('setting drawing color');
        console.log(req.body);
        console.log(req.body.drawingColor);
        // find user
        
        User.findById(req.body.user.id)
        .then((user) => {
            user.data = user.data ? user.data : {}; 
            user.data.drawingColor = req.body.drawingColor;
            user.save()
        })    
        .then((user) => {
            res.status(200).send(user);
        })
        .catch((err) => {
            console.log('Could not set drawing color', err);
            res
            .status(500)
            .send(err);
        })
    });

module.exports = router;
