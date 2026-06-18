document.addEventListener('DOMContentLoaded', () => {
    // --- DEMO DUOMENYS ---
    const demoDatasets = [
        { id: 3987, name: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras" },
        { id: 4071, name: "Adresų registro duomenys", owner: "Valstybės įmonė Registrų centras" }
    ];

    // --- ELEMENTAI ---
    const searchInput = document.getElementById('consult-dataset-search');
    const selectionContainer = document.getElementById('consult-datasets-selection');
    const selectedContainer = document.getElementById('consult-selected-datasets');
    const submitBtn = document.getElementById('submit-consultation');
    const activeList = document.getElementById('active-consultations-list');
    const modal = document.getElementById('chat-modal');
    const modalTitle = document.getElementById('chat-modal-title');
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-chat-message');
    const finishBtn = document.getElementById('finish-consultation-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    
    let selectedDatasets = [];
    let currentConsultationId = null;
    let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];

    // --- NAUJOS KONSULTACIJOS KŪRIMAS ---
    const renderSearchResults = (datasets) => {
        selectionContainer.innerHTML = '';
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = ds.name;
            div.onclick = () => {
                if (!selectedDatasets.some(sds => sds.id === ds.id)) selectedDatasets.push(ds);
                renderSelectedDatasets();
                searchInput.value = '';
                selectionContainer.innerHTML = '';
            };
            selectionContainer.appendChild(div);
        });
    };
    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        renderSearchResults(q.length > 2 ? demoDatasets.filter(ds => ds.name.toLowerCase().includes(q)) : []);
    });
    const renderSelectedDatasets = () => {
        selectedContainer.innerHTML = '<h4>Pridėti rinkiniai:</h4>';
        if (!selectedDatasets.length) selectedContainer.innerHTML += '<p>Kol kas nepridėta.</p>';
        selectedDatasets.forEach((ds, i) => {
            const item = document.createElement('div');
            item.className = 'selected-item';
            item.innerHTML = `${ds.name} <span class="remove-btn" data-index="${i}">(pašalinti)</span>`;
            selectedContainer.appendChild(item);
        });
    };
    selectedContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            selectedDatasets.splice(e.target.dataset.index, 1);
            renderSelectedDatasets();
        }
    });
    submitBtn.addEventListener('click', () => {
        const purpose = document.getElementById('consult-dataPurpose').value.trim();
        if (!purpose) { alert('Prašome nurodyti duomenų tvarkymo tikslą.'); return; }
        const newConsultation = {
            id: Date.now(), purpose: purpose,
            legalBasis: document.getElementById('consult-legalBasis').value,
            status: 'Pateikta, laukia teikėjo atsakymo',
            messages: [{ sender: 'recipient', text: purpose }, { sender: 'recipient', text: `Siūlomi rinkiniai: ${selectedDatasets.map(d=>d.name).join(', ') || 'Nenurodyta'}` }]
        };
        allConsultations.push(newConsultation);
        localStorage.setItem('consultations', JSON.stringify(allConsultations));
        alert('Konsultacija sėkmingai pateikta!');
        location.reload();
    });

    // --- ESAMŲ KONSULTACIJŲ VALDYMAS ---
    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const consult = allConsultations.find(c => c.id === consultationId);
        if (!consult) return;

        modalTitle.textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        chatHistory.innerHTML = '';
        consult.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.sender}`;
            msgDiv.innerHTML = `<strong>${msg.sender === 'recipient' ? 'Jūs' : 'Teikėjas'}:</strong><p>${msg.text}</p>`;
            chatHistory.appendChild(msgDiv);
        });

        modal.style.display = 'flex';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };
    const renderActiveConsultations = () => {
        const activeConsults = allConsultations.filter(c => !c.status.includes('Užbaigta'));
        activeList.innerHTML = activeConsults.length ? '' : '<p>Aktyvių konsultacijų nerasta.</p>';
        activeConsults.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            card.innerHTML = `
                <h3>Užklausa dėl: "${consult.purpose.substring(0, 50)}..."</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                <button class="btn-secondary" onclick="window.openChatModal(${consult.id})">Tęsti dialogą</button>
            `;
            activeList.appendChild(card);
        });
    };

    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (!text || !currentConsultationId) return;
        
        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].messages.push({ sender: 'recipient', text: text });
            allConsultations[consultIndex].status = 'Pateiktas klausimas, laukia teikėjo atsakymo';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            messageInput.value = '';
            openChatModal(currentConsultationId); // Refresh modal
            renderActiveConsultations(); // Refresh main list
        }
    });

    finishBtn.addEventListener('click', () => {
        if (!currentConsultationId || !confirm('Ar tikrai norite užbaigti šią konsultaciją?')) return;
        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].status = 'Užbaigta gavėjo';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            modal.style.display = 'none';
            renderActiveConsultations();
        }
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // --- PRADINIS PUSLAPIO UŽKROVIMAS ---
    window.openChatModal = openChatModal;
    renderSelectedDatasets();
    renderActiveConsultations();
});
