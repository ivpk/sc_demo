document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENŲ BAZĖS SIMULIACIJA ---
    const demoDatasets = [
        { id: 3987, name: "Juridinių asmenų registro duomenys (RAW data)", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/jar/imones/:getall,uapi:/jar/imones/:search" },
        { id: 4071, name: "Adresų registro gatvių tekstinių duomenų rinkinys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/ar/gatves/:getall,uapi:/ar/gatves/:select" },
        { id: 4088, name: "Nekilnojamojo turto registro pastatų duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/ntr/pastatai/:getall" },
        { id: 5123, name: "Gyventojų registro statistiniai duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/gyv/statistika/:getall" }
    ];

    // --- PRISIJUNGUSIO VARTOTOJO SIMULIACIJA ---
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090", representative: "Martynas Mockus" };

    const form = document.getElementById('agreement-form');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const searchInput = document.getElementById('dataset-search');
    const datasetsContainer = document.getElementById('datasets-selection');

    // --- PILNAS SUTARTIES TEKSTAS ---
    const agreementTemplate = `
[ŠABLONAS] AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS
Data: [currentDate]

I SKYRIUS
SUTARTIES ŠALYS, TEISINIS PAGRINDAS IR PASKIRTIS

1. Sutarties šalys
   Duomenų teikėjas:
     Pavadinimas: [assignerName]
     Juridinio asmens kodas: [assignerCode]
     Atstovas: [___]

   Duomenų gavėjas:
     Pavadinimas: [assigneeName]
     Juridinio asmens kodas: [assigneeCode]
     Atstovas: [assigneeRep]

2. Teisinis pagrindas ir tikslas
   Ši sutartis sudaroma vadovaujantis:
   - Lietuvos Respublikos valstybės informacinių išteklių valdymo įstatymu (VIIVĮ);
   - Duomenų teikimo teisinis pagrindas: [legalBasis]
   - Duomenų tvarkymo tikslas: [dataPurpose]

3. Sutarties paskirtis. Šios Automatizuotos duomenų teikimo sutarties (ADTS) paskirtis – nustatyti teisinius santykius tarp Duomenų teikėjo ir Duomenų gavėjo, siekiant automatizuotai teikti ir gauti duomenis išmaniosios sutarties (smart contract) priemonėmis.

II SKYRIUS
SUTARTIES OBJEKTAS IR DALYKAS

4. Sutarties objektas
   Duomenų teikėjas įsipareigoja perduoti Duomenų gavėjui duomenis, nurodytus žemiau, o Duomenų gavėjas įsipareigoja gautus duomenis naudoti tik pagal sutartyje nustatytas sąlygas.
   Duomenys, patenkantys į šios ADTS taikymo sritį:
   [datasets]

III SKYRIUS
DUOMENŲ TEIKIMO TVARKA IR SĄLYGOS

5. ADTS įgyvendinimą užtikrinanti infrastruktūra atliekama Centrinėje metaduomenų saugojimo bazėje data.gov.lt, jos Išmaniųjų sutarčių modulyje (ISM).
6. Duomenų perdavimas vykdomas naudojant universalią duomenų teikimo sąsają (UDTS).
7. Jei tvarkomi asmens duomenys, šalys privalo laikytis BDAR reikalavimų.

IV SKYRIUS
DUOMENŲ TEIKĖJO TEISĖS IR PAREIGOS

8. Duomenų teikėjas užtikrina, kad duomenys atitiktų galiojančius standartus.
9. Duomenų teikėjas turi teisę stebėti, ar Duomenų gavėjo veiksmai atitinka sutarties sąlygas.

V SKYRIUS
DUOMENŲ GAVĖJO TEISĖS IR PAREIGOS

10. Duomenų gavėjas turi teisę gauti duomenis automatizuotai pagal sutartyje numatytus reikalavimus.
11. Duomenų gavėjas įsipareigoja naudoti duomenis tik nustatytais tikslais ir neperduoti jų tretiesiems asmenims, nebent tai numatyta teisės aktuose.

VI SKYRIUS
ATSISKAITYMO TVARKA IR SĄLYGOS

12. Atsiskaitymo tvarka: [paymentTerms]. Jeigu duomenys teikiami atlygintinai, Duomenų gavėjas įsipareigoja apmokėti paslaugas pagal nustatytą tvarką.

VII SKYRIUS
SUTARTIES NUTRAUKIMAS

13. Šią ADTS turi teisę nutraukti bet kuri iš šalių, apie tai pranešus kitai šaliai. Nutraukimas įsigalioja jį užregistravus ISM.

VIII SKYRIUS
GINČŲ SPRENDIMAS IR BAIGIAMOSIOS NUOSTATOS

14. Ginčai sprendžiami derybų būdu, o nepavykus – Lietuvos Respublikos teismuose.
15. Sutartis pasirašoma kvalifikuotais elektroniniais parašais.
`;

    const renderDatasets = (datasets) => {
        datasetsContainer.innerHTML = datasets.length ? '' : '<p>Pagal paiešką rinkinių nerasta.</p>';
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'dataset-item';
            div.innerHTML = `<label><input type="checkbox" class="dataset-check" value="${ds.id}" data-name="${ds.name}" data-scopes="${ds.scopes}" data-owner-name="${ds.owner}" data-owner-code="${ds.ownerCode}"> ${ds.name}</label>`;
            datasetsContainer.appendChild(div);
        });
    };

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderDatasets(demoDatasets.filter(ds => ds.name.toLowerCase().includes(query)));
    });

    form.addEventListener('input', () => updatePreview());
    form.addEventListener('change', (e) => {
        if (e.target.classList.contains('dataset-check')) {
            const firstChecked = form.querySelector('.dataset-check:checked');
            document.getElementById('assignerName').value = firstChecked ? firstChecked.dataset.ownerName : '';
            document.getElementById('assignerCode').value = firstChecked ? firstChecked.dataset.ownerCode : '';
        }
        updatePreview();
    });

    const updatePreview = () => {
        let renderedTemplate = agreementTemplate;
        const inputs = form.querySelectorAll('input[type="text"], input[type="search"], select');
        inputs.forEach(input => {
            const placeholder = `\\[${input.id}\\]`;
            renderedTemplate = renderedTemplate.replace(new RegExp(placeholder, 'g'), input.value);
        });
        
        const selectedDatasets = Array.from(document.querySelectorAll('.dataset-check:checked'))
            .map(cb => `- ${cb.dataset.name}`).join('\n   ');
        renderedTemplate = renderedTemplate.replace('[datasets]', selectedDatasets || 'Nepasirinkta jokių duomenų rinkinių.');
        renderedTemplate = renderedTemplate.replace(/\[currentDate\]/g, new Date().toLocaleDateString('lt-LT'));

        previewEl.textContent = renderedTemplate;
        updateJsonPreview();
    };

    const updateJsonPreview = () => {
        const jsonObject = {
            "@context": { "@vocab": "http://www.w3.org/ns/odrl.jsonld", "ex": "http://example.org/vocab#" },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "type": "Agreement",
            "issued": new Date().toISOString().split('T')[0],
            "assigner": [{ "uid": document.getElementById('assignerCode').value || "UNKNOWN", "ex:companyName": document.getElementById('assignerName').value, "ex:companyCode": document.getElementById('assignerCode').value }],
            "assignee": [{ "uid": loggedInUser.code, "ex:companyName": loggedInUser.name, "ex:companyCode": loggedInUser.code, "ex:representative": loggedInUser.representative }],
            // Atnaujinta JSON struktūra
            "ex:legalBasis": document.getElementById('legalBasis').value,
            "permission": Array.from(document.querySelectorAll('.dataset-check:checked')).map(cb => ({
                "target": {
                    "uid": parseInt(cb.value),
                    "ex:name": cb.dataset.name,
                    "ex:scopes": cb.dataset.scopes.split(',')
                },
                "action": "use",
                "constraint": [{
                    "leftOperand": "purpose",
                    "operator": "eq",
                    "rightOperand": document.getElementById('dataPurpose').value
                }]
            })),
            "ex:paymentTerms": document.getElementById('paymentTerms').value
        };
        jsonPreviewEl.textContent = JSON.stringify(jsonObject, null, 2);
    };

    // PDF generavimo funkcija (nepakeista)
    document.getElementById('generate-pdf').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        html2canvas(document.getElementById('pdf-content'), { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save('Automatizuota_duomenu_teikimo_sutartis.pdf');
        });
    });

    // Pradinis puslapio paruošimas
    document.getElementById('assigneeName').value = loggedInUser.name;
    document.getElementById('assigneeCode').value = loggedInUser.code;
    document.getElementById('assigneeRep').value = loggedInUser.representative;
    renderDatasets(demoDatasets);
    updatePreview();
});
