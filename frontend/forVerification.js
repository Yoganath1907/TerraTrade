console.log(window.location.origin)
console.log("hi")
document.getElementById("startBtn").addEventListener("click", async () => {
  const stop = document.getElementById("stopBtn");
  stop.disabled = false;
  const reader = document.getElementById("video");
  reader.style.display = "block";

  

  const baseUrl = "http://127.0.0.1:3000"
  const html5QrCode = new Html5Qrcode("video");

  const cameras = await Html5Qrcode.getCameras();
  if (!cameras || cameras.length === 0) {
    alert("No camera found");
    return;
  }

const backCam = cameras.find(cam => /back|rear/i.test(cam.label));
const cameraId = backCam ? backCam.id : cameras[0].id;

try{
  html5QrCode.start(
    cameraId,
    { fps: 10, qrbox: 300, disableFlip: false},
    async (decodedText) => {
      await html5QrCode.stop();
      showLoading();

      const response = await fetch(`${baseUrl}/api/verify-farmer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ decodedText })
      });

      const result = await response.json();
      hideLoading();
      if (result.success) {
        showPopup("true farmer");
      } else {
        showPopup("fake farmer")
    }
    (error) => {
      console.log(`QR Code scan error': ${error}`);
    }}
  );
} catch (error) {
  console.error(error);
}

function showPopup(message) {
  document.getElementById("popup-message").innerText = message;}



function hideLoading() {
  document.getElementById("loading").style.display = "none";
}
function hidePopup() {
  document.getElementById("popup").style.display = "none";
}

function showLoading() {
  document.getElementById("loading").style.display = "flex";
}


})
