document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENYS SUTARČIŲ ATKŪRIMUI ---
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": {
            id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", eli: "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.235119/asr#14.1.", properties: { "code": { title: "Kodas", description: "Administracinio vieneto identifikacinis kodas", uri: "cv:code" }, "level": { title: "Tipas", description: "Administracinio vieneto tipas", uri: "cv:level" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Administracinio vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } },
                "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės identifikavimo kodas", uri: "dct:identifier" }, "name@lt": { title: "Vardas (vard.)", description: "Gyvenamosios vietovės vardas vardininko linksniu", uri: "locn:geographicName" }, "admin_unit": { title: "Administracinis vienetas", description: "Seniūnijos ar savivaldybės kodas" } } },
                "Street": { title: "Gatvė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gatvės identifikavimo kodas", uri: "dct:identifier" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Gatvės vardas kilmininko linksniu", uri: "locn:geographicName" }, "location": { title: "Gyvenvietė", description: "Gyvenamosios vietovės kodas", uri: "locn:location" } } }
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

    // --- BENDRA SUTARTIES TEKSTO GENERAVIMO FUNKCIJA ---
    const generateAgreementText = (agreement) => {
        if (!agreement || !agreement.assigner || !agreement.assignee) return "Trūksta sutarties duomenų.";
        const datasetKey = Object.keys(dataStructure).find(key => dataStructure[key].ownerCode === agreement.assigner.uid);
        const datasetInfo = dataStructure[datasetKey];
        if (!datasetInfo) return "Klaida: Duomenų rinkinys nerastas.";

        let text = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        text += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner['ex:companyName']}\n2. Gavėjas: ${agreement.assignee['ex:companyName']}\n\n`;
        text += `II. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${datasetInfo.title}" pagal nurodytą apimtį:\n`;
        (agreement.permission || []).forEach(perm => {
            if (!perm || !perm.target) return;
            const modelKey = perm.target.split('/')[1];
            const model = datasetInfo.models[modelKey];
            if (model) {
                text += `\nModelis: ${model.title} (URI: ${model.uri})\n`;
                const props = perm.constraint && perm.constraint[0] ? perm.constraint[0].rightOperand : [];
                props.forEach(propUri => {
                    const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                    if (propKey) text += `    - ${model.properties[propKey].title}: ${model.properties[propKey].description}\n`;
                });
            }
        });
        text += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${agreement.legalBasis || 'Nenurodyta'}\nTikslas: ${agreement.dataPurpose || 'Nenurodyta'}`;
        return text;
    };

    // --- SUTARČIŲ PERŽIŪROS FUNKCIJOS ---
    const openAgreementModal = (uid) => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreement = allAgreements.find(a => a && a.uid === uid);
        if (!agreement) { alert('Klaida: sutartis nerasta.'); return; }

        document.getElementById('agreement-view-text').textContent = generateAgreementText(agreement);
        document.getElementById('agreement-view-json').textContent = JSON.stringify(agreement, null, 2);

        const actionsContainer = document.getElementById('agreement-modal-actions');
        actionsContainer.innerHTML = '';

        // PATAISYMAS: statusas, kurį siunčia gavėjas, yra "Laukia peržiūros"
        if (agreement.status === "Laukia peržiūros") {
            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn-success';
            approveBtn.textContent = 'Patvirtinti sutarties projektą';
            approveBtn.onclick = () => updateAgreementStatus(uid, 'Sutarties projektas patvirtintas');
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'btn-danger';
            rejectBtn.textContent = 'Atmesti';
            rejectBtn.onclick = () => {
                const reason = prompt("Įveskite atmetimo priežastį:");
                if (reason) updateAgreementStatus(uid, 'Atmesta', reason);
            };
            actionsContainer.appendChild(approveBtn);
            actionsContainer.appendChild(rejectBtn);
        }
        agreementModal.style.display = 'flex';
    };

    const updateAgreementStatus = (uid, status, reason = null) => {
        let allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreementIndex = allAgreements.findIndex(a => a && a.uid === uid);
        if (agreementIndex > -1) {
            allAgreements[agreementIndex].status = status;
            if (reason) allAgreements[agreementIndex].rejectionReason = reason;
            localStorage.setItem('agreements', JSON.stringify(allAgreements));
            renderLists();
            agreementModal.style.display = 'none';
        }
    };
    
    // --- KONSULTACIJŲ KODAS (nepakito) ---
    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consult = allConsultations.find(c => c && c.id === consultationId);
        if (!consult) return;

        document.getElementById('chat-modal-title').textContent = `Konsultacija dėl: "${(consult.purpose || "").substring(0, 40)}..."`;
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
    
    document.getElementById('send-chat-message').addEventListener('click', () => {
        const textInput = document.getElementById('chat-message-input');
        const text = textInput.value.trim();
        if (!text || !currentConsultationId) return;

        let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consultIndex = allConsultations.findIndex(c => c && c.id === currentConsultationId);
        if (consultIndex > -1) {
            if (!allConsultations[consultIndex].messages) allConsultations[consultIndex].messages = [];
            allConsultations[consultIndex].messages.push({ sender: 'provider', text: text });
            allConsultations[consultIndex].status = 'Atsakyta, laukia gavėjo peržiūros';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            
            textInput.value = '';
            openChatModal(currentConsultationId);
            renderLists();
        }
    });

    // --- BENDRA RENDERINIMO FUNKCIJA ---
    const renderLists = () => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        
        // SUTARČIŲ RENDERINIMAS
        if (contractsList) {
            const validAgreements = allAgreements.filter(a => a && a.uid && a.status && a.assignee);
            contractsList.innerHTML = validAgreements.length ? '' : '<p>Pateiktų sutarčių nerasta.</p>';
            validAgreements.forEach(agreement => {
                let statusClass = 'status-pending';
                if (agreement.status === 'Sutarties projektas patvirtintas') statusClass = 'status-approved';
                if (agreement.status === 'Atmesta') statusClass = 'status-rejected';

                const card = document.createElement('div');
                card.className = `contract-card ${statusClass}-border`; // Pridėta klasė rėmeliui
                card.innerHTML = `
                    <h3>Sutartis su: ${agreement.assignee['ex:companyName']}</h3>
                    <p><strong>Statusas:</strong> <span class="${statusClass}">${agreement.status}</span></p>
                    <button class="btn-secondary" style="width: auto; padding: 8px 12px; font-size: 0.9rem;" onclick="window.openAgreementModal('${agreement.uid}')">Peržiūrėti</button>
                `;
                contractsList.appendChild(card);
            });
        }
        
        // KONSULTACIJŲ RENDERINIMAS
        if (consultationsList) {
            const activeConsults = allConsultations.filter(c => c && c.status && !c.status.includes('Užbaigta'));
            consultationsList.innerHTML = activeConsults.length ? '' : '<p>Naujų konsultacijų nerasta.</p>';
            activeConsults.forEach(consult => {
                const card = document.createElement('div');
                card.className = 'contract-card';
                card.innerHTML = `<h3>Užklausa: "${(consult.purpose || '').substring(0, 50)}..."</h3><p><strong>Statusas:</strong> <span class="status-pending">${consult.status}</span></p><button class="btn-secondary" style="width:auto; padding: 8px 12px;" onclick="window.openChatModal(${consult.id})">Peržiūrėti</button>`;
                consultationsList.appendChild(card);
            });
        }
        if (archiveList) {
            const archivedConsults = allConsultations.filter(c => c && c.status && c.status.includes('Užbaigta'));
            archiveList.innerHTML = archivedConsults.length ? '' : '<li class="archive-placeholder">Archyve įrašų nėra.</li>';
            archivedConsults.forEach(consult => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" onclick="window.openChatModal(${consult.id}); return false;"><strong>[Suteikta konsultacija]</strong> ${(consult.purpose || '').substring(0, 60)}...</a>`;
                archiveList.appendChild(li);
            });
        }
    };
    
    // --- PALEIDIMAS IR UŽDARYMO LOGIKA ---
    window.openAgreementModal = openAgreementModal;
    window.openChatModal = openChatModal;
    document.getElementById('close-chat-modal-btn').addEventListener('click', () => chatModal.style.display = 'none');
    document.getElementById('close-agreement-modal-btn').addEventListener('click', () => agreementModal.style.display = 'none');
    window.onclick = (event) => {
        if (event.target == chatModal) chatModal.style.display = 'none';
        if (event.target == agreementModal) agreementModal.style.display = 'none';
    };
    renderLists();
});
