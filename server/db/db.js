const mongoose = require('mongoose')
mongoose.set("strictQuery", false);
const url = "mongodb://mapdraw-mongodb:27017/Drawmap"
console.log('mongodb url:', url);
main().catch((err) => {console.log('MONGODB ERROR!', err)});

async function main() {
  await mongoose.connect(url);
}

module.exports = mongoose