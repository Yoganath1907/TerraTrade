const mongoose = require('mongoose');

function initialiseDb() {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://yoganath:yoganathmongo@clusterterratrade.hzek6ae.mongodb.net/test";
    mongoose.connect(mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));
}

// Produce schema
const produceSchema = new mongoose.Schema({
    farmerName: String,
    produceName: String,
    contactNumber: String,
    grade: String,
    harvestDate: String,
    quantity: String,
    fairPrice: Number,
    qr: String
});

// Updated Purchase schema
const purchaseSchema = new mongoose.Schema({
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    produceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'produce',
        required: true 
    },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['initiated', '80%Released', 'completed', 'disputed'],
        default: 'initiated'
    },
    purchaseHash: { type: String, required: true, unique: true },
    verificationToken: { type: String, required: true },
    completedAt: Date
}, { timestamps: true });

const produceModel = mongoose.model('produce', produceSchema);
const purchaseModel = mongoose.model('purchase', purchaseSchema);

module.exports = { initialiseDb, produceModel, purchaseModel };