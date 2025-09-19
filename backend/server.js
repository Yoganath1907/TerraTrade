const express = require('express');
const { generatePdf } = require("./makePdf");
const path = require("path");
const { addFarmerId, verifyFarmerId } = require('./verifyFarmerOnSui');
const { addProduceId, verifyProduceId } = require('./verifyProduceOnSui');
const {initialiseDb, produceModel, purchaseModel} = require("./connectToDb");
const cors = require("cors");
const multer = require("multer");
const QRCode = require("qrcode");
const crypto = require('crypto');

const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

initialiseDb();

// Existing farmer-related endpoints remain the same...

app.post("/api/generatePdf", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) throw new Error("No file uploaded");

        const formData = req.body;
        formData.photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const privateKey = process.env.SUI_PRIVATE_KEY || '';

        const dataToHash = {
            name: formData.Name,
            state: formData.State
        };

        const rawInput = JSON.stringify(dataToHash) + privateKey;
        const hashedData = crypto.createHash('sha256').update(rawInput).digest('hex');
        console.log("Hashed data:", hashedData);

        const qrImage = await QRCode.toDataURL(hashedData);
        formData.qr = qrImage;

        const pdfBuffer = generatePdf(formData);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'attachment; filename=id.pdf'
        });
        res.send(pdfBuffer);
    } catch (err) {
        console.error("PDF generation error:", err);
        res.status(500).send("Error generating PDF");
    }
});

app.post("/api/add-farmer", upload.single("photo"), async (req, res) => {
    try {
        const formData = req.body;
        const privateKey = process.env.SUI_PRIVATE_KEY || '';

        const dataToHash = {
            name: formData.Name,
            state: formData.State
        };

        const rawInput = JSON.stringify(dataToHash) + privateKey;
        const hashedData = crypto.createHash('sha256').update(rawInput).digest('hex');
        console.log("Adding farmer hash:", hashedData);

        const result = await addFarmerId(hashedData);

        if (result.events.some(event => event.type.includes('FarmerIdAdded'))) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error("Add farmer error:", err);
        res.status(500).send("Error adding farmer");
    }
});

app.post("/api/verify-farmer", async (req, res) => {
    try {
        const { decodedText } = req.body;
        const result = await verifyFarmerId(decodedText);

        if (result.events.some(event => event.type.includes('FarmerIdExists'))) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error("Verify farmer error:", err);
        res.status(500).send("Error verifying farmer");
    }
});




app.post("/api/addToDb", async (req, res) => {
    const { farmerName, produceName, contactNumber, grade, harvestDate, quantity, fairPrice } = req.body;

    try {
        const produceData = { farmerName, produceName, grade, harvestDate };
        const qrImage = await QRCode.toDataURL(JSON.stringify(produceData));

        const produce = new produceModel({
            ...req.body,
            qr: JSON.stringify(produceData)
        });

        await produce.save();

        res.status(201).json({ success: true, qrImage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/api/getAllProduce", async (req, res) => {
    try {
        const produce = await produceModel.find();
        res.json(produce);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATED: Purchase initiation with QR generation
app.post("/api/initiatePurchase", async (req, res) => {
    try {
        
       const { buyerName, buyerPhone, buyerEmail, produceId, totalAmount } = req.body;
        /*buyerName = req.body.buyerName;
        buyerPhone = req.body.buyerPhone;
        buyerEmail = req.body.buyerEmail;
        produceId = req.body.produceId;
        totalAmount = req.body.totalAmount;*/

        // Get produce details
        const produce = await produceModel.findById(produceId);
        if (!produce) {
            return res.status(404).json({ success: false, error: "Produce not found" });
        }

        // Generate unique purchase hash
        const purchaseData = {
            purchaseId: crypto.randomBytes(16).toString('hex'),
            produceId: produceId,
            buyerEmail: buyerEmail,
            timestamp: Date.now()
        };
        
        // Create a secure hash for this purchase
        const purchaseHash = crypto.createHash('sha256')
            .update(JSON.stringify(purchaseData) + process.env.SUI_PRIVATE_KEY)
            .digest('hex');

        
         /*catch (err) {
            console.error("Add Produce error:", err);
            res.status(500).send("Error adding Produce");
            return; // Ensure the function exits after handling the error
        }*/

        
        // Create purchase record
        const purchase = await new purchaseModel({
            buyerName,
            buyerPhone,
            buyerEmail,
            produceId,
            totalAmount,
            paidAmount: totalAmount * 0.8,
            status: "80%Released",
            purchaseHash: purchaseHash,
            verificationToken: purchaseData.purchaseId
        });

        await purchase.save();

        // Generate QR code containing the purchase hash
        const qrCodeData = await QRCode.toDataURL(purchaseHash);
        
        // Convert QR data URL to buffer for download
        const qrBase64 = qrCodeData.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrBase64, 'base64');

        // Create the special verification URL
        const verificationUrl = `${req.protocol}://${req.get('host')}/verifyDelivery.html?token=${purchaseData.purchaseId}&pid=${purchase._id}`;

        console.log(`80% of ₹${purchase.paidAmount} released to farmer for produce ID ${produceId}`);
        try{
            const result = await produceModel.findByIdAndDelete(produceId);
            console.log(result);
        }
        catch(err){console.log(result)}

       
        const result = await addProduceId(purchaseHash);
        if (result.events.some(event => event.type.includes('ProduceIdAdded'))) {
            res.json({ 
            success: true, 
            purchaseId: purchase._id,
            verificationUrl: verificationUrl,
            qrCode: qrCodeData, // Send as base64 for download
            purchaseHash: purchaseHash,
            amountReleased: purchase.paidAmount,
            remainingAmount: totalAmount * 0.2,
            message: "QR code generated. Please download and attach to produce package."
        });
        } else {
            res.json({ success: false });
        }


        } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// UPDATED: Verify QR through special URL only
app.post("/api/verifyDelivery", async (req, res) => {
    try {
        const { scannedHash, verificationToken, purchaseId } = req.body;

        // Verify the token and purchase ID match
        const purchase = await purchaseModel.findOne({
            _id: purchaseId,
            verificationToken: verificationToken
        });

        if (!purchase) {
            return res.status(404).json({ 
                success: false, 
                message: "Invalid verification link. This QR can only be verified through the special URL sent to the buyer." 
            });
        }

        if (purchase.status === "completed") {
            return res.json({ 
                success: false, 
                message: "Payment already completed for this purchase." 
            });
        }

        // Verify the scanned hash matches the purchase hash
        if (purchase.purchaseHash !== scannedHash) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid QR code. This is not the QR code for this purchase." 
            });
        }

        // Release remaining 20%
        const remaining = purchase.totalAmount * 0.2;
        purchase.paidAmount = purchase.totalAmount;
        purchase.status = "completed";
        purchase.completedAt = new Date();
        await purchase.save();

        console.log(`Remaining 20% of ₹${remaining} released to farmer`);

        res.json({ 
            success: true, 
            message: `Payment completed! ₹${remaining.toFixed(2)} has been released to the farmer.`,
            totalPaid: purchase.totalAmount,
            completedAt: purchase.completedAt
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// New endpoint to check if a hash is just being read normally
app.post("/api/checkHash", async (req, res) => {
    try {
        const { hash } = req.body;
        
        // Check if this hash exists in any purchase
        const purchase = await purchaseModel.findOne({ purchaseHash: hash });
        
        if (purchase) {
            res.json({
                isValidHash: true,
                message: "This is a valid purchase hash. To release payment, use the verification URL sent to the buyer.",
                hint: "Payment can only be released through the secure verification link."
            });
        } else {
            res.json({
                isValidHash: false,
                message: "Unknown hash value."
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





app.post("/api/verify-produce", async (req, res) => {
    try {
        const { decodedText } = req.body;
        const result = await verifyProduceId(decodedText);

        if (result.events.some(event => event.type.includes('ProduceIdExists'))) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error("Verify Produce error:", err);
        res.status(500).send("Error verifying Produce");
    }
});app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.listen(3000, () => console.log("Server running on port 3000"));