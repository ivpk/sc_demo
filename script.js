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
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090" };

    // --- ELEMENTAI ---
    const form = document.getElementById('agreement-form');
    const datasetsContainer = document.getElementById('datasets-selection');
    const modelsContainer = document.getElementById('models-selection');
    const propertiesContainer = document.getElementById('properties-selection');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');

    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };

    // --- UI RENDERINIMO FUNKCIJOS ---
    const renderDatasets = () => {
        datasetsContainer.innerHTML = '';
        Object.entries(dataStructure).forEach(([key, ds]) => {
            datasetsContainer.innerHTML += `
                <div class="dataset-item">
                    <label><input type="radio" name="dataset" value="${key}"> ${ds.title}</label>
                </div>`;
        });
    };

    const renderModels = (datasetKey) => {
        const dataset = dataStructure[datasetKey];
        modelsContainer.innerHTML = '';
        Object.keys(dataset.models).forEach(modelKey => {
            modelsContainer.innerHTML += `
                <div class="model-item">
                    <label><input type="checkbox" name="model" value="${modelKey}"> ${dataset.models[modelKey].title}</label>
                </div>`;
        });
        document.getElementById('models-selection-container').style.display = 'block';
    };

    const renderProperties = () => {
        propertiesContainer.innerHTML = '';
        const dataset = dataStructure[state.selectedDataset];
        state.selectedModels.forEach(modelKey => {
            const model = dataset.models[modelKey];
            let propertiesHTML = `<div class="property-group"><h4>${model.title}</h4>`;
            Object.keys(model.properties).forEach(propKey => {
                const isChecked = state.selectedProperties[modelKey]?.includes(propKey);
                propertiesHTML += `
                    <label>
                        <input type="checkbox" name="property" value="${propKey}" data-model="${modelKey}" ${isChecked ? 'checked' : ''}>
                        ${model.properties[propKey].title}
                    </label>`;
            });
            propertiesHTML += `</div>`;
            propertiesContainer.innerHTML += propertiesHTML;
        });
        document.getElementById('properties-selection-container').style.display = state.selectedModels.length > 0 ? 'block' : 'none';
    };
    
    // --- PREVIEW ATNAUJINIMAS ---
    const updatePreview = () => {
        let agreementText = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date().toLocaleDateString('lt-LT')}\n\n`;
        const dataset = dataStructure[state.selectedDataset];
        
        agreementText += `I. ŠALYS\n1. Teikėjas: ${dataset.owner} (kodas: ${dataset.ownerCode})\n2. Gavėjas: ${loggedInUser.name} (kodas: ${loggedInUser.code})\n\n`;
        agreementText += `II. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${dataset.title}" pagal nurodytą apimtį:\n`;

        if (state.selectedModels.length === 0) {
            agreementText += "- Nepasirinkta jokių modelių.\n";
        } else {
            state.selectedModels.forEach(modelKey => {
                const model = dataset.models[modelKey];
                agreementText += `\nModelis: ${model.title}\n`;
                agreementText += `  Aprašymas: Teisė gauti duomenis iš "${model.title}" modelio.\n`;
                agreementText += model.uri ? `  URI: ${model.uri}\n` : '';
                agreementText += model.eli ? `  ELI: ${model.eli}\n` : '';
                
                const props = state.selectedProperties[modelKey] || [];
                if (props.length > 0) {
                    agreementText += "  Savybės:\n";
                    props.forEach(propKey => {
                        const prop = model.properties[propKey];
                        agreementText += `    - ${prop.title}: ${prop.description}\n`;
                        agreementText += prop.uri ? `      URI: ${prop.uri}\n` : '';
                    });
                }
            });
        }
        
        agreementText += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${form.legalBasis.value}\nTikslas: ${form.dataPurpose.value}`;
        previewEl.textContent = agreementText;
        updateJsonPreview();
    };

    const updateJsonPreview = () => {
        const dataset = dataStructure[state.selectedDataset];
        const json = {
            "@context": { "@vocab": "http://www.w3.org/ns/odrl.jsonld", "ex": "http://example.org/vocab#" },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "type": "Agreement",
            "assigner": { "uid": dataset.ownerCode, "ex:companyName": dataset.owner },
            "assignee": { "uid": loggedInUser.code, "ex:companyName": loggedInUser.name },
            "permission": []
        };

        Object.entries(state.selectedProperties).forEach(([modelKey, props]) => {
            if (props.length > 0) {
                const model = dataset.models[modelKey];
                const permission = {
                    "target": `${model.uri}/${modelKey}`,
                    "action": "read",
                    "constraint": [{
                        "leftOperand": "property",
                        "operator": "in",
                        "rightOperand": props.map(p => model.properties[p].uri || p)
                    }]
                };
                json.permission.push(permission);
            }
        });
        jsonPreviewEl.textContent = JSON.stringify(json, null, 2);
    };

    // --- ĮVYKIŲ KLAUSYTOJAI ---
    form.addEventListener('change', (e) => {
        const { name, value, checked, dataset: elDataset } = e.target;
        
        if (name === 'dataset') {
            state = { selectedDataset: value, selectedModels: [], selectedProperties: {} };
            document.getElementById('assignerName').value = dataStructure[value].owner;
            renderModels(value);
            renderProperties(); // Paslepia savybes
        }
        
        if (name === 'model') {
            if (checked) {
                state.selectedModels.push(value);
                state.selectedProperties[value] = []; // Initialize
            } else {
                state.selectedModels = state.selectedModels.filter(m => m !== value);
                delete state.selectedProperties[value];
            }
            renderProperties();
        }

        if (name === 'property') {
            const modelKey = elDataset.model;
            if (checked) {
                state.selectedProperties[modelKey].push(value);
            } else {
                state.selectedProperties[modelKey] = state.selectedProperties[modelKey].filter(p => p !== value);
            }
        }
        
        updatePreview();
    });
    form.addEventListener('input', updatePreview);

    // --- PRADINIS PALEIDIMAS ---
    document.getElementById('assigneeName').value = `${loggedInUser.name} (kodas: ${loggedInUser.code})`;
    renderDatasets();
});
