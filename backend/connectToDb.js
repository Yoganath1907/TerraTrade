const mongoose = require('mongoose');

function initialiseDb(){
    mongoose.connect("mongodb+srv://yoganath:yoganathmongo@clusterterratrade.hzek6ae.mongodb.net/test")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));
}

const produceSchema = new mongoose.Schema({
  farmerName: String,
  produceName: String,
  contactNumber: String,
  grade: String,
  harvestDate: String,
  quantity: String,
  fairPrice: Number
});


const produceModel = mongoose.model('produce', produceSchema);
module.exports = {initialiseDb, produceModel};

