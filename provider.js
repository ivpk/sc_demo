document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENŲ STRUKTŪRA (BŪTINA SUTARČIŲ ATKŪRIMUI) ---
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": {
            id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", eli: "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.235119/asr#14.1.", properties: { "code": { title: "Kodas", description: "Administracinio vieneto identifikacinis kodas", uri: "cv:code" }, "level": { title: "Tipas", description: "Administracinio vieneto tipas (apskritis, savivaldybė, seniūnija)", uri: "cv:level" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Administracinio vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } },
                "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės identifikavimo kodas", uri: "dct:identifier" }, "name@lt": { title: "Vardas (vard.)", description: "Gyvenamosios vietovės vardas vardininko linksniu", uri: "locn:geographicName" }, "admin_unit": { title: "Administracinis vienetas", description: "Seniūnijos ar savivaldybės, kuriai priklauso, kodas" } } },
                "Street": { title: "Gatvė", uri: "dct:Location", eli: null, properties: { "code": { title: "Kodas", description: "Gatvės identifikavimo kodas", uri: "dct:identifier" }, "name_gen@lt": { title: "Vardas (kilm.)", description: "Gatvės vardas kilmininko linksniu", uri: "locn:geographicName" }, "location": { title: "Gyvenvietė", description: "Gyvenamosios vietovės, kuriai priklauso gatvė, kodas", uri: "locn:location" } } }
            }
        }
    };
    
    // --- ELEMENTAI ---
    const consultationsList = document.getElementById('provider-consultations-list');
    const archiveList = document.getElementById('archived-consultations-list');
    const contractsList = document.getElementById('contracts-list');
    
    const chatModal = document.getElementById('chat-modal');
    const agreementModal = document.getElementById('agreement-view-modal');

    let currentConsultationId = null;

    // --- SUTARČIŲ PERŽIŪRA ---
    const openAgreementModal = (uid) => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreement = allAgreements.find(a => a.uid === uid);
        if (!agreement) { alert('Sutartis nerasta.'); return; }

        const datasetInfo = Object.values(dataStructure)[0]; // Supaprastinta demonstracijai
        let agreementText = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        agreementText += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner.ex_companyName}\n2. Gavėjas: ${agreement.assignee.ex_companyName}\n\n`;
        agreementText += `II. OBJEKTAS\nSuteikiama prieiga prie duomenų rinkinio "${datasetInfo.title}" pagal nurodytą apimtį:\n`;
        
        (agreement.permission || []).forEach(perm => {
            const modelKey = perm.target.split('/')[1];
            const model = datasetInfo.models[modelKey];
            if (model) {
                agreementText += `\nModelis: ${model.title}\n`;
                const props = perm.constraint[0].rightOperand;
                props.forEach(propUri => {
                    const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                    if (propKey) {
                        const prop = model.properties[propKey];
                        agreementText += `    - ${prop.title}: ${prop.description}\n`;
                    }
                });
            }
        });

        document.getElementById('agreement-view-text').textContent = agreementText;
        document.getElementById('agreement-view-json').textContent = JSON.stringify(agreement, null, 2);
        agreementModal.style.display = 'flex';
    };

    // --- KONSULTACIJŲ POKALBIŲ LANGAS ---
    const openChatModal = (consultationId) => {
        currentConsultationId = consultationId;
        const allConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        const consult = allConsultations.find(c => c && c.id === consultationId);
        if (!consult) return;

        document.getElementById('chat-modal-title').textContent = `Konsultacija dėl: "${consult.purpose.substring(0, 40)}..."`;
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';
        (consult.messages || []).forEach(msg => {
            const msgDiv = document.createElement('div');
    
