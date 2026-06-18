document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTAI ---
    const consultationsList = document.getElementById('provider-consultations-list');
    const archiveList = document.getElementById('archived-consultations-list');
    const contractsList = document.getElementById('contracts-list'); // Sutarčių sąrašo elementas
    
    const modal = document.getElementById('chat-modal');
    const modalTitle = document.getElementById('chat-modal-title');
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-chat-message');
    const closeBtn = document.getElementById('close-modal-btn');
    
    let currentConsultationId = null;

    // --- POKALBIŲ LANGAS (MODAL) ---
    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consult = allConsultations.find(c => c.id === consultationId);
        if (!consult) return;

        modalTitle.textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        chatHistory.innerHTML = '';
        
        consult.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.sender}`;
            const formattedText = msg.text.replace(/\n/g, '<br>');
            msgDiv.innerHTML = `<strong>${msg.sender === 'recipient' ? 'Gavėjas' : 'Teikėjas (Jūs)'}:</strong><p>${formattedText}</p>`;
            chatHistory.appendChild(msgDiv);
        });
        
        const isFinished = consult.status && consult.status.includes('Užbaigta');
        const inputArea = document.getElementById('chat-input-area');
        if (inputArea) {
            inputArea.style.display = isFinished ? 'none' : 'flex';
        }

        modal.style.display = 'flex';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    // --- PRANEŠIMO SIUNTIMAS ---
    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (!text || !currentConsultationId) return;
        
        let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].messages.push({ sender: 'provider', text: text });
            allConsultations[consultIndex].status = 'Atsakyta, laukia gavėjo peržiūros';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            
            messageInput.value = '';
            openChatModal(currentConsultationId);
            renderLists();
        }
    });

    // --- SĄRAŠŲ ATVAIZDAVIMAS ---
    const renderLists = () => {
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];

        // 1. Aktyvios konsultacijos
        const activeConsults = allConsultations.filter(c => c && c.status && !c.status.includes('Užbaigta'));
        consultationsList.innerHTML = activeConsults.length ? '' : '<p>Naujų konsultacijų nerasta.</p>';
        activeConsults.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            const lastMessage = consult.messages[consult.messages.length - 1];
            const shortText = lastMessage.text.replace(/[*_`]/g, '').substring(0, 80) + '...';
            card.innerHTML = `
                <h3>Užklausa: "${consult.purpose.substring(0, 50)}..."</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                <p><strong>Paskutinė žinutė:</strong> "<em>${shortText}</em>"</p>
                <button class="btn-secondary" onclick="window.openChatModal(${consult.id})">Peržiūrėti ir atsakyti</button>
            `;
            consultationsList.appendChild(card);
        });

        // 2. Konsultacijų archyvas
        const archivedConsults = allConsultations.filter(c => c && c.status && c.status.includes('Užbaigta'));
        archiveList.innerHTML = archivedConsults.length ? '' : '<li class="archive-placeholder">Archyve įrašų nėra.</li>';
        archivedConsults.forEach(consult => {
            const li = document.createElement('li');
            const dateStr = new Date(consult.id).toLocaleDateString('lt-LT');
            li.innerHTML = `<a href="#" onclick="window.openChatModal(${consult.id}); return false;"><strong>[Suteikta konsultacija - ${dateStr}]</strong> ${consult.purpose.substring(0, 60)}...</a>`;
            archiveList.appendChild(li);
        });

        // 3. Sutarčių sąrašas
        if (contractsList) {
            contractsList.innerHTML = allAgreements.length ? '' : '<p>Pateiktų sutarčių nerasta.</p>';
            allAgreements.forEach(agreement => {
                const card = document.createElement('div');
                card.className = 'contract-card';
                card.innerHTML = `
                    <h3>Sutartis su: ${agreement.assignee.ex_companyName || agreement.assignee.ex_companyName}</h3>
                    <p><strong>Sutarties ID:</strong> ${agreement.uid.split('/').pop().substring(0, 10)}...</p>
                    <p><strong>Būsena:</strong> <span class="status-pending">Gauta, laukia peržiūros</span></p>
                    <p><strong>Prašoma apimtis:</strong> ${agreement.permission.length} modeliai/-is.</p>
                `;
                contractsList.appendChild(card);
            });
        }
    };

    // --- UŽDARYMO LOGIKA ---
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
    
    // --- PRADINIS PALEIDIMAS ---
    window.openChatModal = openChatModal;
    renderLists();
});
