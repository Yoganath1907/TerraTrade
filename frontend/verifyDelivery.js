document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    const purchaseId = urlParams.get('pid');
    
    if (!verificationToken || !purchaseId) {
        showResult('error', 'Invalid verification link. Please use the link provided after your purchase.');
        document.getElementById('startScan').disabled = true;
        return;
    }
    
    const startButton = document.getElementById('startScan');
    const resultDiv = document.getElementById('result');
    let html5QrCode = null;
    let isScanning = false;
    
    startButton.addEventListener('click', function() {
        if (!isScanning) {
            startScanning();
        } else {
            stopScanning();
        }
    });
    
    function startScanning() {
        html5QrCode = new Html5Qrcode("reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        ).then(() => {
            isScanning = true;
            startButton.textContent = 'Stop Scanning';
            showResult('', '');
        }).catch(err => {
            console.error("Unable to start scanning:", err);
            showResult('error', `Unable to access camera: ${err}`);
        });
    }
    
    function stopScanning() {
        if (html5QrCode && isScanning) {
            html5QrCode.stop().then(() => {
                isScanning = false;
                startButton.textContent = 'Start QR Scanner';
            }).catch(err => {
                console.error("Error stopping scanner:", err);
            });
        }
    }
    
    async function onScanSuccess(decodedText, decodedResult) {

        stopScanning();
        
        showResult('loading', '<div class="spinner"></div><p>Verifying QR code...</p>');
        
        try {
            const response = await fetch('http://localhost:3000/api/verifyDelivery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scannedHash: decodedText,
                    verificationToken: verificationToken,
                    purchaseId: purchaseId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showResult('success', `
                    <h2>✅ Payment Complete!</h2>
                    <p>${result.message}</p>
                    <hr>
                    <p><strong>Total Paid:</strong> ₹${result.totalPaid}</p>
                    <p><strong>Completed At:</strong> ${new Date(result.completedAt).toLocaleString()}</p>
                    <p>Thank you for your purchase! The farmer has received the full payment.</p>
                `);
                
                startButton.disabled = true;
                startButton.textContent = 'Payment Completed';
            } else {
                showResult('error', `
                    <h2>❌ Verification Failed</h2>
                    <p>${result.message}</p>
                    <button onclick="location.reload()">
                        Try Again
                    </button>
                `);
            }
        } catch (error) {
            showResult('error', `
                <h2>❌ Network Error</h2>
                <p>Unable to verify QR code. Please check your connection and try again.</p>
                <p>Error: ${error.message}</p>
            `);
        }
    }
    
    function onScanError(){
        //hello
    }
    
    function showResult(type, message) {
        const resultDiv = document.getElementById('result');
        
        if (!message) {
            resultDiv.style.display = 'none';
            resultDiv.innerHTML = '';
            return;
        }
        
        resultDiv.style.display = 'block';
        resultDiv.className = type;
        resultDiv.innerHTML = message;
    }
});

window.addEventListener('beforeunload', function() {
    const readerElement = document.getElementById('reader');
    if (readerElement && readerElement.innerHTML !== '') {
        return;
    }
});
