const express = require('express');
const { generatePdf } = require("./makePdf");
const path = require("path");
const { addFarmerId, verifyFarmerId } = require('./verifyFarmerOnSui');
const cors = require("cors");
const multer = require("multer");
const QRCode = require("qrcode");
const crypto = require('crypto');

const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

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

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.listen(3000, () => console.log("Server running on port 3000"));
