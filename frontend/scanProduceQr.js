const params = new URLSearchParams(window.location.search);
const purchaseId = params.get('purchaseId');
const message = document.getElementById('message');

if (!purchaseId) {
    message.textContent = "Missing purchaseId in URL";
    throw new Error("Missing purchaseId in URL");
}

const html5QrCode = new Html5Qrcode("video");

html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 100 },
    async (decodedText) => {
        const res = await fetch('http://localhost:3000/api/scanQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ purchaseId, scannedQRCode: decodedText })
        });

        const result = await res.json();
        message.textContent = result.message;

        if (result.success) html5QrCode.stop();
    },
    (errorMessage) => { /* ignore scan errors */ }
).catch(err => {
    console.error(err);
    message.textContent = "Error accessing camera";
});
