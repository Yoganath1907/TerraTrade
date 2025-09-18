document.getElementById("myForm").addEventListener("submit", async(e) =>{
    e.preventDefault();
    const baseurl = "http://127.0.0.1:3000";
    const formData = new FormData(e.target); 
    const dataObject = Object.fromEntries(formData.entries());

    const res = await fetch(`${baseurl}/api/addToDb`, {
        method: "POST", 
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataObject)
    });

})