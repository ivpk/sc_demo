document.addEventListener('DOMContentLoaded', () => {
    const dataStructure = { "datasets/gov/rc/ar/text_with_coordinates": { id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", models: { "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", eli: "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.235119/asr#14.1.", properties: { "code": { title: "Kodas", description: "Administracinio vieneto identifikacinis kodas", uri: "cv:code" }, "level": { title: "Tipas", description: "Administracinio vieneto tipas", uri: "cv:level" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Administracinio vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } }, "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės identifikavimo kodas", uri: "dct:identifier" }, "name@lt": { title: "Vardas (vard.)", description: "Gyvenamosios vietovės vardas vardininko linksniu", uri: "locn:geographicName" }, "admin_unit": { title: "Administracinis vienetas", description: "Seniūnijos ar savivaldybės kodas" } } }, "Street": { title: "Gatvė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gatvės identifikavimo kodas", uri: "dct:identifier" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Gatvės vardas kilmininko linksniu", uri: "locn:geographicName" }, "location": { title: "Gyvenvietė", description: "Gyvenamosios vietovės kodas", uri: "locn:location" } } } } } };
    const loggedInUser = { name: "Valstybės skaitmeninių sprendimų agentūra", code: "306279090" };

    const form = document.getElementById('agreement-form');
    const sentAgreementsList = document.getElementById('sent-agreements-list');
    const agreementModal = document.getElementById('agreement-view-modal');
    
    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };

    const generateAgreementText = (agreement) => {
        if (!agreement) return "";
        const datasetInfo = Object.values(dataStructure).find(ds => ds.ownerCode === agreement.assigner.uid);
        if (!datasetInfo) return "Klaida: Duomenų rinkinys nerastas.";

        let text = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        text += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner['ex:companyName']}\n2. Gavėjas: ${agreement.assignee['ex:companyName']}\n\n`;
        text += `II. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${datasetInfo.title}" pagal nurodytą apimtį:\n`;
        (agreement.permission || []).forEach(perm => {
            const modelKey = perm.target.split('/')[1];
            const model = datasetInfo.models[modelKey];
            if (model) {
                text += `\nModelis: ${model.title} (URI: ${model.uri})\n`;
                const props = perm.constraint[0].rightOperand;
                props.forEach(propUri => {
                    const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                    if (propKey) text += `    - ${model.properties[propKey].title}: ${model.properties[propKey].description}\n`;
                });
            }
        });
        text += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${agreement.legalBasis}\nTikslas: ${agreement.dataPurpose}`;
        return text;
    };

    const openAgreementModal = (uid) => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreement = allAgreements.find(a => a.uid === uid);
        if (!agreement) return;

        document.getElementById('modal-agreement-text').textContent = generateAgreementText(agreement);
        document.getElementById('modal-agreement-json').textContent = JSON.stringify(agreement, null, 2);
        agreementModal.style.display = 'flex';
    };
    
    const renderSentAgreements = () => { /* ... (nepakito, bet palikta dėl pilnumo) ... */ };
    
    // ... (kitos funkcijos: renderDatasets, renderModels, etc.)
    
    // PRADINIS PALEIDIMAS
    // ...
    window.openAgreementModal = openAgreementModal; // Svarbus pridėjimas
    renderSentAgreements();
});
// Čia turėtų būti likęs nepakitęs kodas iš ankstesnių atsakymų
