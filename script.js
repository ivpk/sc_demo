document.addEventListener('DOMContentLoaded', () => {
    // Unikalaus UUID generavimas suderinamas su visomis naršyklėmis
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // --- DUOMENŲ BAZĖS SIMULIACIJA (Registrų centro rinkiniai iš data.gov.lt) ---
    const demoDatasets = [
        { id: 3987, name: "Juridinių asmenų registro duomenys (RAW data)", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/jar/imones/:getall,uapi:/jar/imones/:search" },
        { id: 4071, name: "Adresų registro gatvių tekstinių duomenų rinkinys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/ar/gatves/:getall,uapi:/ar/gatves/:select" },
        { id: 4088, name: "Nekilnojamojo turto registro pastatų duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/ntr/pastatai/:getall" },
        { id: 5123, name: "Gyventojų registro statistiniai duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", scopes: "uapi:/gyv/statistika/:getall" }
    ];

    // --- PRISIJUNGUSIO VARTOTOJO (GAVĖJO) SIMULIACIJA ---
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090", representative: "Martynas Mockus" };

    const stepper = document.getElementById('lifecycle-stepper');
    const form = document.getElementById('agreement-form');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const searchInput = document.getElementById('dataset-search');
    const datasetsContainer = document.getElementById('datasets-selection');
    const watermark = document.getElementById('contract-watermark');

    let currentStep = 1;

    // --- PILNAS SUTARTIES TEKSTAS ---
    const agreementTemplate = `
AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS
Sudarymo data: [currentDate]

I SKYRIUS
SUTARTIES ŠALYS, TEISINIS PAGRINDAS IR PASKIRTIS

1. Sutarties šalys
   Duomenų teikėjas:
     Pavadinimas: [assignerName]
     Juridinio asmens kodas: [assignerCode]

   Duomenų gavėjas:
     Pavadinimas: [assigneeName]
     Juridinio asmens kodas: [assigneeCode]
     Atstovas: [assigneeRep]

2. Teisinis pagrindas ir tikslas:
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
9. Duomenų teikėjas turi teise stebėti, ar Duomenų gavėjo veiksmai atitinka sutarties sąlygas.

V SKYRIUS
DUOMENŲ GAVĖJO TEISĖS IR PAREIGOS

10. Duomenų gavėjas turi teisę gauti duomenis automatizuotai pagal sutartyje numatytus reikalavimus.
11. Duomenų gavėjas įsipareigoja naudoti duomenis tik nustatytais tikslais ir neperduoti jų tretiesiems asmenims, nebent tai numatyta teisės aktuose.

VI SKYRIUS
ATSISKAITYMO TVARKA IR SĄLYGOS

12. Atsiskaitymo tvarka: [paymentTerms]. Jeigu duomenys teikiami atlygintinai, Duomenų gavėjas įsipareigoja apmokėti paslaugas pagal nustatytą tvarką.

VII SKYRIUS
SUTARTIES NUTRAUKIMAS

13. Šia ADTS turi teisę nutraukti bet kuri iš šalių, apie tai pranešus kitai šaliai. Nutraukimas įsigalioja jį užregistravus ISM.

VIII SKYRIUS
GINČŲ SPRENDIMAS IR BAIGIAMOSIOS NUOSTATOS

14. Ginčai sprendžiami derybų būdu, o nepavykus – Lietuvos Respublikos teismuose.
15. Sutartis pasirašoma kvalifikuotais elektroniniais parašais.
`;

    // Duomenų rinkinių atvaizdavimas
    const renderDatasets = (datasets) => {
        datasetsContainer.innerHTML = datasets.length ? '' : '<p>Pagal paiešką rinkinių nerasta.</p>';
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'dataset-item';
            div.innerHTML = `<label><input type="checkbox" class="dataset-check" value="${ds.id}" data-name="${ds.name}" data-scopes="${ds.scopes}" data-owner-name="${ds.owner}" data-owner-code="${ds.ownerCode}"> ${ds.name}</label>`;
            datasetsContainer.appendChild(div);
        });
    };

    // Paieškos logika
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderDatasets(demoDatasets.filter(ds => ds.name.toLowerCase().includes(query)));
    });

    // Sekame formos pasikeitimus pirmajame žingsnyje
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
        
        // Pakeičiame tekstinius laukus ir textarea lauką
        const inputs = form.querySelectorAll('input[type="text"], input[type="search"], textarea, select');
        inputs.forEach(input => {
            const placeholder = `\\[${input.id}\\]`;
            renderedTemplate = renderedTemplate.replace(new RegExp(placeholder, 'g'), input.value);
        });
        
        // Pridedame pasirinktus duomenų rinkinius
        const selectedDatasets = Array.from(document.querySelectorAll('.dataset-check:checked'))
            .map(cb => `- ${cb.dataset.name}`).join('\n   ');
        renderedTemplate = renderedTemplate.replace('[datasets]', selectedDatasets || 'Nepasirinkta jokių duomenų rinkinių.');
        renderedTemplate = renderedTemplate.replace(/\[currentDate\]/g, new Date().toLocaleDateString('lt-LT'));

        previewEl.textContent = renderedTemplate;
        updateJsonPreview();
    };

    const updateJsonPreview = () => {
        const jsonObject = {
            "@context": { 
                "@vocab": "http://www.w3.org/ns/odrl.jsonld", 
                "ex": "http://example.org/vocab#" 
            },
            "uid": `https://data.gov.lt/ID/Agreement/${Date.now()}`,
            "type": "Agreement",
            "issued": new Date().toISOString().split('T')[0],
            "assigner": [{ 
                "uid": document.getElementById('assignerCode').value || "UNKNOWN", 
                "ex:companyName": document.getElementById('assignerName').value, 
                "ex:companyCode": document.getElementById('assignerCode').value 
            }],
            "assignee": [{ 
                "uid": loggedInUser.code, 
                "ex:companyName": loggedInUser.name, 
                "ex:companyCode": loggedInUser.code, 
                "ex:representative": loggedInUser.representative 
            }],
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

    // --- LEGAL DESIGN: Etapų perjungimo logika (SPA Router) ---
    const switchStep = (stepNumber) => {
        currentStep = stepNumber;

        // Atnaujiname Stepper vizualizaciją
        const steps = document.querySelectorAll('#lifecycle-stepper .step');
        steps.forEach(s => {
            const stepVal = parseInt(s.getAttribute('data-step'));
            s.classList.remove('active', 'completed');
            if (stepVal === currentStep) {
                s.classList.add('active');
            } else if (stepVal < currentStep) {
                s.classList.add('completed');
            }
        });

        // Perjungiame kairės pusės aktyvų vaizdą
        const views = document.querySelectorAll('.step-view');
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(`view-step-${currentStep}`).classList.add('active');

        // Atnaujiname Vandens ženklą ant popierinės sutarties dešinėje
        updateWatermarkAndReview(currentStep);
    };

    const updateWatermarkAndReview = (step) => {
        const watermarkStyles = {
            1: { text: "JUODRAŠTIS", color: "#ed6c02", border: "4px solid #ed6c02" },
            2: { text: "KONSULTACIJOS", color: "#0288d1", border: "4px solid #0288d1" },
            3: { text: "DERINAMA", color: "#005aa3", border: "4px solid #005aa3" },
            4: { text: "PARENGTA", color: "#2e7d32", border: "4px solid #2e7d32" },
            5: { text: "LAUKIA PARAŠŲ", color: "#e65100", border: "4px solid #e65100" },
            6: { text: "PASIRAŠYTA", color: "#2e7d32", border: "4px solid #2e7d32" },
            7: { text: "AKTYVI / MAINAI", color: "#2e7d32", border: "4px solid #2e7d32" },
            8: { text: "ATŠAUKTA", color: "#d32f2f", border: "4px solid #d32f2f" }
        };

        [...](asc_slot://start-slot-1)const style = watermarkStyles[step] || watermarkStyles;
        watermark.textContent = style.text;
        watermark.style.color = style.color;
        watermark.style.borderColor = style.color;
    };

    // Leidžiame partneriams spaudyti pačius žingsnius viršuje (Prezentacijai)
    document.querySelectorAll('#lifecycle-stepper .step').forEach(stepBtn => {
        stepBtn.addEventListener('click', () => {
            const stepVal = parseInt(stepBtn.getAttribute('data-step'));
            switchStep(stepVal);
        });
    });

    // "Eiti toliau" mygtukų valdymas
    document.querySelectorAll('.btn-next-step').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < 8) {
                switchStep(currentStep + 1);
            }
        });
    });

    // --- STADIJA 2: Pokalbių funkcionalumas (Messenger) ---
    document.getElementById('btn-send-chat').addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (text) {
            const chatBox = document.getElementById('chat-box');
            const msg = document.createElement('div');
            msg.className = 'chat-message receiver';
            msg.innerHTML = `<strong>Martynas Mockus (VSSA):</strong> ${text}`;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;
            input.value = '';
        }
    });

    // --- STADIJA 3: Derybų funkcijos ---
    document.querySelector('.btn-action-approve').addEventListener('click', (e) => {
        const card = e.target.closest('.negotiation-card');
        const status = card.querySelector('.negotiation-status');
        status.textContent = "SUDERINTA / APPROVED";
        status.style.backgroundColor = "#e8f5e9";
        status.style.color = "#2e7d32";
        alert('Sąlyga sėkmingai suderinta!');
    });

    document.querySelector('.btn-action-counter').addEventListener('click', (e) => {
        const select = document.getElementById('paymentTerms');
        select.value = "Avansinis mokėjimas";
        updatePreview();
        alert('Teikėjui išsiųstas pasiūlymas pakeisti atsiskaitymo tvarką į "Avansinis mokėjimas"');
    });

    // --- STADIJA 5: ADOC Įkėlimo simuliavimas ---
    const adocUploadZone = document.getElementById('adoc-upload-zone');
    const adocFileInput = document.getElementById('adoc-file');
    const uploadStatus = document.getElementById('upload-status');

    adocFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            uploadStatus.textContent = `Tikrinamas failas: ${file.name}...`;
            uploadStatus.style.color = "#ed6c02";

            setTimeout(() => {
                uploadStatus.textContent = "ADOC parašai sėkmingai patvirtinti! Nukreipiama...";
                uploadStatus.style.color = "#2e7d32";
                
                setTimeout(() => {
                    switchStep(6);
                }, 1500);
            }, 2000);
        }
    });

    // --- STADIJA 7: API UDTS Testavimo konsolė ---
    document.getElementById('btn-test-api').addEventListener('click', () => {
        const output = document.getElementById('api-response-output');
        output.textContent = "Kreipiamasi į UDTS duomenų gavimo sąsają...";
        
        const selectedChecked = Array.from(document.querySelectorAll('.dataset-check:checked'))
            .map(cb => cb.dataset.name);

        setTimeout(() => {
            const mockApiResponse = {
                "status": "success",
                "timestamp": new Date().toISOString(),
                "requested_by": loggedInUser.name,
                "legal_basis": document.getElementById('legalBasis').value,
                "purpose": document.getElementById('dataPurpose').value,
                "active_data_streams": selectedChecked.length > 0 ? selectedChecked : ["Visi skelbiami rinkiniai"],
                "data": [
                    { "id": 1, "pavadinimas": "UAB Bandymas", "kodas": "123456789", "statusas": "Aktyvus" },
                    { "id": 2, "pavadinimas": "VšĮ Testas", "kodas": "987654321", "statusas": "Likviduojama" }
                ]
            };
            output.textContent = JSON.stringify(mockApiResponse, null, 2);
        }, 1200);
    });

    // Nutraukimo mygtukas
    document.querySelector('.btn-terminate-contract').addEventListener('click', () => {
        if (confirm('Ar tikrai norite atšaukti šią sutartį? Šis veiksmas sustabdys duomenų teikimą akimirksniu.')) {
            switchStep(8);
        }
    });

    // Demo perkrovimas
    document.getElementById('btn-restart-demo').addEventListener('click', () => {
        switchStep(1);
    });

    // --- PDF GENERAVIMAS (Užtikrinantis teisingą kadrą) ---
    document.getElementById('generate-pdf').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const pdfBtn = document.getElementById('generate-pdf');
        
        pdfBtn.disabled = true;
        pdfBtn.textContent = 'Generuojama...';

        html2canvas(document.getElementById('pdf-content'), { scale: 1.5, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save('Automatizuota_duomenu_teikimo_sutartis_su_ODRL_priedu.pdf');
            
            pdfBtn.disabled = false;
            pdfBtn.textContent = 'Atsisiųsti PDF pasirašymui (PDF)';
        });
    });

    // --- PRADINIS PUSLAPIO UŽPILDYMAS ---
    document.getElementById('assigneeName').value = loggedInUser.name;
    document.getElementById('assigneeCode').value = loggedInUser.code;
    document.getElementById('assigneeRep').value = loggedInUser.representative;
    
    renderDatasets(demoDatasets);
    updatePreview();
});
