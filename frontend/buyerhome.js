
const base_url = "http://127.0.0.1:3000"
const produces = document.getElementById("produces")
const itembtn = document.getElementsByTagName()

    const fun =async () =>{
        try{
        const response = await fetch(`${base_url}/api/buyerhome`);
        const data = await response.json();

        let html = "";
        for(let i of data){
            html+= `<div class='produceItem'>
            ${i.name}<br>
            ${i.produce_name}<br>
            ${i.grade}
            <button id="${i.id}"">Buy</button>
            </div>`

            var btn = document.getElementById(i.id)

            btn.addEventListener('click', async () => {
                window.location.href = ""
            })
        }
        produces.innerHTML = html;
        }
        catch(err)
        {
            console.log(err)
        }

    }

    fun();

