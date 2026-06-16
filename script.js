document.addEventListener('DOMContentLoaded', () => {
    // A simple, universally compatible function to generate a random ID.
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const agreementTemplate = `[ŠABLONAS] AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS

TEKSTINĖ DALIS

I SKYRIUS
SUTARTIES ŠALYS, TEISINIS PAGRINDAS IR PASKIRTIS, VARTOJAMOS SĄVOKOS

1. Sutarties šalys
   Duomenų teikėjas:
     Pavadinimas: [assignerName]
     Juridinio asmens kodas: [assignerCode]
     Atstovas: [assignerRep]

   Duomenų gavėjas:
     Pavadinimas: [assigneeName]
     Juridinio asmens kodas: [assigneeCode]
     Atstovas: [assigneeRep]

2. Teisinis pagrindas. Ši sutartis sudaroma vadovaujantis:
   - Lietuvos Respublikos valstybės informacinių išteklių valdymo įstatymu (VIIVĮ);
   - Europos Parlamento ir Tarybos reglamentu (ES) 2023/2854 (Duomenų aktu);
   - Kitais relevantiais teisės aktais.
   - Teikėjo pagrindas: [otherAssignerLegislations]
   - Gavėjo pagrindas: [otherAssigneeLegislations]

II SKYRIUS
SUTARTIES OBJEKTAS IR DALYKAS

3. Sutarties objektas
   Šia sutartimi Duomenų teikėjas įsipareigoja perduoti Duomenų gavėjui nurodytus duomenis automatizuotu būdu.
   Duomenys, patenkantys į šios ADTS taikymo sritį:
   [datasets]

VI SKYRIUS
ATSISKAITYMO TVARKA IR SĄLYGOS

18. Atsiskaitymo tvarka: [paymentTerms]

... (Likusi sutarties dalis, paimta iš Jūsų pateikto .docx failo, turėtų būti čia) ...

VIII SKYRIUS
BAIGIAMOSIOS NUOSTATOS

Sutartis sudaryta [currentDate].
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
                renderedTemplate = renderedTemplate.replace(new RegExp(placeholder, 'g'), input.value);
            });

            const selectedDatasets = Array.from(document.querySelectorAll('.dataset-check:checked'))
                .map(cb => `- ${cb.dataset.name} (UAPI Scopes: ${cb.dataset.scopes.split(',').join(', ')})`)
                .join('\\n   ');
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
            // --- FIX: Using the compatible UUID generator ---
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
        // Ensure jsPDF library is loaded
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
            useCORS: true,
            logging: true // Enable logging for debugging
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
    // Initial call to populate the fields
    updatePreview();
});
