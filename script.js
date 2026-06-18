document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENŲ STRUKTŪRA SU DVIEM RINKINIAIS ---
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": {
            id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", properties: { "code": { title: "Kodas", description: "Administracinio vieneto ID", uri: "cv:code" }, "level": { title: "Tipas", description: "Vieneto tipas (apskritis, savivaldybė)", uri: "cv:level" }, "name_gen@lt": { title: "Vardas", description: "Vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } },
                "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės ID", uri: "dct:identifier" }, "name@lt": { title: "Vardas", description: "Gyvenamosios vietovės vardas", uri: "locn:geographicName" } } }
            }
        },
        "datasets/gov/rc/jar/at4020_trumpas_israsas": {
            id: 3987, title: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "JuridinisAsmuo": { title: "Juridinis asmuo", uri: "rc:JuridinisAsmuo", properties: { "kodas": { title: "Kodas", description: "Juridinio asmens kodas", uri: "rc:kodas" }, "pavadinimas@lt": { title: "Pavadinimas", description: "Juridinio asmens pavadinimas", uri: "rc:pavadinimas" }, "statusas": { title: "Statusas", description: "Teisinio statuso kodas", uri: "rc:statusas" } } },
                "Adresas": { title: "Adresas (JAR)", uri: "rc:Adresas", properties: { "adresas_txt@lt": { title: "Adresas (tekstu)", description: "Juridinio asmens buveinės adresas", uri: "rc:adresas_txt" }, "busena": { title: "Būsena", description: "Adreso būsena registre", uri: "rc:busena" } } }
            }
        }
    };
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090" };
    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };

    // --- ELEMENTAI ---
    const form = document.getElementById('agreement-form');
    const datasetsContainer = document.getElementById('datasets-selection');
    const modelsContainer = document.getElementById('models-selection');
    const propertiesContainer = document.getElementById('properties-selection');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const submitBtn = document.getElementById('submit-agreement');
    const sentAgreementsList = document.getElementById('sent-agreements-list');
    const agreementModal = document.getElementById('agreement-view-modal');

    // --- BENDRA SUTARTIES TEKSTO GENERAVIMO FUNKCIJA ---
    const generateAgreementText = (agreement) => {
        if (!agreement || !agreement.assigner) return "Trūksta sutarties duomenų.";
        const datasetKey = Object.keys(dataStructure).find(key => dataStructure[key].ownerCode === agreement.assigner.uid);
        const datasetInfo = dataStructure[datasetKey];
        if (!datasetInfo) return "Klaida: Duomenų rinkinys nerastas.";

        let text = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        text += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner['ex:companyName']}\n2. Gavėjas: ${agreement.assignee['ex:companyName']}\n\n`;
        text += `II. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${datasetInfo.title}" pagal nurodytą apimtį:\n`;
        (agreement.permission || []).forEach(perm => {
            const modelKey = perm.target.split('/')[1];
            const model = datasetInfo.models[modelKey];
            if (model) {
                text += `\nModelis: ${model.title} (URI: ${model.uri})\n`;
                const props = perm.constraint[0].rightOperand;
                props.forEach(propUri => {
                    const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                    if (propKey) text += `    - ${model.properties[propKey].title}: ${model.properties[propKey].description}\n`;
                });
            }
        });
        text += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${agreement.legalBasis || 'Nenurodyta'}\nTikslas: ${agreement.dataPurpose || 'Nenurodyta'}`;
        return text;
    };
    
    // --- GAVĖJO APLINKOS FUNKCIJOS ---
    const renderDatasets = () => {
        if (!datasetsContainer) return;
        datasetsContainer.innerHTML = '';
        Object.entries(dataStructure).forEach(([key, ds]) => {
            datasetsContainer.innerHTML += `<div class="dataset-item"><label><input type="radio" name="dataset" value="${key}"><span>${ds.title}</span></label></div>`;
        });
    };

    const renderModels = (datasetKey) => {
        if (!modelsContainer || !dataStructure[datasetKey]) return;
        const dataset = dataStructure[datasetKey];
        modelsContainer.innerHTML = '';
        Object.keys(dataset.models).forEach(modelKey => {
            modelsContainer.innerHTML += `<div class="model-item"><label><input type="checkbox" name="model" value="${modelKey}"><span>${dataset.models[modelKey].title}</span></label></div>`;
        });
        document.getElementById('models-selection-container').style.display = 'block';
    };

    const renderProperties = () => {
        if (!propertiesContainer || !state.selectedDataset) return;
        const dataset = dataStructure[state.selectedDataset];
        propertiesContainer.innerHTML = '';
        state.selectedModels.forEach(modelKey => {
            const model = dataset.models[modelKey];
            if (!model) return;
            let propertiesHTML = `<div class="property-group"><h4>${model.title} savybės</h4>`;
            Object.keys(model.properties).forEach(propKey => {
                propertiesHTML += `<label><input type="checkbox" name="property" value="${propKey}" data-model="${modelKey}"><strong>${model.properties[propKey].title}</strong><em> - ${model.properties[propKey].description}</em></label>`;
            });
            propertiesHTML += `</div>`;
            propertiesContainer.innerHTML += propertiesHTML;
        });
        document.getElementById('properties-selection-container').style.display = state.selectedModels.length > 0 ? 'block' : 'none';
    };

    const updatePreview = () => {
        const agreementObject = getJsonObject();
        previewEl.textContent = generateAgreementText(agreementObject) || "Pasirinkite duomenų rinkinį...";
        jsonPreviewEl.textContent = JSON.stringify(agreementObject, null, 2);
    };

    const getJsonObject = () => {
        if (!state.selectedDataset) return null;
        const dataset = dataStructure[state.selectedDataset];
        const json = {
            uid: `https://data.gov.lt/ID/Agreement/${Date.now()}`, type: "Agreement",
            assigner: { uid: dataset.ownerCode, "ex:companyName": dataset.owner },
            assignee: { uid: loggedInUser.code, "ex:companyName": loggedInUser.name },
            status: "Laukia peržiūros", legalBasis: form.legalBasis.value, dataPurpose: form.dataPurpose.value,
            permission: []
        };
        Object.entries(state.selectedProperties).forEach(([modelKey, props]) => {
            if (props.length > 0) {
                json.permission.push({
                    target: `${dataset.models[modelKey].uri || 'model'}/${modelKey}`,
                    constraint: [{ rightOperand: props.map(p => dataset.models[modelKey].properties[p]?.uri || p) }]
                });
            }
        });
        return json;
    };
    
    const renderSentAgreements = () => {
        if (!sentAgreementsList) return;
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        sentAgreementsList.innerHTML = allAgreements.length ? '' : '<p>Kol kas nepateikėte jokių sutarčių.</p>';
        allAgreements.forEach(agreement => {
            if (!agreement) return;
            const statusClass = agreement.status === 'Sutarties projektas patvirtintas' ? 'status-approved' : agreement.status === 'Atmesta' ? 'status-rejected' : 'status-pending';
            const card = document.createElement('div');
            card.className = 'sent-agreement-card';
            card.innerHTML = `
                <div class="sent-agreement-header"><strong>Sutartis su:</strong> ${agreement.assigner['ex:companyName']}</div>
                <div class="sent-agreement-body">
                    <p><strong>Statusas:</strong> <span class="${statusClass}">${agreement.status}</span></p>
                    ${agreement.rejectionReason ? `<p class="rejection-reason"><strong>Priežastis:</strong> ${agreement.rejectionReason}</p>` : ''}
                    <button class="btn-secondary" style="width:auto; padding: 5px 10px; font-size: 0.8rem; margin-top: 5px;" onclick="window.openAgreementModal('${agreement.uid}')">Peržiūrėti</button>
                </div>`;
            sentAgreementsList.appendChild(card);
        });
    };

    const openAgreementModal = (uid) => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreement = allAgreements.find(a => a.uid === uid);
        if (!agreement || !agreementModal) return;
        document.getElementById('modal-agreement-text').textContent = generateAgreementText(agreement);
        document.getElementById('modal-agreement-json').textContent = JSON.stringify(agreement, null, 2);
        agreementModal.style.display = 'flex';
    };

    // --- ĮVYKIŲ KLAUSYTOJAI ---
    form.addEventListener('change', (e) => {
        const { name, value, checked, dataset: elDataset } = e.target;
        if (name === 'dataset') {
            state = { selectedDataset: value, selectedModels: [], selectedProperties: {} };
            form.assignerName.value = dataStructure[value].owner;
            renderModels(value);
            renderProperties();
        } else if (name === 'model') {
            state.selectedModels = [...form.querySelectorAll('[name="model"]:checked')].map(el => el.value);
            state.selectedModels.forEach(m => { if (!state.selectedProperties[m]) state.selectedProperties[m] = []; });
            renderProperties();
        } else if (name === 'property') {
            const modelKey = elDataset.model;
            state.selectedProperties[modelKey] = [...form.querySelectorAll(`[name="property"][data-model="${modelKey}"]:checked`)].map(el => el.value);
        }
        updatePreview();
    });
    form.addEventListener('input', updatePreview);

    submitBtn.addEventListener('click', () => {
        if (!state.selectedDataset || state.selectedModels.length === 0) {
            alert('Pasirinkite duomenų rinkinį ir bent vieną modelį.');
            return;
        }
        const newAgreement = getJsonObject();
        const existingAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        existingAgreements.push(newAgreement);
        localStorage.setItem('agreements', JSON.stringify(existingAgreements));
        alert('Sutartis sėkmingai pateikta!');
        renderSentAgreements();
    });
    
    document.getElementById('close-agreement-modal-btn').addEventListener('click', () => agreementModal.style.display = 'none');
    window.onclick = (event) => { if (event.target == agreementModal) agreementModal.style.display = 'none'; };

    // --- PRADINIS PALEIDIMAS ---
    form.assigneeName.value = loggedInUser.name;
    window.openAgreementModal = openAgreementModal;
    renderDatasets();
    updatePreview();
    renderSentAgreements();
});
