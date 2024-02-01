const express = require('express');
// crypto
const crypto = require('crypto');
const router = express.Router();
const MapCanvas = require('./mapcanvas.model');
const MapDrawing = require('./mapdrawing.model');


    const { authorizeBasic } = require('../../users/js/users.authorize')

    authorizeAndRedirect = [authorizeBasic, (req, res, next) => {
        if (req.body.authorized) {
            console.log('authorized');
            next();
        } else {
            res.redirect('./user/login');
        }
    }];

    
    router.route('/geojson')
    .get(authorizeAndRedirect, async (req, res) => {
        const drawMapEntries = await MapDrawing.find();
        res.send(drawMapEntries);
    });
    
    
    router.route('/geojson/:shareLinkId')
    .get(authorizeAndRedirect, async (req, res) => {
        // find corresponding mapcanvas
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }
            return mapCanvas;
        })
        .then((mapCanvas) => {
            return mapCanvas.populate('mapdrawings')
        })
        .then(async (mapCanvas) => {
            // populate user details for all mapdrawings
            // only keep user id and username
            mapCanvas.mapdrawings = await MapDrawing.populate(mapCanvas.mapdrawings, { path: 'createdBy', select: 'i_d username' });
            // copy user data to properties
            mapCanvas.mapdrawings.forEach((mapdrawing) => {
                mapdrawing.feature.properties.createdBy = mapdrawing.createdBy;
            });
            return mapCanvas;
            
        })
        .then((mapCanvas) => {
            res.send(mapCanvas.mapdrawings);
        })
        .catch((err) => {
            console.log('Could not get GeoJSON', err);
        });
    }
    );
    
    router.route( '/list/json')
    .get(authorizeAndRedirect, async (req, res) => {
        var allMaps = await MapCanvas.find();
        // populate user details for all maps
        // only keep user id and username
        allMaps = await MapCanvas.populate(allMaps, { path: 'createdBy', select: 'i_d username' });
        allMapsJson = allMaps.map((map) => {
            mapObj = map.toObject();
            console.log('mapObj', mapObj);
            console.log('req.body.user.id', req.body.user.id);
            if (mapObj.createdBy._id == req.body.user.id) {
                mapObj.userIsCreator = true;
            } else {
                mapObj.userIsCreator = false;
            }
            return mapObj;
        })
        res.send(allMapsJson);
    });
    
    router.route('/list')
    .get(authorizeAndRedirect, (req, res) => {
        res.render('listmaps');
    });
    
    router.route('/create')
    .post(authorizeAndRedirect, async (req, res) => {
        req.body.shareLinkId = crypto.randomBytes(20).toString('hex');
        MapCanvas.create({
            name: req.body.name,
            description: req.body.description,
            createdBy: req.body.user.id,
            leafletView: req.body.leafletView,
            drawmapModels: [],
            shareLinkId: req.body.shareLinkId
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
    
    
    // 
    router.route('/shared/:shareLinkId')
    .get(authorizeAndRedirect, async (req, res, next) => {
        // not standard id, we're using shareLinkId instead (unguessable link)
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }
            res.render('drawmap', { mapCanvas });
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
    
    
    router.route('/mapdetails/:shareLinkId')
    .get(authorizeAndRedirect, async (req, res, next) => {
        // not standard id, we're using shareLinkId instead (unguessable link)
        MapCanvas.findOne({ shareLinkId: req.params.shareLinkId })
        .then((mapCanvas) => {
            // if not found, dont handle this request
            if (!mapCanvas) {
                res.status(404).send('This map does not exist!');
            }
            res.status(200).send(mapCanvas);
        })
    });
    
    
    
    
    
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
    


module.exports = router;
