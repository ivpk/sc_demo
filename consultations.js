document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENYS (PAGAL PATEIKTĄ .CSV) ---
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": {
            id: 4071,
            title: "Adresų duomenys su koordinatėmis",
            owner: "Valstybės įmonė Registrų centras",
            ownerCode: "124110246",
            models: {
                "AdminUnit": {
                    title: "Administracinis vienetas",
                    uri: "cv:AdminUnit",
                    eli: "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.235119/asr#14.1.",
                    properties: {
                        "code": { title: "Kodas", description: "Administracinio vieneto identifikacinis kodas", uri: "cv:code", eli: null },
                        "level": { title: "Tipas", description: "Administracinio vieneto tipas (apskritis, savivaldybė, seniūnija)", uri: "cv:level", eli: null },
                        "name_gen@lt": { title: "Vardas (kilm.)", description: "Administracinio vieneto vardas kilmininko linksniu", uri: "rdfs:label", eli: null }
                    }
                },
                "Location": {
                    title: "Gyvenamoji vietovė",
                    uri: "dct:Location",
                    eli: null,
                    properties: {
                        "code": { title: "Kodas", description: "Gyvenamosios vietovės identifikavimo kodas", uri: "dct:identifier", eli: null },
                        "name@lt": { title: "Vardas (vard.)", description: "Gyvenamosios vietovės vardas vardininko linksniu", uri: "locn:geographicName", eli: null },
                        "admin_unit": { title: "Administracinis vienetas", description: "Seniūnijos ar savivaldybės, kuriai priklauso, kodas", uri: null, eli: null }
                    }
                },
                "Street": {
                    title: "Gatvė",
                    uri: "dct:Location",
                    eli: null,
                    properties: {
                        "code": { title: "Kodas", description: "Gatvės identifikavimo kodas", uri: "dct:identifier", eli: null },
                        "name_gen@lt": { title: "Vardas (kilm.)", description: "Gatvės vardas kilmininko linksniu", uri: "locn:geographicName", eli: null },
                        "location": { title: "Gyvenvietė", description: "Gyvenamosios vietovės, kuriai priklauso gatvė, kodas", uri: "locn:location", eli: null }
                    }
                }
            }
        }
    };

    // --- ELEMENTAI ---
    const datasetsContainer = document.getElementById('consult-datasets-selection');
    const modelsContainer = document.getElementById('consult-models-selection');
    const propertiesContainer = document.getElementById('consult-properties-selection');
    const submitBtn = document.getElementById('submit-consultation');
    const activeList = document.getElementById('active-consultations-list');
    
    // Dialogo (modal) elementai
    const modal = document.getElementById('chat-modal');
    const modalTitle = document.getElementById('chat-modal-title');
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-chat-message');
    const finishBtn = document.getElementById('finish-consultation-btn');
    const closeBtn = document.getElementById('close-modal-btn');

    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };
    let currentConsultationId = null;
    let allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];

    // --- PAIEŠKOS / ATVAIZDAVIMO LOGIKA FORMOJE ---
    const renderDatasets = () => {
        datasetsContainer.innerHTML = '';
        Object.entries(dataStructure).forEach(([key, ds]) => {
            datasetsContainer.innerHTML += `
                <div class="dataset-item">
                    <label><input type="radio" name="consult-dataset" value="${key}"> ${ds.title}</label>
                </div>`;
        });
    };

    const renderModels = (datasetKey) => {
        const dataset = dataStructure[datasetKey];
        modelsContainer.innerHTML = '';
        Object.keys(dataset.models).forEach(modelKey => {
            modelsContainer.innerHTML += `
                <div class="model-item" style="margin-bottom: 6px;">
                    <label><input type="checkbox" name="consult-model" value="${modelKey}"> ${dataset.models[modelKey].title}</label>
                </div>`;
        });
        document.getElementById('consult-models-container').style.display = 'block';
    };

    const renderProperties = () => {
        propertiesContainer.innerHTML = '';
        const dataset = dataStructure[state.selectedDataset];
        state.selectedModels.forEach(modelKey => {
            const model = dataset.models[modelKey];
            let propertiesHTML = `<div class="property-group" style="margin-bottom: 12px; border-left: 3px solid #ccc; padding-left: 10px;"><h4>${model.title} savybės:</h4>`;
            Object.keys(model.properties).forEach(propKey => {
                propertiesHTML += `
                    <div style="margin-bottom: 4px;">
                        <label>
                            <input type="checkbox" name="consult-property" value="${propKey}" data-model="${modelKey}">
                            <strong>${model.properties[propKey].title}</strong> (raktas: <code>${propKey}</code>) - <em>${model.properties[propKey].description}</em>
                        </label>
                    </div>`;
            });
            propertiesHTML += `</div>`;
            propertiesContainer.innerHTML += propertiesHTML;
        });
        document.getElementById('consult-properties-container').style.display = state.selectedModels.length > 0 ? 'block' : 'none';
    };

    // --- ĮVYKIAI FORMOJE ---
    document.addEventListener('change', (e) => {
        const { name, value, checked, dataset: elDataset } = e.target;

        if (name === 'consult-dataset') {
            state = { selectedDataset: value, selectedModels: [], selectedProperties: {} };
            renderModels(value);
            renderProperties();
        }

        if (name === 'consult-model') {
            if (checked) {
                state.selectedModels.push(value);
                state.selectedProperties[value] = [];
            } else {
                state.selectedModels = state.selectedModels.filter(m => m !== value);
                delete state.selectedProperties[value];
            }
            renderProperties();
        }

        if (name === 'consult-property') {
            const modelKey = e.target.getAttribute('data-model');
            if (checked) {
                state.selectedProperties[modelKey].push(value);
            } else {
                state.selectedProperties[modelKey] = state.selectedProperties[modelKey].filter(p => p !== value);
            }
        }
    });

    // --- KONSULTACIJOS PATEIKIMAS ---
    submitBtn.addEventListener('click', () => {
        const purpose = document.getElementById('consult-dataPurpose').value.trim();
        const legalBasis = document.getElementById('consult-legalBasis').value.trim();

        if (!purpose) {
            alert('Prašome nurodyti duomenų tvarkymo tikslą arba rūpimus klausimus.');
            return;
        }

        // Suformuojame detalią siūlomą apimtį pagal pasirinktus modelius ir savybes
        let scopeSummary = `**Teisinis pagrindas:** ${legalBasis}\n\n**Prašoma duomenų apimtis:**\n`;
        
        if (state.selectedDataset) {
            const dataset = dataStructure[state.selectedDataset];
            scopeSummary += `Rinkinys: "${dataset.title}"\n`;
            
            if (state.selectedModels.length > 0) {
                state.selectedModels.forEach(modelKey => {
                    const model = dataset.models[modelKey];
                    scopeSummary += `\n- Modelis: "${model.title}" (URI: \`${model.uri || 'Nėra'}\`)`;
                    if (model.eli) scopeSummary += ` (ELI: ${model.eli})`;
                    
                    const props = state.selectedProperties[modelKey] || [];
                    if (props.length > 0) {
                        scopeSummary += `\n  Savybės:\n`;
                        props.forEach(propKey => {
                            const prop = model.properties[propKey];
                            scopeSummary += `    * ${prop.title} (URI: \`${prop.uri || 'Nėra'}\`) - ${prop.description}\n`;
                        });
                    } else {
                        scopeSummary += `\n  (Savybės nepasirinktos - prašoma parinkti arba konsultuotis dėl viso modelio)\n`;
                    }
                });
            } else {
                scopeSummary += `\n(Nepasirinktas joks konkretus modelis – reikalinga pagalba suformuojant duomenų modelį iš esmės)`;
            }
        } else {
            scopeSummary += `Nenurodyta (reikalinga konsultacija nuo nulio)`;
        }

        const newConsultation = {
            id: Date.now(),
            purpose: purpose,
            legalBasis: legalBasis,
            status: 'Pateikta, laukia teikėjo atsakymo',
            messages: [
                { sender: 'recipient', text: `**Klausimas / poreikis:**\n${purpose}` },
                { sender: 'recipient', text: scopeSummary }
            ]
        };

        allConsultations.push(newConsultation);
        localStorage.setItem('consultations', JSON.stringify(allConsultations));
        alert('Konsultacijos užklausa sėkmingai pateikta Teikėjui!');
        
        // Išvalome būseną ir formą
        state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };
        document.getElementById('consultation-form').reset();
        document.getElementById('consult-models-container').style.display = 'none';
        document.getElementById('consult-properties-container').style.display = 'none';
        
        renderActiveConsultations();
    });

    // --- ESAMŲ KONSULTACIJŲ AKTYVUS SĄRAŠAS IR LANGO ATIDARYMAS ---
    const renderActiveConsultations = () => {
        // Iš naujo nuskaitome localStorage, kad užtikrintume atnaujintą informaciją
        allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const activeConsults = allConsultations.filter(c => !c.status.includes('Užbaigta'));
        
        activeList.innerHTML = activeConsults.length ? '' : '<p>Aktyvių konsultacijų nerasta.</p>';
        activeConsults.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            card.innerHTML = `
                <h3>Užklausa: "${consult.purpose.substring(0, 50)}..."</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                <button class="btn-secondary" onclick="window.openChatModal(${consult.id})">Tęsti dialogą / Peržiūrėti</button>
            `;
            activeList.appendChild(card);
        });
    };

    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const consult = allConsultations.find(c => c.id === consultationId);
        if (!consult) return;

        modalTitle.textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        chatHistory.innerHTML = '';
        
        consult.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.sender}`;
            // Paverčiame markdown \n į <br> kad gražiai atvaizduotume formatuotą siūlomą apimtį
            const formattedText = msg.text.replace(/\n/g, '<br>');
            msgDiv.innerHTML = `<strong>${msg.sender === 'recipient' ? 'Jūs' : 'Teikėjas'}:</strong><p>${formattedText}</p>`;
            chatHistory.appendChild(msgDiv);
        });

        modal.style.display = 'flex';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    // --- INTERAKTYVŪS ATSAKYMAI DIALOGE ---
    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (!text || !currentConsultationId) return;

        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].messages.push({ sender: 'recipient', text: text });
            allConsultations[consultIndex].status = 'Pateiktas klausimas, laukia teikėjo atsakymo';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            messageInput.value = '';
            openChatModal(currentConsultationId); // Atnaujiname dialogą
            renderActiveConsultations(); // Atnaujiname aktyvų sąrašą
        }
    });

    // --- KONSULTACIJOS UŽBAIGIMAS ---
    finishBtn.addEventListener('click', () => {
        if (!currentConsultationId || !confirm('Ar tikrai norite pažymėti šią konsultaciją kaip užbaigtą?')) return;
        
        const consultIndex = allConsultations.findIndex(c => c.id === currentConsultationId);
        if (consultIndex > -1) {
            allConsultations[consultIndex].status = 'Užbaigta gavėjo';
            localStorage.setItem('consultations', JSON.stringify(allConsultations));
            modal.style.display = 'none';
            renderActiveConsultations();
        }
    });

    // Dialogo uždarymas
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // --- PRADINIS PUSLAPIO UŽKROVIMAS ---
    window.openChatModal = openChatModal;
    renderDatasets();
    renderActiveConsultations();
});
