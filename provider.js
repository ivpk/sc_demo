document.addEventListener('DOMContentLoaded', () => {
    const activeList = document.getElementById('provider-consultations-list');
    const archiveList = document.getElementById('archived-consultations-list');
    const modal = document.getElementById('chat-modal');
    const modalTitle = document.getElementById('chat-modal-title');
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-chat-message');
    const closeBtn = document.getElementById('close-modal-btn');
    let currentConsultationId = null;
    let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];

    // --- INTERAKTYVAUS POKALBIO LANGAS (MODAL) ---
    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        // Užtikriname, kad nuskaitome naujausią būseną iš localStorage prieš atidarant modalą
        allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consult = allConsultations.find(c => c.id === consultationId);
        if (!consult) return;

        modalTitle.textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        chatHistory.innerHTML = '';
        
        consult.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.sender}`;
            
            // Paverčiame markdown \n simbolius į HTML <br> žymes, kad gavėjo pateikta 
            // detali Adresų registro modelių bei savybių struktūra būtų lengvai skaitoma
            const formattedText = msg.text.replace(/\n/g, '<br>');
            
            msgDiv.innerHTML = `
                <strong>${msg.sender === 'recipient' ? 'Gavėjas' : 'Teikėjas (Jūs)'}:</strong>
                <p style="margin-top: 5px; line-height: 1.5;">${formattedText}</p>
            `;
            chatHistory.appendChild(msgDiv);
        });
        
        // Patikriname, ar konsultacija jau yra sėkmingai užbaigta gavėjo
        const isFinished = consult.status.includes('Užbaigta');
        const inputArea = document.getElementById('chat-input-area');
        if (inputArea) {
            inputArea.style.display = isFinished ? 'none' : 'flex';
        }

        modal.style.display = 'flex';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    // --- SĄRAŠŲ ATVAIZDAVIMAS (AKTYVIOS / ARCHYVAS) ---
    const renderLists = () => {
        allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        
        const activeConsults = allConsultations.filter(c => !c.status.includes('Užbaigta'));
        const archivedConsults = allConsultations.filter(c => c.status.includes('Užbaigta'));
        
        // 1. Aktyvios (vykstančios) konsultacijos
        activeList.innerHTML = activeConsults.length ? '' : '<p>Naujų konsultacijų nerasta.</p>';
        activeConsults.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            
            // Paimame paskutinį pranešimą pokalbyje trumpai apžvalgai kortelėje
            const lastMessage = consult.messages[consult.messages.length - 1];
            const cleanText = lastMessage.text.replace(/[*_`]/g, ''); // Išvalome markdown simbolius santraukai
            const shortText = cleanText.length > 80 ? cleanText.substring(0, 80) + '...' : cleanText;
            
            card.innerHTML = `
                <h3>Užklausa dėl: "${consult.purpose.substring(0, 50)}..."</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                <p><strong>Paskutinė žinutė:</strong> "<em>${shortText}</em>"</p>
                <button class="btn-secondary" style="margin-top: 10px;" onclick="window.openChatModal(${consult.id})">Peržiūrėti ir atsakyti</button>
            `;
            activeList.appendChild(card);
        });

        // 2. Minimalistinis Užbaigtų konsultacijų archyvas ("Suteikta konsultacija")
        archiveList.innerHTML = archivedConsults.length ? '' : '<li class="archive-placeholder">Archyve įrašų nėra.</li>';
        archivedConsults.forEach(consult => {
            const li = document.createElement('li');
            const dateStr = new Date(consult.id).toLocaleDateString('lt-LT');
            li.innerHTML = `
                <a href="#" onclick="window.openChatModal(${consult.id}); return false;">
                    <strong>[Suteikta konsultacija - ${dateStr}]</strong> ${consult.purpose.substring(0, 60)}... (Peržiūrėti istoriją)
                </a>
            `;
            archiveList.appendChild(li);
        });
    };

    // --- PRANEŠIMO SIUNTIMAS ---
    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (!text || !currentConsultationId) return;
        
        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].messages.push({ sender: 'provider', text: text });
            allConsultations[consultIndex].status = 'Atsakyta, laukia gavėjo peržiūros';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            
            messageInput.value = '';
            openChatModal(currentConsultationId); // Atnaujiname aktyvų modalinį langą
            renderLists(); // Atnaujiname pagrindinius sąrašus
        }
    });

    // Uždarymo funkcionalumas
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
    
    // Eksportuojame funkciją į globalią sritį, kad ją iškviestų HTML mygtukai
    window.openChatModal = openChatModal;
    
    // Pradinis sąrašų užkrovimas
    renderLists();
});
    renderLists();
});
