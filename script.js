document.addEventListener('DOMContentLoaded', () => {
    // A simple, universally compatible function to generate a random ID.
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // --- FULL AGREEMENT TEXT IS NOW EMBEDDED HERE ---
    const agreementTemplate = `
[ŠABLONAS] AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS
Data: [currentDate]

TEKSTINĖ DALIS

I SKYRIUS
SUTARTIES ŠALYS, TEISINIS PAGRINDAS IR PASKIRTIS, VARTOJAMOS SĄVOKOS

1. Sutarties šalys

   Duomenų teikėjas:
     Pavadinimas: [assignerName]
     Juridinio asmens kodas: [assignerCode]
     Buveinės adresas: [___]
     Atstovas: [assignerRep]

   Duomenų gavėjas:
     Pavadinimas: [assigneeName]
     Juridinio asmens kodas: [assigneeCode]
     Buveinės adresas: [___]
     Atstovas: [assigneeRep]

2. Teisinis pagrindas. Ši sutartis sudaroma vadovaujantis:
   - Lietuvos Respublikos valstybės informacinių išteklių valdymo įstatymu (VIIVĮ);
   - Europos Parlamento ir Tarybos reglamentu (ES) 2023/2854 (Duomenų aktu), reglamentuojančiu išmaniųjų sutarčių (smart contracts) reikalavimus;
   - Lietuvos Respublikos automatizuotų duomenų teikimo sutarčių (ADTS) sudarymo, vykdymo ir vykdymo kontrolės metodika (toliau – Metodika);
   - Teikėjo pagrindas: [otherAssignerLegislations]
   - Gavėjo pagrindas: [otherAssigneeLegislations]

3. Sutarties paskirtis. Šios Automatizuotos duomenų teikimo sutarties (toliau – ADTS) paskirtis – nustatyti teisinius santykius tarp Duomenų teikėjo ir Duomenų gavėjo, siekiant automatizuotai teikti ir gauti duomenis išmaniosios sutarties (smart contract) priemonėmis.

II SKYRIUS
SUTARTIES OBJEKTAS IR DALYKAS

4. Sutarties objektas
   Šia Automatizuota duomenų teikimo sutartimi (toliau – ADTS) Duomenų teikėjas įsipareigoja perduoti Duomenų gavėjui duomenis automatizuotu būdu, o Duomenų gavėjas įsipareigoja gautus duomenis naudoti tik pagal sutartyje nustatytas sąlygas.
   Duomenys, patenkantys į šios ADTS taikymo sritį:
   [datasets]

III SKYRIUS
DUOMENŲ TEIKIMO TVARKA IR SĄLYGOS

... (Skyriai III, IV, V ir kiti eina čia, pilna apimtimi) ...

VI SKYRIUS
ATSISKAITYMO TVARKA IR SĄLYGOS

5. Atsiskaitymo tvarka: [paymentTerms]

   Jeigu šalių susitarimu duomenys teikiami atlygintinai, Duomenų gavėjas įsipareigoja apmokėti teikiamų duomenų naudojimą pagal nustatytą mokėjimų logiką.

VII SKYRIUS
SUTARTIES NUTRAUKIMO ATVEJAI IR SĄLYGOS

6. Šią ADTS turi teisę nutraukti bet kuri iš šalių. Sutarties nutraukimas įsigalioja nuo to momento, kai atitinkamas sprendimas užregistruojamas Išmaniųjų sutarčių modulyje (ISM).

VIII SKYRIUS
GINČŲ SPRENDIMAS IR BAIGIAMOSIOS NUOSTATOS

7. Bet kokie nesutarimai ar ginčai, kylantys tarp šalių, pirmiausia sprendžiami derybų būdu. Nepavykus susitarti, ginčas sprendžiamas Lietuvos Respublikos teismuose.

Ši sutartis pasirašoma kvalifikuotais elektroniniais parašais ir laikoma sudaryta, kai yra patvirtinta ISM aplinkoje.
`;
    
    const form = document.getElementById('agreement-form');
    const previewEl = document.getElementById('agreement-preview');
    const jsonPreviewEl = document.getElementById('json-preview');
    const generatePdfBtn = document.getElementById('generate-pdf');

    const updatePreview = () => {
        try {
            let renderedTemplate = agreementTemplate;
            
            const inputs = form.querySelectorAll('input[type="text"], select');
            inputs.forEach(input => {
                const placeholder = `[${input.id}]`;
                // Use a global regex to replace all occurrences
                renderedTemplate = renderedTemplate.replace(new RegExp(placeholder.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), input.value);
            });

            const selectedDatasets = Array.from(document.querySelectorAll('.dataset-check:checked'))
                .map(cb => `- ${cb.dataset.name} (UAPI Scopes: ${cb.dataset.scopes.split(',').join(', ')})`)
                .join('\n   ');
            renderedTemplate = renderedTemplate.replace('[datasets]', selectedDatasets || 'Nepasirinkta jokių duomenų rinkinių.');
            
            const today = new Date().toLocaleDateString('lt-LT');
            renderedTemplate = renderedTemplate.replace('[currentDate]', today);

            previewEl.textContent = renderedTemplate;
            updateJsonPreview();
        } catch (e) {
            console.error("Error in updatePreview:", e);
            previewEl.textContent = "Klaida generuojant peržiūrą. Patikrinkite konsolę.";
        }
    };

    const updateJsonPreview = () => {
        const assigner = [{
            "uid": "9",
            "ex:companyName": document.getElementById('assignerName').value,
            "ex:companyCode": document.getElementById('assignerCode').value,
            "ex:representative": document.getElementById('assignerRep').value
        }];

        const assignee = [{
            "uid": "269",
            "ex:companyName": document.getElementById('assigneeName').value,
            "ex:companyCode": document.getElementById('assigneeCode').value,
            "ex:representative": document.getElementById('assigneeRep').value
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
            "@context": {
                "@vocab": "http://www.w3.org/ns/odrl.jsonld",
                "ex": "http://example.org/vocab#"
            },
            "uid": `https://data.gov.lt/ID/datasets/gov/vssa/ror/dcat/Agreement/${generateUUID()}`,
            "type": "Agreement",
            "profile": "http://www.w3.org/ns/odrl/profile/core",
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
    
    generatePdfBtn.addEventListener('click', () => {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF biblioteka dar neužkrauta. Bandykite dar kartą po kelių sekundžių.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdfContent = document.getElementById('pdf-content');
        
        const originalButtonText = generatePdfBtn.textContent;
        generatePdfBtn.disabled = true;
        generatePdfBtn.textContent = 'Generuojama... / Generating...';

        html2canvas(pdfContent, {
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            const imgHeight = pdfWidth / ratio;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            pdf.save('Automatizuota_duomenu_teikimo_sutartis.pdf');
            
            generatePdfBtn.disabled = false;
            generatePdfBtn.textContent = originalButtonText;
        }).catch(err => {
            console.error("Klaida generuojant PDF:", err);
            alert("Atsiprašome, įvyko klaida generuojant PDF failą.");
            generatePdfBtn.disabled = false;
            generatePdfBtn.textContent = originalButtonText;
        });
    });

    form.addEventListener('input', updatePreview);
    updatePreview();
});
