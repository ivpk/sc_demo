document.addEventListener('DOMContentLoaded', () => {
    // --- DUOMENŲ STRUKTŪRA SU DVIEM RINKINIAIS ---
    const dataStructure = {
        "datasets/gov/rc/ar/text_with_coordinates": {
            id: 4071, title: "Adresų duomenys su koordinatėmis", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "AdminUnit": { title: "Administracinis vienetas", uri: "cv:AdminUnit", properties: { "code": { title: "Kodas", description: "Administracinio vieneto ID", uri: "cv:code" }, "level": { title: "Tipas", description: "Vieneto tipas (apskritis, savivaldybė)", uri: "cv:level" }, "name_gen@lt": { title: "Vardas", description: "Vieneto vardas kilmininko linksniu", uri: "rdfs:label" } } },
                "Location": { title: "Gyvenamoji vietovė", uri: "dct:Location", properties: { "code": { title: "Kodas", description: "Gyvenamosios vietovės ID", uri: "dct:identifier" }, "name@lt": { title: "Vardas", description: "Gyvenamosios vietovės vardas", uri: "locn:geographicName" } } }
            }
        },
        "datasets/gov/rc/jar/at4020_trumpas_israsas": {
            id: 3987, title: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras", ownerCode: "124110246",
            models: {
                "JuridinisAsmuo": { title: "Juridinis asmuo", uri: "rc:JuridinisAsmuo", properties: { "kodas": { title: "Kodas", description: "Juridinio asmens kodas", uri: "rc:kodas" }, "pavadinimas@lt": { title: "Pavadinimas", description: "Juridinio asmens pavadinimas", uri: "rc:pavadinimas" }, "statusas": { title: "Statusas", description: "Teisinio statuso kodas", uri: "rc:statusas" } } },
                "Adresas": { title: "Adresas (JAR)", uri: "rc:Adresas", properties: { "adresas_txt@lt": { title: "Adresas (tekstu)", description: "Juridinio asmens buveinės adresas", uri: "rc:adresas_txt" }, "busena": { title: "Būsena", description: "Adreso būsena registre", uri: "rc:busena" } } }
            }
        }
    };
    
    // --- LIKĘS KODAS YRA IDENTIŠKAS ANKSTESNIAME ATSAKYME ---
    let state = { selectedDataset: null, selectedModels: [], selectedProperties: {} };
    // ... visos kitos funkcijos (renderDatasets, renderModels, etc.) lieka tokios pačios
});
