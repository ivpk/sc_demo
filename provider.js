document.addEventListener('DOMContentLoaded', () => {
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": { id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", models: { "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", properties: { "code": { title: "Kodas", description: "Administracinio vieneto ID", uri: "cv:code" }, "level": { title: "Tipas", description: "Vieneto tipas (apskritis, savivaldybė)", uri: "cv:level" }, "name_gen@lt": { title: "Vardas", description: "Vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } }, "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės ID", uri: "dct:identifier" }, "name@lt": { title: "Vardas", description: "Gyvenamosios vietovės vardas", uri: "locn:geographicName" } } } } },
        "datasets/gov/rc/jar/at4020_trumpas_israsas": { id: 3987, title: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246", models: { "JuridinisAsmuo": { title: "Juridinis asmuo", uri: "rc:JuridinisAsmuo", properties: { "kodas": { title: "Kodas", description: "Juridinio asmens kodas", uri: "rc:kodas" }, "pavadinimas@lt": { title: "Pavadinimas", description: "Juridinio asmens pavadinimas", uri: "rc:pavadinimas" }, "statusas": { title: "Statusas", description: "Teisinio statuso kodas", uri: "rc:statusas" } } }, "Adresas": { title: "Adresas (JAR)", uri: "rc:Adresas", properties: { "adresas_txt@lt": { title: "Adresas (tekstu)", description: "Juridinio asmens buveinės adresas", uri: "rc:adresas_txt" }, "busena": { title: "Būsena", description: "Adreso būsena registre", uri: "rc:busena" } } } } }
    };

    const consultationsList = document.getElementById('provider-consultations-list');
    const archiveList = document.getElementById('archived-consultations-list');
    const contractsList = document.getElementById('contracts-list');
    const chatModal = document.getElementById('chat-modal');
    const agreementModal = document.getElementById('agreement-view-modal');
    let currentConsultationId = null;

    const groupPermissionsByDataset = (permissions) => {
        const grouped = {};
        (permissions || []).forEach(perm => {
            const modelUri = perm.target.split('/')[0];
            const datasetKey = Object.keys(dataStructure).find(key => Object.values(dataStructure[key].models).some(m => m.uri === modelUri));
            if (datasetKey) {
                if (!grouped[datasetKey]) grouped[datasetKey] = [];
                grouped[datasetKey].push(perm);
            }
        });
        return grouped;
    };

    const generateAgreementText = (agreement) => {
        if (!agreement) return "Trūksta sutarties duomenų.";
        let text = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\nData: ${new Date(parseInt(agreement.uid.split('/').pop())).toLocaleDateString('lt-LT')}\n\n`;
        text += `I. ŠALYS\n1. Teikėjas: ${agreement.assigner['ex:companyName']}\n2. Gavėjas: ${agreement.assignee['ex:companyName']}\n\n`;
        text += `II. OBJEKTAS\nSuteikiama prieiga prie šių duomenų rinkinių:\n`;
        const permissionsByDataset = groupPermissionsByDataset(agreement.permission);
        Object.entries(permissionsByDataset).forEach(([datasetKey, permissions]) => {
            const datasetInfo = dataStructure[datasetKey];
            if (datasetInfo) {
                text += `\n--- DUOMENŲ RINKINYS: ${datasetInfo.title} ---\n`;
                permissions.forEach(perm => {
                    const modelKey = perm.target.split('/')[1];
                    const model = datasetInfo.models[modelKey];
                    if (model) {
                        text += `\n  Modelis: ${model.title}\n`;
                        const props = perm.constraint[0].rightOperand;
                        props.forEach(propUri => {
                            const propKey = Object.keys(model.properties).find(k => model.properties[k].uri === propUri);
                            if (propKey) text += `    - ${model.properties[propKey].title}: ${model.properties[propKey].description}\n`;
                        });
                    }
                });
            }
        });
        text += `\nIII. SĄLYGOS\nTeisinis pagrindas: ${agreement.legalBasis || 'Nenurodyta'}\nTikslas: ${agreement.dataPurpose || 'Nenurodyta'}`;
        return text;
    };

    const openAgreementModal = (uid) => { /* ... (nepakito) ... */ };
    const updateAgreementStatus = (uid, status, reason = null) => { /* ... (nepakito) ... */ };
    const openChatModal = (consultationId) => { /* ... (nepakito) ... */ };
    
    // ... visos kitos funkcijos (siuntimas, renderinimas) lieka tokios pačios ...
});
