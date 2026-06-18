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

    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const consult = allConsultations.find(c => c.id === consultationId);
        if (!consult) return;

        modalTitle.textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        chatHistory.innerHTML = '';
        consult.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.sender}`;
            msgDiv.innerHTML = `<strong>${msg.sender === 'recipient' ? 'Gavėjas' : 'Teikėjas (Jūs)'}:</strong><p>${msg.text}</p>`;
            chatHistory.appendChild(msgDiv);
        });
        
        const isFinished = consult.status.includes('Užbaigta');
        messageInput.style.display = isFinished ? 'none' : 'block';
        sendBtn.style.display = isFinished ? 'none' : 'block';

        modal.style.display = 'flex';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    const renderLists = () => {
        const activeConsults = allConsultations.filter(c => !c.status.includes('Užbaigta'));
        const archivedConsults = allConsultations.filter(c => c.status.includes('Užbaigta'));
        
        activeList.innerHTML = activeConsults.length ? '' : '<p>Naujų konsultacijų nerasta.</p>';
        activeConsults.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            const lastMessage = consult.messages[consult.messages.length - 1];
            card.innerHTML = `
                <h3>Užklausa dėl: "${consult.purpose.substring(0, 50)}..."</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                <p><strong>Paskutinė žinutė:</strong> "...${lastMessage.text.substring(0, 60)}..."</p>
                <button class="btn-secondary" onclick="window.openChatModal(${consult.id})">Peržiūrėti ir atsakyti</button>
            `;
            activeList.appendChild(card);
        });

        archiveList.innerHTML = archivedConsults.length ? '' : '<li class="archive-placeholder">Archyve įrašų nėra.</li>';
        archivedConsults.forEach(consult => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" onclick="window.openChatModal(${consult.id})">${consult.purpose.substring(0, 80)}... (Užbaigta)</a>`;
            archiveList.appendChild(li);
        });
    };

    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (!text || !currentConsultationId) return;
        
        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].messages.push({ sender: 'provider', text: text });
            allConsultations[consultIndex].status = 'Atsakyta, laukia gavėjo peržiūros';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            messageInput.value = '';
            openChatModal(currentConsultationId); // Refresh modal view
            renderLists(); // Refresh main lists
        }
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
    
    window.openChatModal = openChatModal;
    renderLists();
});
