document.addEventListener('DOMContentLoaded', () => {
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": { id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", models: { "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", properties: { "code": { title: "Kodas", description: "Administracinio vieneto ID", uri: "cv:code" }, "level": { title: "Tipas", description: "Vieneto tipas (apskritis, savivaldybė)", uri: "cv:level" }, "name_gen@lt": { title: "Vardas", description: "Vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } }, "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės ID", uri: "dct:identifier" }, "name@lt": { title: "Vardas", description: "Gyvenamosios vietovės vardas", uri: "locn:geographicName" } } } } },
        "datasets/gov/rc/jar/at4020_trumpas_israsas": { id: 3987, title: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", models: { "JuridinisAsmuo": { title: "Juridinis asmuo", uri: "rc:JuridinisAsmuo", properties: { "kodas": { title: "Kodas", description: "Juridinio asmens kodas", uri: "rc:kodas" }, "pavadinimas@lt": { title: "Pavadinimas", description: "Juridinio asmens pavadinimas", uri: "rc:pavadinimas" }, "statusas": { title: "Statusas", description: "Teisinio statuso kodas", uri: "rc:statusas" } } }, "Adresas": { title: "Adresas (JAR)", uri: "rc:Adresas", properties: { "adresas_txt@lt": { title: "Adresas (tekstu)", description: "Juridinio asmens buveinės adresas", uri: "rc:adresas_txt" }, "busena": { title: "Būsena", description: "Adreso būsena registre", uri: "rc:busena" } } } } }
    };
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090" };
    let state = { selectedDatasets: [], selectedModels: [], selectedProperties: {} };

    const form = document.getElementById('agreement-form');
    const datasetsContainer = document.getElementById('datasets-selection');
    const modelsContainer = document.getElementById('models-selection');
    const propertiesContainer = document.getElementById('properties-selection');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const submitBtn = document.getElementById('submit-agreement');
    const sentAgreementsList = document.getElementById('sent-agreements-list');
    const agreementModal = document.getElementById('agreement-view-modal');

    const groupPermissionsByDataset = (permissions) => {
        const grouped = {};
        (permissions || []).forEach(perm => {
            const modelUri = perm.target.split('/')[0];
            const datasetKey = Object.keys(dataStructure).find(key => {
                const models = dataStructure[key].models;
                return Object.values(models).some(m => m.uri === modelUri);
            });
            if (datasetKey) {
                if (!grouped[datasetKey]) grouped[datasetKey] = [];
                grouped[datasetKey].push(perm);
            }
        });
        return grouped;
    };

    const generateAgreementText = (agreement) => {
        if (!agreement) return "Trūksta sutarties duomenų.";
        let text = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        text += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner['ex:companyName']}\n2. Gavėjas: ${agreement.assignee['ex:companyName']}\n\n`;
        text += `II. OBJEKTAS\nSuteikiama prieiga prie šių duomenų rinkinių:\n`;

        const permissionsByDataset = groupPermissionsByDataset(agreement.permission);

        Object.entries(permissionsByDataset).forEach(([datasetKey, permissions]) => {
            const datasetInfo = dataStructure[datasetKey];
            if (datasetInfo) {
                text += `\n--- DUOMENŲ RINKINYS: ${datasetInfo.title} ---\n`;
                permissions.forEach(perm => {
                    const modelKey = perm.target.split('/')[1];
                    const model = datasetInfo.models[modelKey];
                    if (model) {
                        text += `\n  Modelis: ${model.title}\n`;
                        const props = perm.constraint[0].rightOperand;
                        props.forEach(propUri => {
                            const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                            if (propKey) text += `    - ${model.properties[propKey].title}: ${model.properties[propKey].description}\n`;
                        });
                    }
                });
            }
        });
        text += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${agreement.legalBasis || 'Nenurodyta'}\nTikslas: ${agreement.dataPurpose || 'Nenurodyta'}`;
        return text;
    };
    
    const renderDatasets = () => {
        datasetsContainer.innerHTML = Object.entries(dataStructure).map(([key, ds]) => `<div class="dataset-item"><label><input type="checkbox" name="dataset" value="${key}"><span>${ds.title}</span></label></div>`).join('');
    };

    const renderModels = () => {
        modelsContainer.innerHTML = '';
        state.selectedDatasets.forEach(datasetKey => {
            const dataset = dataStructure[datasetKey];
            modelsContainer.innerHTML += `<h4 class="selection-group-title">${dataset.title}</h4>`;
            Object.keys(dataset.models).forEach(modelKey => {
                const modelId = `${datasetKey}|${modelKey}`;
                const isChecked = state.selectedModels.includes(modelId);
                modelsContainer.innerHTML += `<div class="model-item"><label><input type="checkbox" name="model" value="${modelId}" ${isChecked ? 'checked' : ''}><span>${modelKey} (${dataset.models[modelKey].title})</span></label></div>`;
            });
        });
        document.getElementById('models-selection-container').style.display = state.selectedDatasets.length > 0 ? 'block' : 'none';
    };

    const renderProperties = () => {
        propertiesContainer.innerHTML = '';
        state.selectedModels.forEach(modelId => {
            const [datasetKey, modelKey] = modelId.split('|');
            const model = dataStructure[datasetKey].models[modelKey];
            let propertiesHTML = `<div class="property-group"><h4>${model.title} savybės</h4>`;
            Object.keys(model.properties).forEach(propKey => {
                const isChecked = state.selectedProperties[modelId] && state.selectedProperties[modelId].includes(propKey);
                propertiesHTML += `<label><input type="checkbox" name="property" value="${propKey}" data-model-id="${modelId}" ${isChecked ? 'checked' : ''}><strong>${model.properties[propKey].title}</strong><em> - ${model.properties[propKey].description}</em></label>`;
            });
            propertiesHTML += `</div>`;
            propertiesContainer.innerHTML += propertiesHTML;
        });
        document.getElementById('properties-selection-container').style.display = state.selectedModels.length > 0 ? 'block' : 'none';
    };

    const getJsonObject = () => {
        if (state.selectedDatasets.length === 0) return null;
        const json = {
            uid: `https://data.gov.lt/ID/Agreement/${Date.now()}`, type: "Agreement",
            assigner: { uid: "124110246", "ex:companyName": "Valstybės įmonė Registrų centras" },
            assignee: { uid: loggedInUser.code, "ex:companyName": loggedInUser.name },
            status: "Laukia peržiūros", legalBasis: form.legalBasis.value, dataPurpose: form.dataPurpose.value,
            permission: []
        };
        Object.entries(state.selectedProperties).forEach(([modelId, props]) => {
            if (props.length > 0) {
                const [datasetKey, modelKey] = modelId.split('|');
                const model = dataStructure[datasetKey].models[modelKey];
                json.permission.push({
                    target: `${model.uri || 'model'}/${modelKey}`,
                    constraint: [{ rightOperand: props.map(p => model.properties[p]?.uri || p) }]
                });
            }
        });
        return json;
    };

    const updatePreview = () => {
        const agreementObject = getJsonObject();
        previewEl.textContent = generateAgreementText(agreementObject) || "Pasirinkite duomenų rinkinį...";
        jsonPreviewEl.textContent = JSON.stringify(agreementObject, null, 2);
    };

    const renderSentAgreements = () => { /* ... (nepakito) ... */ };
    const openAgreementModal = (uid) => { /* ... (nepakito) ... */ };
    
    form.addEventListener('change', (e) => {
        const { name, value, checked } = e.target;
        if (name === 'dataset') {
            state.selectedDatasets = [...form.querySelectorAll('[name="dataset"]:checked')].map(el => el.value);
            const modelsToRemove = state.selectedModels.filter(m => !state.selectedDatasets.includes(m.split('|')[0]));
            modelsToRemove.forEach(m => delete state.selectedProperties[m]);
            state.selectedModels = state.selectedModels.filter(m => !modelsToRemove.includes(m));
        } else if (name === 'model') {
            state.selectedModels = [...form.querySelectorAll('[name="model"]:checked')].map(el => el.value);
            Object.keys(state.selectedProperties).forEach(m => { if (!state.selectedModels.includes(m)) delete state.selectedProperties[m]; });
        } else if (name === 'property') {
            const modelId = e.target.getAttribute('data-model-id');
            if (checked) {
                if (!state.selectedProperties[modelId]) state.selectedProperties[modelId] = [];
                state.selectedProperties[modelId].push(value);
            } else {
                state.selectedProperties[modelId] = state.selectedProperties[modelId].filter(p => p !== value);
            }
        }
        renderModels();
        renderProperties();
        updatePreview();
    });
    
    submitBtn.addEventListener('click', () => { /* ... (nepakito) ... */ });
    document.getElementById('close-agreement-modal-btn').addEventListener('click', () => agreementModal.style.display = 'none');
    window.onclick = (event) => { if (event.target == agreementModal) agreementModal.style.display = 'none'; };

    form.assigneeName.value = loggedInUser.name;
    window.openAgreementModal = openAgreementModal;
    renderDatasets();
    updatePreview();
    renderSentAgreements();
});
