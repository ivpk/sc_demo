document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENYS (PAGAL PATEIKTĄ .CSV) ---
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
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090", rep: "Martynas Mockus" };

    // --- ELEMENTAI ---
    const form = document.getElementById('agreement-form');
    const datasetsContainer = document.getElementById('datasets-selection');
    const modelsContainer = document.getElementById('models-selection');
    const propertiesContainer = document.getElementById('properties-selection');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const submitBtn = document.getElementById('submit-agreement');
    const sentAgreementsList = document.getElementById('sent-agreements-list'); // Nauja skiltis

    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };

    // --- RENDERINIMO FUNKCIJOS ---
    const renderDatasets = () => { /* ... nepakito ... */ };
    const renderModels = (datasetKey) => { /* ... nepakito ... */ };
    const renderProperties = () => { /* ... nepakito ... */ };

    const renderSentAgreements = () => {
        if (!sentAgreementsList) return;
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        sentAgreementsList.innerHTML = '';

        if (allAgreements.length === 0) {
            sentAgreementsList.innerHTML = '<p>Kol kas nepateikėte jokių sutarčių.</p>';
            return;
        }

        allAgreements.forEach(agreement => {
            let statusClass = 'status-pending';
            let statusText = agreement.status || 'Laukia peržiūros';
            if (statusText === 'Patvirtinta') statusClass = 'status-approved';
            if (statusText === 'Atmesta') statusClass = 'status-rejected';

            const card = document.createElement('div');
            card.className = 'sent-agreement-card';
            card.innerHTML = `
                <div class="sent-agreement-header">
                    <strong>Sutartis su:</strong> ${agreement.assigner['ex:companyName']}
                </div>
                <div class="sent-agreement-body">
                    <p><strong>Statusas:</strong> <span class="${statusClass}">${statusText}</span></p>
                    ${agreement.rejectionReason ? `<p class="rejection-reason"><strong>Atmetimo priežastis:</strong> ${agreement.rejectionReason}</p>` : ''}
                    <p><small>ID: ${agreement.uid.split('/').pop()}</small></p>
                </div>
            `;
            sentAgreementsList.appendChild(card);
        });
    };
    
    // --- PREVIEW FUNKCIJOS ---
    const updatePreview = () => { /* ... nepakito ... */ };
    const getJsonObject = () => {
        const dataset = dataStructure[state.selectedDataset];
        if (!dataset) return null;

        const json = {
            "@context": { "@vocab": "http://www.w3.org/ns/odrl.jsonld", "ex": "http://example.org/vocab#" },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "type": "Agreement",
            "assigner": { "uid": dataset.ownerCode, "ex:companyName": dataset.owner },
            "assignee": { "uid": loggedInUser.code, "ex:companyName": loggedInUser.name, "ex:representative": loggedInUser.rep },
            "permission": [],
            "status": "Pateikta, laukia peržiūros" // Svarbus pridėjimas
        };

        Object.entries(state.selectedProperties).forEach(([modelKey, props]) => {
            if (props.length > 0) {
                const model = dataset.models[modelKey];
                json.permission.push({
                    "target": `${model.uri || 'model'}/${modelKey}`,
                    "action": "read",
                    "constraint": [{
                        "leftOperand": "property", "operator": "in",
                        "rightOperand": props.map(p => model.properties[p]?.uri || p)
                    }]
                });
            }
        });
        return json;
    };
    const updateJsonPreview = () => { /* ... nepakito ... */ };

    // --- ĮVYKIŲ KLAUSYTOJAI ---
    if (form) {
        form.addEventListener('change', (e) => { /* ... nepakito ... */ });
        form.addEventListener('input', updatePreview);
    }

    if (submitBtn) {
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
            
            // Atnaujiname išsiųstų sutarčių sąrašą
            renderSentAgreements();
        });
    }

    // --- PRADINIS PALEIDIMAS ---
    /* ... nepakito, bet pridedame renderSentAgreements() ... */
    renderDatasets();
    updatePreview();
    renderSentAgreements(); // Svarbus pridėjimas
});

// Visos nepakitusios renderinimo funkcijos
document.addEventListener('DOMContentLoaded', () => {
    // ...
    const renderDatasets = () => {
        if (!datasetsContainer) return;
        datasetsContainer.innerHTML = '';
        Object.entries(dataStructure).forEach(([key, ds]) => {
            datasetsContainer.innerHTML += `<div class="dataset-item"><label><input type="radio" name="dataset" value="${key}"> ${ds.title}</label></div>`;
        });
    };

    const renderModels = (datasetKey) => {
        if (!modelsContainer) return;
        const dataset = dataStructure[datasetKey];
        modelsContainer.innerHTML = '';
        Object.keys(dataset.models).forEach(modelKey => {
            modelsContainer.innerHTML += `<div class="model-item"><label><input type="checkbox" name="model" value="${modelKey}"> ${dataset.models[modelKey].title}</label></div>`;
        });
        document.getElementById('models-selection-container').style.display = 'block';
    };

    const renderProperties = () => {
        if (!propertiesContainer) return;
        propertiesContainer.innerHTML = '';
        const dataset = dataStructure[state.selectedDataset];
        if (!dataset) return;
        state.selectedModels.forEach(modelKey => {
            const model = dataset.models[modelKey];
            if (!model) return;
            let propertiesHTML = `<div class="property-group"><h4>${model.title} savybės</h4>`;
            Object.keys(model.properties).forEach(propKey => {
                propertiesHTML += `<label><input type="checkbox" name="property" value="${propKey}" data-model="${modelKey}"><strong>${model.properties[propKey].title}</strong> - <em>${model.properties[propKey].description}</em></label>`;
            });
            propertiesHTML += `</div>`;
            propertiesContainer.innerHTML += propertiesHTML;
        });
        document.getElementById('properties-selection-container').style.display = state.selectedModels.length > 0 ? 'block' : 'none';
    };
    
    // ...
    // Įvykių klausytojai ir kitos funkcijos lieka tokios pačios kaip aukščiau.
});
