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
                        "code": { title: "Kodas", description: "Administracinio vieneto identifikacinis kodas", uri: "cv:code" },
                        "level": { title: "Tipas", description: "Administracinio vieneto tipas (apskritis, savivaldybė, seniūnija)", uri: "cv:level" },
                        "name_gen@lt": { title: "Vardas (kilm.)", description: "Administracinio vieneto vardas kilmininko linksniu", uri: "rdfs:label" }
                    }
                },
                "Location": {
                    title: "Gyvenamoji vietovė",
                    uri: "dct:Location",
                    eli: null,
                    properties: {
                        "code": { title: "Kodas", description: "Gyvenamosios vietovės identifikavimo kodas", uri: "dct:identifier" },
                        "name@lt": { title: "Vardas (vard.)", description: "Gyvenamosios vietovės vardas vardininko linksniu", uri: "locn:geographicName" },
                        "admin_unit": { title: "Administracinis vienetas", description: "Seniūnijos ar savivaldybės, kuriai priklauso, kodas" }
                    }
                },
                "Street": {
                    title: "Gatvė",
                    uri: "dct:Location",
                    eli: null,
                    properties: {
                        "code": { title: "Kodas", description: "Gatvės identifikavimo kodas", uri: "dct:identifier" },
                        "name_gen@lt": { title: "Vardas (kilm.)", description: "Gatvės vardas kilmininko linksniu", uri: "locn:geographicName" },
                        "location": { title: "Gyvenvietė", description: "Gyvenamosios vietovės, kuriai priklauso gatvė, kodas", uri: "locn:location" }
                    }
                }
            }
        }
    };
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090", rep: "Martynas Mockus" }; // PRIDĖTAS rep laukas

    // --- ELEMENTAI ---
    const form = document.getElementById('agreement-form');
    const datasetsContainer = document.getElementById('datasets-selection');
    const modelsContainer = document.getElementById('models-selection');
    const propertiesContainer = document.getElementById('properties-selection');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const submitBtn = document.getElementById('submit-agreement');
    const generatePdfBtn = document.getElementById('generate-pdf'); // Pridėtas mygtukas
    const sentAgreementsList = document.getElementById('sent-agreements-list');

    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };

    // --- UI RENDERINIMO FUNKCIJOS ---
    const renderDatasets = () => {
        if (!datasetsContainer) return;
        datasetsContainer.innerHTML = '';
        Object.entries(dataStructure).forEach(([key, ds]) => {
            datasetsContainer.innerHTML += `
                <div class="dataset-item">
                    <label><input type="radio" name="dataset" value="${key}"> ${ds.title}</label>
                </div>`;
        });
    };

    const renderModels = (datasetKey) => {
        if (!modelsContainer) return;
        const dataset = dataStructure[datasetKey];
        if (!dataset || !dataset.models) return; // Saugumo patikra
        
        modelsContainer.innerHTML = '';
        Object.keys(dataset.models).forEach(modelKey => {
            modelsContainer.innerHTML += `
                <div class="model-item">
                    <label><input type="checkbox" name="model" value="${modelKey}"> ${dataset.models[modelKey].title}</label>
                </div>`;
        });
        const container = document.getElementById('models-selection-container');
        if (container) container.style.display = 'block';
    };

    const renderProperties = () => {
        if (!propertiesContainer) return;
        propertiesContainer.innerHTML = '';
        const dataset = dataStructure[state.selectedDataset];
        if (!dataset || !dataset.models) return; // Saugumo patikra

        state.selectedModels.forEach(modelKey => {
            const model = dataset.models[modelKey];
            if (!model || !model.properties) return; // Saugumo patikra

            let propertiesHTML = `<div class="property-group"><h4>${model.title} savybės</h4>`;
            Object.keys(model.properties).forEach(propKey => {
                const isChecked = state.selectedProperties[modelKey] && state.selectedProperties[modelKey].includes(propKey); // Saugumo patikra
                propertiesHTML += `
                    <label style="display: block; margin-bottom: 5px; font-weight: normal;">
                        <input type="checkbox" name="property" value="${propKey}" data-model="${modelKey}" ${isChecked ? 'checked' : ''}>
                        <strong>${model.properties[propKey].title}</strong> - <em>${model.properties[propKey].description}</em>
                    </label>`;
            });
            propertiesHTML += `</div>`;
            propertiesContainer.innerHTML += propertiesHTML;
        });

        const container = document.getElementById('properties-selection-container');
        if (container) {
            container.style.display = state.selectedModels.length > 0 ? 'block' : 'none';
        }
    };

    const renderSentAgreements = () => {
        if (!sentAgreementsList) return;
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        sentAgreementsList.innerHTML = '';

        if (allAgreements.length === 0) {
            sentAgreementsList.innerHTML = '<p>Kol kas nepateikėte jokių sutarčių.</p>';
            return;
        }

        allAgreements.forEach(agreement => {
            if (!agreement || !agreement.status) return; // Saugumo patikra

            let statusClass = 'status-pending';
            let statusText = agreement.status;
            if (statusText === 'Patvirtinta') statusClass = 'status-approved';
            if (statusText === 'Atmesta') statusClass = 'status-rejected';

            const card = document.createElement('div');
            card.className = 'sent-agreement-card';
            card.innerHTML = `
                <div class="sent-agreement-header">
                    <strong>Sutartis su:</strong> ${(agreement.assigner && agreement.assigner['ex:companyName']) || 'Nežinomas teikėjas'}
                </div>
                <div class="sent-agreement-body">
                    <p><strong>Statusas:</strong> <span class="${statusClass}">${statusText}</span></p>
                    ${agreement.rejectionReason ? `<p class="rejection-reason"><strong>Atmetimo priežastis:</strong> ${agreement.rejectionReason}</p>` : ''}
                    <p><small>ID: ${agreement.uid ? agreement.uid.split('/').pop().substring(0, 10) : 'N/A'}</small></p>
                </div>
            `;
            sentAgreementsList.appendChild(card);
        });
    };
    
    // --- PREVIEW ATNAUJINIMAS ---
    const updatePreview = () => {
        if (!previewEl) return;
        if (!state.selectedDataset) {
            previewEl.textContent = "Pasirinkite duomenų rinkinį kairėje, kad pradėtumėte sutarties generavimą.";
            if (jsonPreviewEl) jsonPreviewEl.textContent = "{}";
            return;
        }

        let agreementText = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date().toLocaleDateString('lt-LT')}\n\n`;
        const dataset = dataStructure[state.selectedDataset];
        
        agreementText += `I. ŠALYS\n1. Teikėjas: ${dataset.owner} (kodas: ${dataset.ownerCode})\n2. Gavėjas: ${loggedInUser.name} (kodas: ${loggedInUser.code})\n\n`;
        agreementText += `III. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${dataset.title}" pagal nurodytą apimtį:\n`;

        if (state.selectedModels.length === 0) {
            agreementText += "- Nepasirinkta jokių konkrečių modelių.\n";
        } else {
            state.selectedModels.forEach(modelKey => {
                const model = dataset.models[modelKey];
                agreementText += `\nModelis: ${model.title}\n`;
                agreementText += `  Aprašymas: Teisė gauti duomenis iš "${model.title}" modelio.\n`;
                if (model.uri) agreementText += `  URI: ${model.uri}\n`;
                if (model.eli) agreementText += `  ELI: ${model.eli}\n`;
                
                const props = state.selectedProperties[modelKey] || [];
                if (props.length > 0) {
                    agreementText += "  Savybės:\n";
                    props.forEach(propKey => {
                        const prop = model.properties[propKey];
                        agreementText += `    - ${prop.title}: ${prop.description}\n`;
                        if (prop.uri) agreementText += `      URI: ${prop.uri}\n`;
                    });
                }
            });
        }
        
        const legalBasisValue = document.getElementById('legalBasis')?.value || 'Nurodytas įstatyme';
        const purposeValue = document.getElementById('dataPurpose')?.value || 'Veiklos vykdymui';
        
        agreementText += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${legalBasisValue}\nTikslas: ${purposeValue}`;
        previewEl.textContent = agreementText;
        updateJsonPreview();
    };

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
                const permission = {
                    "target": `${model.uri || 'model'}/${modelKey}`,
                    "action": "read",
                    "constraint": [{
                        "leftOperand": "property",
                        "operator": "in",
                        "rightOperand": props.map(p => model.properties[p]?.uri || p)
                    }]
                };
                json.permission.push(permission);
            }
        });
        return json;
    };

    const updateJsonPreview = () => {
        if (jsonPreviewEl) {
            jsonPreviewEl.textContent = JSON.stringify(getJsonObject(), null, 2);
        }
    };

    // --- ĮVYKIŲ KLAUSYTOJAI ---
    if (form) {
        form.addEventListener('change', (e) => {
            const target = e.target;
            const name = target.name;
            const value = target.value;
            const checked = target.checked;
            
            if (name === 'dataset') {
                state = { selectedDataset: value, selectedModels: [], selectedProperties: {} };
                const assignerInput = document.getElementById('assignerName');
                const assignerCodeInput = document.getElementById('assignerCode');
                if (assignerInput) assignerInput.value = dataStructure[value].owner;
                if (assignerCodeInput) assignerCodeInput.value = dataStructure[value].ownerCode;
                renderModels(value);
                renderProperties();
            }
            
            if (name === 'model') {
                if (checked) {
                    state.selectedModels.push(value);
                    state.selectedProperties[value] = [];
                } else {
                    state.selectedModels = state.selectedModels.filter(m => m !== value);
                    delete state.selectedProperties[value];
                }
                renderProperties();
            }

            if (name === 'property') {
                const modelKey = target.getAttribute('data-model');
                if (checked) {
                    if (!state.selectedProperties[modelKey]) state.selectedProperties[modelKey] = []; // Apsauga
                    state.selectedProperties[modelKey].push(value);
                } else {
                    if (state.selectedProperties[modelKey]) { // Apsauga
                        state.selectedProperties[modelKey] = state.selectedProperties[modelKey].filter(p => p !== value);
                    }
                }
            }
            
            updatePreview();
        });
        
        form.addEventListener('input', updatePreview);
    }

    // --- SUTARTIES PATEIKIMO INTERAKCIJA ---
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (!state.selectedDataset || state.selectedModels.length === 0) {
                alert('Pasirinkite duomenų rinkinį ir bent vieną modelį prieš pateikiant sutartį.');
                return;
            }
            const newAgreement = getJsonObject();
            if (!newAgreement) { // Apsauga jei getJsonObject grąžina null
                alert('Nepavyko sugeneruoti sutarties. Patikrinkite pasirinkimus.');
                return;
            }
            const existingAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
            existingAgreements.push(newAgreement);
            localStorage.setItem('agreements', JSON.stringify(existingAgreements));
            alert('Sutartis sėkmingai pateikta! Ją dabar galite peržiūrėti "Teikėjo aplinkoje".');
            
            renderSentAgreements();
        });
    }

    // --- PDF GENERAVIMAS ---
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', () => {
            if (!state.selectedDataset) {
                alert('Sutartis tuščia. Pasirinkite rinkinį.');
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const text = previewEl.innerText;
            const lines = doc.splitTextToSize(text, 180);
            doc.text(lines, 15, 15);
            doc.save(`Duomenu_Teikimo_Sutartis_${Date.now()}.pdf`);
        });
    }

    // --- PRADINIS PALEIDIMAS ---
    const assigneeInput = document.getElementById('assigneeName');
    const assigneeCodeInput = document.getElementById('assigneeCode');
    const assigneeRepInput = document.getElementById('assigneeRep');
    if (assigneeInput) assigneeInput.value = loggedInUser.name;
    if (assigneeCodeInput) assigneeCodeInput.value = loggedInUser.code;
    if (assigneeRepInput) assigneeRepInput.value = loggedInUser.rep; // Naudojame rep

    renderDatasets();
    updatePreview();
    renderSentAgreements();
});
