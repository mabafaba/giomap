// // in giomap, the map creator sets 'typologies' when creating a map
// // a typology is a predefined map geometry with a fixed set of properties
// // when a user creates a new feature on the map, they select a typology
// // and then fill in the properties for that typology

// // this file all the client side code directly related to typologies



// class Typology {
//     constructor(name, geometryType, properties) {


//         // make sure name is a string
//         if(typeof name !== 'string'){
//             throw new Error('name must be a string');
//         }

//         // make sure geometryType is a string
//         if(typeof geometryType !== 'string'){
//             throw new Error('geometryType must be a string');
//         }

//         // make sure geometryType is a valid value

//         if(!['Point', 'Line', 'Polygon', 'Circle', 'Rectangle'].includes(geometryType)){
//             throw new Error('geometryType must be one of Point, Line, Polygon, Circle, Rectangle');
//         }

//         // make sure properties is an object
//         if(typeof properties !== 'object'){
//             throw new Error('properties must be an object');
//         }

//         this.name = name;
//         this.geometryType = geometryType;
//         this.properties = properties;
//     }


// }

