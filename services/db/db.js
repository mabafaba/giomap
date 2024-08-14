const mongoose = require('mongoose')
mongoose.set("strictQuery", false);
// automatically pick url depending on whether in docker or not
const isDocker = process.env.DOCKER === 'true';
const url = isDocker ? 'mongodb://giomap-mongodb:27017/giomap' : 'mongodb://localhost:27017/giomap';

console.log('mongodb url:', url);
main().catch((err) => {console.log('MONGODB ERROR!', err)});

async function main() {
  await mongoose.connect(url);
}

module.exports = mongoose