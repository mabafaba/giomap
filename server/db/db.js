const mongoose = require('mongoose')
mongoose.set("strictQuery", false);
const url = "mongodb://localhost:27017/Drawmap";
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(url);
}

module.exports = mongoose