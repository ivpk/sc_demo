document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENŲ STRUKTŪRA (BŪTINA SUTARČIŲ ATKŪRIMUI) ---
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": {
            id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", eli: "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.235119/asr#14.1.", properties: { "code": { title: "Kodas", description: "Administracinio vieneto identifikacinis kodas", uri: "cv:code" }, "level": { title: "Tipas", description: "Administracinio vieneto tipas (apskritis, savivaldybė, seniūnija)", uri: "cv:level" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Administracinio vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } },
                "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės identifikavimo kodas", uri: "dct:identifier" }, "name@lt": { title: "Vardas (vard.)", description: "Gyvenamosios vietovės vardas vardininko linksniu", uri: "locn:geographicName" }, "admin_unit": { title: "Administracinis vienetas", description: "Seniūnijos ar savivaldybės, kuriai priklauso, kodas" } } },
                "Street": { title: "Gatvė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gatvės identifikavimo kodas", uri: "dct:identifier" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Gatvės vardas kilmininko linksniu", uri: "locn:geographicName" }, "location": { title: "Gyvenvietė", description: "Gyvenamosios vietovės, kuriai priklauso gatvė, kodas", uri: "locn:location" } } }
            }
        }
    };
    
    // --- ELEMENTAI ---
    const consultationsList = document.getElementById('provider-consultations-list');
    const archiveList = document.getElementById('archived-consultations-list');
    const contractsList = document.getElementById('contracts-list');
    
    const chatModal = document.getElementById('chat-modal');
    const agreementModal = document.getElementById('agreement-view-modal');

    let currentConsultationId = null;

    // --- SUTARČIŲ PERŽIŪRA ---
    const openAgreementModal = (uid) => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreement = allAgreements.find(a => a.uid === uid);
        if (!agreement) { alert('Sutartis nerasta.'); return; }

        const datasetInfo = Object.values(dataStructure)[0]; // Supaprastinta demonstracijai
        let agreementText = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        agreementText += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner.ex_companyName}\n2. Gavėjas: ${agreement.assignee.ex_companyName}\n\n`;
        agreementText += `II. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${datasetInfo.title}" pagal nurodytą apimtį:\n`;
        
        (agreement.permission || []).forEach(perm => {
            const modelKey = perm.target.split('/')[1];
            const model = datasetInfo.models[modelKey];
            if (model) {
                agreementText += `\nModelis: ${model.title}\n`;
                const props = perm.constraint[0].rightOperand;
                props.forEach(propUri => {
                    const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                    if (propKey) {
                        const prop = model.properties[propKey];
                        agreementText += `    - ${prop.title}: ${prop.description}\n`;
                    }
                });
            }
        });

        document.getElementById('agreement-view-text').textContent = agreementText;
        document.getElementById('agreement-view-json').textContent = JSON.stringify(agreement, null, 2);
        agreementModal.style.display = 'flex';
    };

    // --- KONSULTACIJŲ POKALBIŲ LANGAS ---
    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consult = allConsultations.find(c => c && c.id === consultationId);
        if (!consult) return;

        document.getElementById('chat-modal-title').textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';
        (consult.messages || []).forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.sender}`;
            msgDiv.innerHTML = `<strong>${msg.sender === 'recipient' ? 'Gavėjas' : 'Teikėjas (Jūs)'}:</strong><p>${(msg.text || '').replace(/\n/g, '<br>')}</p>`;
            chatHistory.appendChild(msgDiv);
        });
        
        document.getElementById('chat-input-area').style.display = (consult.status && consult.status.includes('Užbaigta')) ? 'none' : 'flex';
        chatModal.style.display = 'flex';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };
    
    // --- BENDRIEJI VEIKSMAI (PRANEŠIMŲ SIUNTIMAS, SĄRAŠŲ RODYMAS) ---
    document.getElementById('send-chat-message').addEventListener('click', () => {
        const text = document.getElementById('chat-message-input').value.trim();
        if (!text || !currentConsultationId) return;
        let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consultIndex = allConsultations.findIndex(c => c && c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].messages.push({ sender: 'provider', text: text });
            allConsultations[consultIndex].status = 'Atsakyta, laukia gavėjo peržiūros';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            document.getElementById('chat-message-input').value = '';
            openChatModal(currentConsultationId);
            renderLists();
        }
    });

    const renderLists = () => {
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];

        // 1. Sutarčių sąrašas
        contractsList.innerHTML = allAgreements.length ? '' : '<p>Pateiktų sutarčių nerasta.</p>';
        allAgreements.forEach(agreement => {
            if (!agreement) return;
            const card = document.createElement('div');
            card.className = 'contract-card';
            const companyName = agreement.assignee ? (agreement.assignee["ex:companyName"] || "Nenurodyta") : "Nenurodyta";
            card.innerHTML = `
                <h3>Sutartis su: ${companyName}</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">Gauta, laukia peržiūros</span></p>
                <button class="btn-secondary" onclick="window.openAgreementModal('${agreement.uid}')">Peržiūrėti sutartį</button>
            `;
            contractsList.appendChild(card);
        });

        // 2. Aktyvios konsultacijos
        const activeConsults = allConsultations.filter(c => c && c.status && !c.status.includes('Užbaigta'));
        consultationsList.innerHTML = activeConsults.length ? '' : '<p>Naujų konsultacijų nerasta.</p>';
        activeConsults.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            card.innerHTML = `<h3>Užklausa: "${(consult.purpose || '').substring(0, 50)}..."</h3><p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p><button class="btn-secondary" onclick="window.openChatModal(${consult.id})">Peržiūrėti ir atsakyti</button>`;
            consultationsList.appendChild(card);
        });

        // 3. Konsultacijų archyvas
        const archivedConsults = allConsultations.filter(c => c && c.status && c.status.includes('Užbaigta'));
        archiveList.innerHTML = archivedConsults.length ? '' : '<li class="archive-placeholder">Archyve įrašų nėra.</li>';
        archivedConsults.forEach(consult => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" onclick="window.openChatModal(${consult.id}); return false;"><strong>[Suteikta konsultacija]</strong> ${(consult.purpose || '').substring(0, 60)}...</a>`;
            archiveList.appendChild(li);
        });
    };

    // --- UŽDARYMO LOGIKA ---
    document.getElementById('close-chat-modal-btn').addEventListener('click', () => chatModal.style.display = 'none');
    document.getElementById('close-agreement-modal-btn').addEventListener('click', () => agreementModal.style.display = 'none');
    window.onclick = (event) => {
        if (event.target === chatModal) chatModal.style.display = 'none';
        if (event.target === agreementModal) agreementModal.style.display = 'none';
    };
    
    // --- PRADINIS PALEIDIMAS ---
    window.openChatModal = openChatModal;
    window.openAgreementModal = openAgreementModal;
    renderLists();
});
