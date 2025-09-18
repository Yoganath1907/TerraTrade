const { jsPDF } = require("jspdf");


function generatePdf(formData) {

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85, 54] 
    });

    doc.setLineWidth(0.5);
    doc.rect(2, 2, 81, 50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TerraTrade Farmer ID Card", 42.5, 8, { align: "center" });

    doc.rect(5, 12, 18, 22);
    if (formData.photo) {
        doc.addImage(formData.photo, "JPEG", 5, 12, 18, 22);
    }

    if (formData.qr) {
        doc.addImage(formData.qr, "PNG", 7, 36, 14, 14);
    }

    let y = 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const [key, value] of Object.entries(formData)) {
        if (key === "photo" || key === "qr") continue;
        doc.text(`${key}: ${value}`, 26, y);
        y += 6;
    }

    return Buffer.from(doc.output("arraybuffer"));
}


module.exports = { generatePdf };
