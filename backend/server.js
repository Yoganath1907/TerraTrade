const express = require('express');
const { generatePdf } = require("./makePdf");
const path = require("path");
const { addFarmerId, verifyFarmerId } = require('./verifyFarmerOnSui')
const cors = require("cors");
const multer = require("multer");
const {fromHex} = require('@mysten/sui/utils');
const QRCode = require("qrcode");
const crypto = require('crypto');

const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

app.post("/api/generatePdf",upload.single("photo"), async (req, res) => {
    try{

        const formData = req.body;
        formData.photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const privateKey = process.env.SUI_PRIVATE_KEY || '';

        const dataToHash = {
            name: formData.Name,
            state: formData.State
         };

        const rawInput = JSON.stringify(dataToHash) + privateKey;
        const hashedData = crypto.createHash('sha256').update(rawInput).digest('hex');
        console.log(hashedData);

        const qrImage = await QRCode.toDataURL(JSON.stringify(hashedData));
        formData.qr = qrImage;

        const pdfBuffer = generatePdf(formData);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'attachment; filename=id.pdf'
        });
        res.send(pdfBuffer);
    }
    catch(err){
        console.error("PDF generation error:", err);
        res.status(500).send("Error generating PDF");
    }

});

app.post("/api/verify-farmer",(req, res) => {

    const bufferArray = fromHex(bufferArray)
    const result = verifyFarmerId(bufferArray)
    if (result.events.some(event => event.type.includes('FarmerIdExists'))) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
});

app.post("/api/add-farmer", (res, req) => {
    const formData = req.body;

    const dataToHash = {
            name: formData.Name,
            state: formData.State
    };

    
    const rawInput = JSON.stringify(dataToHash) + privateKey;
    const hashedData = crypto.createHash('sha256').update(rawInput).digest('hex');

    const bufferArray = fromHex(bufferArray)
    const result = addFarmerId(bufferArray)
    if (result.events.some(event => event.type.includes('FarmerIdAdded'))) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }


});

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.listen(3000);