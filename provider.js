document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTAI ---
    const consultationsList = document.getElementById('provider-consultations-list');
    const archiveList = document.getElementById('archived-consultations-list');
    const contractsList = document.getElementById('contracts-list');
    
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
        const consult = allConsultations.find(c => c && c.id === consultationId);
        if (!consult) return;

        if (modalTitle) modalTitle.textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        if (chatHistory) {
            chatHistory.innerHTML = '';
            
            // Saugus žinučių atvaizdavimas
            const messages = consult.messages || [];
            messages.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-message ${msg.sender}`;
                const formattedText = (msg.text || '').replace(/\n/g, '<br>');
                msgDiv.innerHTML = `<strong>${msg.sender === 'recipient' ? 'Gavėjas' : 'Teikėjas (Jūs)'}:</strong><p>${formattedText}</p>`;
                chatHistory.appendChild(msgDiv);
            });
        }
        
        const isFinished = consult.status && consult.status.includes('Užbaigta');
        const inputArea = document.getElementById('chat-input-area');
        if (inputArea) {
            inputArea.style.display = isFinished ? 'none' : 'flex';
        }

        if (modal) modal.style.display = 'flex';
        if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    // --- PRANEŠIMO SIUNTIMAS ---
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (!messageInput) return;
            const text = messageInput.value.trim();
            if (!text || !currentConsultationId) return;
            
            let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
            const consultIndex = allConsultations.findIndex(c => c && c.id === currentConsultationId);
            if (consultIndex > -1) {
                if (!allConsultations[consultIndex].messages) {
                    allConsultations[consultIndex].messages = [];
                }
                allConsultations[consultIndex].messages.push({ sender: 'provider', text: text });
                allConsultations[consultIndex].status = 'Atsakyta, laukia gavėjo peržiūros';
                localStorage.setItem('consultations', JSON.stringify(allConsultations));
                
                messageInput.value = '';
                openChatModal(currentConsultationId);
                renderLists();
            }
        });
    }

    // --- SĄRAŠŲ ATVAIZDAVIMAS ---
    const renderLists = () => {
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];

        // 1. Aktyvios konsultacijos (Saugus filtravimas)
        const activeConsults = allConsultations.filter(c => c && c.status && !c.status.includes('Užbaigta'));
        if (consultationsList) {
            consultationsList.innerHTML = activeConsults.length ? '' : '<p>Naujų konsultacijų nerasta.</p>';
            activeConsults.forEach(consult => {
                const card = document.createElement('div');
                card.className = 'contract-card';
                
                // Saugiai paimame paskutinę žinutę
                const messages = consult.messages || [];
                const lastMessage = messages.length > 0 ? messages[messages.length - 1] : { text: 'Nėra žinučių' };
                const shortText = (lastMessage.text || '').replace(/[*_`]/g, '').substring(0, 80) + '...';
                
                card.innerHTML = `
                    <h3>Užklausa: "${(consult.purpose || '').substring(0, 50)}..."</h3>
                    <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                    <p><strong>Paskutinė žinutė:</strong> "<em>${shortText}</em>"</p>
                    <button class="btn-secondary" onclick="window.openChatModal(${consult.id})">Peržiūrėti ir atsakyti</button>
                `;
                consultationsList.appendChild(card);
            });
        }

        // 2. Konsultacijų archyvas (Saugus filtravimas)
        const archivedConsults = allConsultations.filter(c => c && c.status && c.status.includes('Užbaigta'));
        if (archiveList) {
            archiveList.innerHTML = archivedConsults.length ? '' : '<li class="archive-placeholder">Archyve įrašų nėra.</li>';
            archivedConsults.forEach(consult => {
                const li = document.createElement('li');
                const dateStr = new Date(consult.id).toLocaleDateString('lt-LT');
                li.innerHTML = `<a href="#" onclick="window.openChatModal(${consult.id}); return false;"><strong>[Suteikta konsultacija - ${dateStr}]</strong> ${(consult.purpose || '').substring(0, 60)}...</a>`;
                archiveList.appendChild(li);
            });
        }

        // 3. Sutarčių sąrašas (Saugiai perskaitome raktus su dvitaškiais)
        if (contractsList) {
            contractsList.innerHTML = allAgreements.length ? '' : '<p>Pateiktų sutarčių nerasta.</p>';
            allAgreements.forEach(agreement => {
                if (!agreement) return;
                
                // Saugiai surandame įmonės pavadinimą (palaiko ir seną, ir naują ODRL raktų formatą)
                const assigneeObj = agreement.assignee || {};
                const companyName = assigneeObj["ex:companyName"] || assigneeObj.ex_companyName || assigneeObj.companyName || "Valstybės skaitmeninių sprendimų agentūra";
                const agreementUid = agreement.uid || `Sutartis-${Date.now()}`;
                const permissionCount = agreement.permission ? agreement.permission.length : 0;

                const card = document.createElement('div');
                card.className = 'contract-card';
                card.innerHTML = `
                    <h3>Sutartis su: ${companyName}</h3>
                    <p><strong>Sutarties ID:</strong> <code>${agreementUid.split('/').pop().substring(0, 10)}...</code></p>
                    <p><strong>Būsena:</strong> <span class="status-pending" style="color: #4caf50;">Gauta, laukia peržiūros</span></p>
                    <p><strong>Prašoma apimtis:</strong> ${permissionCount} modeliai/-is.</p>
                `;
                contractsList.appendChild(card);
            });
        }
    };

    // --- UŽDARYMO LOGIKA ---
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
    }
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
    
    // Eksportuojame funkciją į globalų window lygį
    window.openChatModal = openChatModal;
    renderLists();
});
