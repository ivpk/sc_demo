document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENŲ BAZĖS SIMULIACIJA ---
    // Demonstraciniai "Registrų centro" duomenų rinkiniai, paimti iš data.gov.lt
    const demoDatasets = [
        {
            id: 3987,
            name: "Juridinių asmenų registro duomenys (RAW data)",
            owner: "Valstybės įmonė Registrų centras",
            ownerCode: "124110246",
            scopes: "uapi:/jar/imones/:getall,uapi:/jar/imones/:search"
        },
        {
            id: 4071,
            name: "Adresų registro gatvių tekstinių duomenų rinkinys",
            owner: "Valstybės įmonė Registrų centras",
            ownerCode: "124110246",
            scopes: "uapi:/ar/gatves/:getall,uapi:/ar/gatves/:select"
        },
        {
            id: 4088,
            name: "Nekilnojamojo turto registro pastatų duomenys",
            owner: "Valstybės įmonė Registrų centras",
            ownerCode: "124110246",
            scopes: "uapi:/ntr/pastatai/:getall"
        },
        {
            id: 5123,
            name: "Gyventojų registro statistiniai duomenys",
            owner: "Valstybės įmonė Registrų centras",
            ownerCode: "124110246",
            scopes: "uapi:/gyv/statistika/:getall"
        }
    ];

    // --- PRISIJUNGUSIO VARTOTOJO SIMULIACIJA ---
    const loggedInUser = {
        name: "Valstybės skaitmeninių sprendimų agentūra",
        code: "306279090",
        representative: "Martynas Mockus"
    };

    const form = document.getElementById('agreement-form');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const generatePdfBtn = document.getElementById('generate-pdf');
    const searchInput = document.getElementById('dataset-search');
    const datasetsContainer = document.getElementById('datasets-selection');

    // Pilnas sutarties tekstas
    const agreementTemplate = `
[ŠABLONAS] AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS
Data: [currentDate]

I SKYRIUS
SUTARTIES OBJEKTAS IR DALYKAS

Šia sutartimi Duomenų teikėjas įsipareigoja perduoti Duomenų gavėjui nurodytus duomenis automatizuotu būdu.
Duomenys, patenkantys į šios ADTS taikymo sritį:
   [datasets]

II SKYRIUS
SUTARTIES ŠALYS, TEISINIS PAGRINDAS IR PASKIRTIS

1. Sutarties šalys

   Duomenų teikėjas:
     Pavadinimas: [assignerName]
     Juridinio asmens kodas: [assignerCode]
     
   Duomenų gavėjas:
     Pavadinimas: [assigneeName]
     Juridinio asmens kodas: [assigneeCode]
     Atstovas: [assigneeRep]

2. Teisinis pagrindas:
   - Lietuvos Respublikos valstybės informacinių išteklių valdymo įstatymu (VIIVĮ);
   - Teikėjo pagrindas: [otherAssignerLegislations]
   - Gavėjo pagrindas: [otherAssigneeLegislations]

III SKYRIUS
ATSISKAITYMO TVARKA IR SĄLYGOS

Atsiskaitymo tvarka: [paymentTerms]

... (kiti sutarties skyriai) ...
`;
    
    // Funkcija, kuri atvaizduoja duomenų rinkinius
    const renderDatasets = (datasets) => {
        datasetsContainer.innerHTML = '';
        if (datasets.length === 0) {
            datasetsContainer.innerHTML = '<p>Pagal paiešką rinkinių nerasta.</p>';
            return;
        }
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'dataset-item';
            div.innerHTML = `
                <label>
                    <input type="checkbox" class="dataset-check" 
                           value="${ds.id}" 
                           data-name="${ds.name}" 
                           data-scopes="${ds.scopes}"
                           data-owner-name="${ds.owner}"
                           data-owner-code="${ds.ownerCode}"> 
                    ${ds.name}
                </label>`;
            datasetsContainer.appendChild(div);
        });
    };
    
    // Paieškos lauko funkcionalumas
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = demoDatasets.filter(ds => ds.name.toLowerCase().includes(query));
        renderDatasets(filtered);
    });
    
    // Automatinis šalių užpildymas ir peržiūros atnaujinimas
    form.addEventListener('change', (e) => {
        if (e.target.classList.contains('dataset-check')) {
            const checkedBoxes = form.querySelectorAll('.dataset-check:checked');
            if (checkedBoxes.length > 0) {
                // Paima duomenis iš pirmo pasirinkto rinkinio
                const firstChecked = checkedBoxes[0];
                document.getElementById('assignerName').value = firstChecked.dataset.ownerName;
                document.getElementById('assignerCode').value = firstChecked.dataset.ownerCode;
            } else {
                // Išvalo laukus, jei niekas nepasirinkta
                document.getElementById('assignerName').value = '';
                document.getElementById('assignerCode').value = '';
            }
        }
        updatePreview();
    });

    const updatePreview = () => {
        let renderedTemplate = agreementTemplate;

        // Atnaujina teksto laukus
        const inputs = form.querySelectorAll('input[type="text"], input[type="search"], select');
        inputs.forEach(input => {
            const placeholder = `[${input.id}]`;
            renderedTemplate = renderedTemplate.replace(new RegExp(placeholder.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), input.value);
        });
        
        // Atnaujina duomenų rinkinių sąrašą
        const selectedDatasets = Array.from(document.querySelectorAll('.dataset-check:checked'))
            .map(cb => `- ${cb.dataset.name}`)
            .join('\n   ');
        renderedTemplate = renderedTemplate.replace('[datasets]', selectedDatasets || 'Nepasirinkta jokių duomenų rinkinių.');
        
        const today = new Date().toLocaleDateString('lt-LT');
        renderedTemplate = renderedTemplate.replace('[currentDate]', today);

        previewEl.textContent = renderedTemplate;
        updateJsonPreview();
    };

    const updateJsonPreview = () => {
        const assigner = [{
            "uid": document.getElementById('assignerCode').value || "UNKNOWN",
            "ex:companyName": document.getElementById('assignerName').value,
            "ex:companyCode": document.getElementById('assignerCode').value
        }];

        const assignee = [{
            "uid": loggedInUser.code,
            "ex:companyName": loggedInUser.name,
            "ex:companyCode": loggedInUser.code,
            "ex:representative": loggedInUser.representative
        }];
        
        const permissions = Array.from(document.querySelectorAll('.dataset-check:checked'))
            .map(cb => ({
                "target": {
                    "uid": parseInt(cb.value),
                    "ex:name": cb.dataset.name,
                    "ex:scopes": cb.dataset.scopes.split(',')
                }
            }));

        const jsonObject = {
            "@context": { "@vocab": "http://www.w3.org/ns/odrl.jsonld", "ex": "http://example.org/vocab#" },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "type": "Agreement",
            "issued": new Date().toISOString().split('T')[0],
            "assigner": assigner,
            "assignee": assignee,
            "permission": permissions,
            "ex:paymentTerms": document.getElementById('paymentTerms').value,
            "ex:otherAssignerLegislations": document.getElementById('otherAssignerLegislations').value,
            "ex:otherAssigneeLegislations": document.getElementById('otherAssigneeLegislations').value
        };

        jsonPreviewEl.textContent = JSON.stringify(jsonObject, null, 2);
    };

    // PDF generavimo funkcija (nepakeista)
    generatePdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        html2canvas(document.getElementById('pdf-content'), { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            pdf.save('Automatizuota_duomenu_teikimo_sutartis.pdf');
        });
    });

    // --- PRADINIS PUSLAPIO PARUOŠIMAS ---
    // Užpildome "Duomenų gavėjo" laukus
    document.getElementById('assigneeName').value = loggedInUser.name;
    document.getElementById('assigneeCode').value = loggedInUser.code;
    document.getElementById('assigneeRep').value = loggedInUser.representative;
    // Parodome visus demo rinkinius
    renderDatasets(demoDatasets);
    // Atnaujiname peržiūrą
    updatePreview();
});
