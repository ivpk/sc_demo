document.addEventListener('DOMContentLoaded', () => {
    // --- BENDRIEJI NUSTATYMAI IR DUOMENYS ---
    const demoDatasets = [
        { id: 3987, name: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/jar/imones/:getall" },
        { id: 4071, name: "Adresų registro gatvių duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/ar/gatves/:getall" }
    ];
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090", representative: "Martynas Mockus" };
    let currentRole = 'recipient'; // Numatytasis vaidmuo

    // --- ELEMENTŲ NUORODOS ---
    const roleSwitcher = document.getElementById('role-switcher');
    const headerTitle = document.getElementById('header-title');
    // Gavėjo aplinkos elementai
    const form = document.getElementById('agreement-form');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const searchInput = document.getElementById('dataset-search');
    const datasetsContainer = document.getElementById('datasets-selection');

    // --- PAGRINDINĖ FUNKCIJA: APLINKOS PERJUNGIMAS ---
    const switchRole = (newRole) => {
        currentRole = newRole;

        // 1. Atnaujiname mygtukų būseną
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-role') === newRole);
        });

        // 2. Atnaujiname puslapio antraštę
        const titles = {
            recipient: "Išmaniųjų duomenų sutarčių modulis (Gavėjo aplinka)",
            provider: "Išmaniųjų duomenų sutarčių modulis (Teikėjo aplinka)",
            vssa: "Išmaniųjų duomenų sutarčių modulis (VSSA Administratorius)"
        };
        headerTitle.textContent = titles[newRole];

        // 3. Parodome tik reikiamą aplinkos vaizdą
        document.querySelectorAll('.role-view').forEach(view => {
            view.classList.toggle('active', view.id === `view-${newRole}`);
        });
    };

    // Priskiriame perjungimo logiką mygtukams
    roleSwitcher.addEventListener('click', (e) => {
        const roleButton = e.target.closest('.role-btn');
        if (roleButton) {
            const newRole = roleButton.getAttribute('data-role');
            switchRole(newRole);
        }
    });

    // --- SUTARTIES RENGIMO FUNKCIONALUMAS (GAVĖJO APLINKOJE) ---
    // Pilnas sutarties tekstas
    const agreementTemplate = `
AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS
Data: [currentDate]

I SKYRIUS: ŠALYS IR PAGRINDAS
1. Duomenų teikėjas: [assignerName] (kodas: [assignerCode])
2. Duomenų gavėjas: [assigneeName] (kodas: [assigneeCode]), atstovaujamas [assigneeRep].
3. Teisinis pagrindas: [legalBasis]
4. Tvarkymo tikslas: [dataPurpose]

II SKYRIUS: OBJEKTAS
Sutarties objektas – automatizuotas duomenų teikimas. Duomenys, patenkantys į sutarties sritį:
[datasets]

III SKYRIUS: SĄLYGOS
Atsiskaitymo tvarka: [paymentTerms].
(kitos sutarties dalys...)
    `;

    // Duomenų rinkinių atvaizdavimas
    const renderDatasets = (datasets) => {
        datasetsContainer.innerHTML = datasets.length ? '' : '<p>Nerasta.</p>';
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'dataset-item';
            div.innerHTML = `<label><input type="checkbox" class="dataset-check" value="${ds.id}" data-name="${ds.name}" data-scopes="${ds.scopes}" data-owner-name="${ds.owner}" data-owner-code="${ds.ownerCode}"> ${ds.name}</label>`;
            datasetsContainer.appendChild(div);
        });
    };

    // Dinaminis paieškos filtras
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderDatasets(demoDatasets.filter(ds => ds.name.toLowerCase().includes(query)));
        });
    }

    // Formos sekimas ir automatinis užpildymas
    if (form) {
        form.addEventListener('input', () => updatePreview());
        form.addEventListener('change', (e) => {
            if (e.target.classList.contains('dataset-check')) {
                const firstChecked = form.querySelector('.dataset-check:checked');
                document.getElementById('assignerName').value = firstChecked ? firstChecked.dataset.ownerName : '';
                document.getElementById('assignerCode').value = firstChecked ? firstChecked.dataset.ownerCode : '';
            }
            updatePreview();
        });
    }

    // Teksto ir JSON peržiūrų generavimas
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

        // JSON atnaujinimas
        const jsonObject = {
            "@context": { "@vocab": "http://www.w3.org/ns/odrl.jsonld", "ex": "http://example.org/vocab#" },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "assigner": { "uid": document.getElementById('assignerCode').value, "name": document.getElementById('assignerName').value },
            "assignee": { "uid": loggedInUser.code, "name": loggedInUser.name },
            "permission": Array.from(document.querySelectorAll('.dataset-check:checked')).map(cb => ({
                "target": { "uid": parseInt(cb.value), "scopes": cb.dataset.scopes.split(',') },
                "constraint": [{ "leftOperand": "purpose", "operator": "eq", "rightOperand": document.getElementById('dataPurpose').value }]
            }))
        };
        jsonPreviewEl.textContent = JSON.stringify(jsonObject, null, 2);
    };

    // PDF Generavimas
    const generatePdfBtn = document.getElementById('generate-pdf');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', () => {
            html2canvas(document.getElementById('pdf-content'), { scale: 1.5 }).then(canvas => {
                const pdf = new jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), canvas.height * pdf.internal.pageSize.getWidth() / canvas.width);
                pdf.save('Sutarties_perziura.pdf');
            });
        });
    }
    
    // --- PRADINIS PUSLAPIO PARUOŠIMAS ---
    // Numatytasis vaidmuo
    switchRole('recipient'); 
    
    // Užpildome gavėjo duomenis
    const assigneeNameEl = document.getElementById('assigneeName');
    if (assigneeNameEl) {
        assigneeNameEl.value = loggedInUser.name;
        document.getElementById('assigneeCode').value = loggedInUser.code;
        document.getElementById('assigneeRep').value = loggedInUser.representative;
        renderDatasets(demoDatasets);
        updatePreview();
    }
});
