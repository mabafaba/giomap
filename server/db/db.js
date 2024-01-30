const mongoose = require('mongoose')
mongoose.set("strictQuery", false);
// automatically pick url depending on whether in docker or not
const isDocker = process.env.DOCKER === 'true';
console.log("PROCESS ENV:", process.env);
const url = isDocker ? 'mongodb://mapdraw-mongodb:27017/Drawmap' : 'mongodb://localhost:27017/Drawmap';

console.log('mongodb url:', url);
main().catch((err) => {console.log('MONGODB ERROR!', err)});

async function main() {
  await mongoose.connect(url);
}

module.exports = mongoose