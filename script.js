document.addEventListener('DOMContentLoaded', () => {
    // --- DEMO DUOMENYS ---
    const demoDatasets = [
        { id: 3987, name: "Juridinių asmenų registro duomenys (RAW data)", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/jar/imones/:getall,uapi:/jar/imones/:search" },
        { id: 4071, name: "Adresų registro gatvių tekstinių duomenų rinkinys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/ar/gatves/:getall,uapi:/ar/gatves/:select" },
    ];
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090", representative: "Martynas Mockus" };

    // --- ELEMENTAI ---
    const form = document.getElementById('agreement-form');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const searchInput = document.getElementById('dataset-search');
    const datasetsContainer = document.getElementById('datasets-selection');
    const submitBtn = document.getElementById('submit-agreement');

    // --- ŠABLONAS ---
    const agreementTemplate = `
AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS
Data: [currentDate]

I SKYRIUS: ŠALYS IR PAGRINDAS
1. Duomenų teikėjas: [assignerName] (kodas: [assignerCode])
2. Duomenų gavėjas: [assigneeName] (kodas: [assigneeCode]), atstovaujamas [assigneeRep].
3. Teisinis pagrindas: [legalBasis]
4. Tvarkymo tikslas: [dataPurpose]

II SKYRIUS: OBJEKTAS
Sutarties objektas:
[datasets]

III SKYRIUS: SĄLYGOS
Atsiskaitymo tvarka: [paymentTerms].
...
    `;

    const renderDatasets = (datasets) => {
        datasetsContainer.innerHTML = datasets.length ? '' : '<p>Nerasta.</p>';
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'dataset-item';
            div.innerHTML = `<label><input type="checkbox" class="dataset-check" value="${ds.id}" data-name="${ds.name}" data-scopes="${ds.scopes}" data-owner-name="${ds.owner}" data-owner-code="${ds.ownerCode}"> ${ds.name}</label>`;
            datasetsContainer.appendChild(div);
        });
    };

    const updatePreview = () => {
        let renderedTemplate = agreementTemplate;
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const placeholder = `\\[${input.id}\\]`;
            renderedTemplate = renderedTemplate.replace(new RegExp(placeholder, 'g'), input.value || '');
        });
        const selectedDatasets = Array.from(document.querySelectorAll('.dataset-check:checked')).map(cb => `- ${cb.dataset.name}`).join('\n');
        renderedTemplate = renderedTemplate.replace('[datasets]', selectedDatasets || 'Nepasirinkta.');
        renderedTemplate = renderedTemplate.replace(/\[currentDate\]/g, new Date().toLocaleDateString('lt-LT'));
        previewEl.textContent = renderedTemplate;
        updateJsonPreview();
    };

    const getJsonObject = () => {
        return {
            "@context": { "@vocab": "http://www.w3.org/ns/odrl.jsonld", "ex": "http://example.org/vocab#" },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "type": "Agreement",
            "assigner": [{ "uid": document.getElementById('assignerCode').value, "ex:companyName": document.getElementById('assignerName').value }],
            "assignee": [{ "uid": loggedInUser.code, "ex:companyName": loggedInUser.name, "ex:representative": loggedInUser.representative }],
            "ex:legalBasis": document.getElementById('legalBasis').value,
            "permission": Array.from(document.querySelectorAll('.dataset-check:checked')).map(cb => ({
                "target": { "uid": parseInt(cb.value), "ex:name": cb.dataset.name, "ex:scopes": cb.dataset.scopes.split(',') },
                "constraint": [{"leftOperand": "purpose", "operator": "eq", "rightOperand": document.getElementById('dataPurpose').value}]
            })),
            "ex:paymentTerms": document.getElementById('paymentTerms').value
        };
    };
    
    const updateJsonPreview = () => {
        jsonPreviewEl.textContent = JSON.stringify(getJsonObject(), null, 2);
    };

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderDatasets(demoDatasets.filter(ds => ds.name.toLowerCase().includes(query)));
    });

    form.addEventListener('input', updatePreview);
    form.addEventListener('change', (e) => {
        if (e.target.classList.contains('dataset-check')) {
            const firstChecked = form.querySelector('.dataset-check:checked');
            document.getElementById('assignerName').value = firstChecked ? firstChecked.dataset.ownerName : '';
            document.getElementById('assignerCode').value = firstChecked ? firstChecked.dataset.ownerCode : '';
        }
        updatePreview();
    });

    submitBtn.addEventListener('click', () => {
        const newAgreement = getJsonObject();
        const existingAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        existingAgreements.push(newAgreement);
        localStorage.setItem('agreements', JSON.stringify(existingAgreements));
        alert('Sutartis sėkmingai pateikta! Galite ją peržiūrėti "Teikėjo aplinkoje".');
    });

    // Pradinis užkrovimas
    document.getElementById('assigneeName').value = loggedInUser.name;
    document.getElementById('assigneeCode').value = loggedInUser.code;
    document.getElementById('assigneeRep').value = loggedInUser.representative;
    renderDatasets(demoDatasets);
    updatePreview();
});
