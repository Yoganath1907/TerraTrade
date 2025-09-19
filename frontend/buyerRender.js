let allProduces = [];
let filteredProduces = [];
let selectedProduce = null;

document.addEventListener('DOMContentLoaded', function() {
    loadProduces();
});

async function loadProduces() {
    try {
        const response = await fetch('http://localhost:3000/api/getAllProduce');
        if (!response.ok) throw new Error();
        
        allProduces = await response.json();
        filteredProduces = [...allProduces];
        displayProduces(filteredProduces);
    } catch {
        document.getElementById('produceContainer').innerHTML = `
            <div>
                <button onclick="loadProduces()">Retry</button>
            </div>
        `;
    }
}

function displayProduces(produces) {
    const container = document.getElementById('produceContainer');
    
    if (produces.length === 0) {
        container.innerHTML = `<div></div>`;
        return;
    }
    
    const grid = produces.map(produce => `
        <div>
            <div>${produce.produceName}</div>
            <div>${produce.farmerName}</div>
            <div>${produce.grade}</div>
            <div>${formatDate(produce.harvestDate)}</div>
            <div>${produce.quantity}</div>
            <div>${produce.contactNumber}</div>
            <div>₹${produce.fairPrice}</div>
            <button onclick="initiatePurchase('${produce._id}')">Buy</button>
        </div>
    `).join('');
    
    container.innerHTML = `<div>${grid}</div>`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const gradeFilter = document.getElementById('gradeFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    filteredProduces = allProduces.filter(produce => {
        const matchesSearch = !searchTerm || 
            produce.produceName.toLowerCase().includes(searchTerm) ||
            produce.farmerName.toLowerCase().includes(searchTerm);
        
        const matchesGrade = !gradeFilter || produce.grade === gradeFilter;
        
        return matchesSearch && matchesGrade;
    });
    
    switch(sortBy) {
        case 'price-low':
            filteredProduces.sort((a, b) => a.fairPrice - b.fairPrice);
            break;
        case 'price-high':
            filteredProduces.sort((a, b) => b.fairPrice - a.fairPrice);
            break;
        case 'date':
        default:
            filteredProduces.sort((a, b) => new Date(b.harvestDate) - new Date(a.harvestDate));
    }
    
    displayProduces(filteredProduces);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('gradeFilter').value = '';
    document.getElementById('sortBy').value = 'date';
    filteredProduces = [...allProduces];
    displayProduces(filteredProduces);
}

function initiatePurchase(produceId) {
    selectedProduce = allProduces.find(p => p._id === produceId);
    if (!selectedProduce) return;
    
    document.getElementById('selectedProduceInfo').innerHTML = `
        <div>${selectedProduce.produceName}</div>
        <div>${selectedProduce.farmerName}</div>
        <div>${selectedProduce.quantity}</div>
        <div>₹${selectedProduce.fairPrice}</div>
    `;
    
    document.getElementById('purchaseModal').style.display = 'block';
    document.getElementById('purchaseForm').reset();
    document.getElementById('formContainer').innerHTML = '';
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
    selectedProduce = null;
}

document.getElementById('purchaseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedProduce) return;
    
    const form = e.target;
    const submitButton = form.querySelector('.submit-button');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    const formContainer = document.getElementById('formContainer');

    const data = {
        buyerName: form.buyerName.value,
        buyerPhone: form.buyerPhone.value,
        buyerEmail: form.buyerEmail.value,
        produceId: selectedProduce._id,
        totalAmount: parseFloat(selectedProduce.fairPrice)
    };

    try {
        const res = await fetch('http://localhost:3000/api/initiatePurchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        
        if (result.success) {
            const downloadLink = document.createElement('a');
            downloadLink.href = result.qrCode;
            downloadLink.download = `purchase-qr-${result.purchaseId}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            form.style.display = 'none';
            formContainer.innerHTML = `
                <div>
                    <div>${result.verificationUrl}</div>
                    <a href="${result.verificationUrl}" target="_blank">Verify</a>
                    <button onclick="closePurchaseModal(); loadProduces();">Close</button>
                </div>
            `;
        } else {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    } catch {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

window.onclick = function(event) {
    const modal = document.getElementById('purchaseModal');
    if (event.target === modal) {
        closePurchaseModal();
    }
}
