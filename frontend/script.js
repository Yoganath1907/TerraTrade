document.getElementById("myForm").addEventListener("submit", async(e) => {
    e.preventDefault();
    const baseurl = "http://127.0.0.1:3000";
    console.log(baseurl);
    const formData = new FormData(e.target);   
    

    const response = await fetch(`${baseurl}/api/generatePdf`, {
        method: "POST",
        body : formData
    });

    if (response.ok){
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const pdfAnchor = document.createElement("a");
        pdfAnchor.href = url;
        pdfAnchor.download = "id.pdf";
        document.body.appendChild(pdfAnchor);
        pdfAnchor.click();
        document.body.removeChild(pdfAnchor);
        window.URL.revokeObjectURL(url);

    }

    const res = await fetch(`${baseurl}/api/add-farmer`, {
        method: "POST",
        body : formData
    });

    if (res.success) {
        showPopup("farmer id added");
      } else {
        showPopup("farmer id not added, some error occured");
    }

});