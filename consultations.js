document.addEventListener('DOMContentLoaded', () => {
    const demoDatasets = [
        { id: 3987, name: "Juridinių asmenų registro duomenys", owner: "Valstybės įmonė Registrų centras" },
        { id: 4071, name: "Adresų registro duomenys", owner: "Valstybės įmonė Registrų centras" }
    ];

    const searchInput = document.getElementById('consult-dataset-search');
    const selectionContainer = document.getElementById('consult-datasets-selection');
    const selectedContainer = document.getElementById('consult-selected-datasets');
    const submitBtn = document.getElementById('submit-consultation');
    const activeConsultationsList = document.getElementById('active-consultations-list');
    let selectedDatasets = [];

    // Duomenų rinkinių paieška ir atvaizdavimas
    const renderSearchResults = (datasets) => {
        selectionContainer.innerHTML = '';
        datasets.forEach(ds => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = ds.name;
            div.onclick = () => addDatasetToSelection(ds);
            selectionContainer.appendChild(div);
        });
    };

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length > 2) {
            const results = demoDatasets.filter(ds => ds.name.toLowerCase().includes(query));
            renderSearchResults(results);
        } else {
            selectionContainer.innerHTML = '';
        }
    });

    // Pasirinktų rinkinių atvaizdavimas
    const renderSelectedDatasets = () => {
        selectedContainer.innerHTML = '<h4>Pridėti rinkiniai:</h4>';
        if (selectedDatasets.length === 0) {
            selectedContainer.innerHTML += '<p>Kol kas nepridėta.</p>';
        } else {
            selectedDatasets.forEach((ds, index) => {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.textContent = ds.name;
                const removeBtn = document.createElement('span');
                removeBtn.textContent = ' (pašalinti)';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.color = 'red';
                removeBtn.onclick = () => removeDatasetFromSelection(index);
                item.appendChild(removeBtn);
                selectedContainer.appendChild(item);
            });
        }
    };

    const addDatasetToSelection = (dataset) => {
        if (!selectedDatasets.some(ds => ds.id === dataset.id)) {
            selectedDatasets.push(dataset);
            renderSelectedDatasets();
            searchInput.value = '';
            selectionContainer.innerHTML = '';
        }
    };
    
    const removeDatasetFromSelection = (index) => {
        selectedDatasets.splice(index, 1);
        renderSelectedDatasets();
    };

    // Aktyvių konsultacijų atvaizdavimas
    const renderActiveConsultations = () => {
        const consultations = JSON.parse(localStorage.getItem('consultations')) || [];
        activeConsultationsList.innerHTML = '';
        if (consultations.length === 0) {
            activeConsultationsList.innerHTML = '<p>Aktyvių konsultacijų nerasta.</p>';
            return;
        }
        consultations.forEach(consult => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            card.innerHTML = `
                <h3>Konsultacija dėl: ${consult.purpose}</h3>
                <p><strong>Būsena:</strong> <span class="status-pending">${consult.status}</span></p>
                <p><strong>Pateikta:</strong> ${new Date(consult.id).toLocaleDateString('lt-LT')}</p>
                ${consult.response ? `<div class="provider-response"><strong>Teikėjo atsakymas:</strong> ${consult.response}</div>` : ''}
            `;
            activeConsultationsList.appendChild(card);
        });
    };

    // Konsultacijos pateikimas
    submitBtn.addEventListener('click', () => {
        const purpose = document.getElementById('consult-dataPurpose').value;
        const legalBasis = document.getElementById('consult-legalBasis').value;

        if (!purpose) {
            alert('Prašome nurodyti duomenų tvarkymo tikslą.');
            return;
        }

        const newConsultation = {
            id: Date.now(),
            purpose: purpose,
            legalBasis: legalBasis,
            requestedDatasets: selectedDatasets,
            status: 'Pateikta, laukia teikėjo atsakymo',
            response: null
        };

        const existingConsultations = JSON.parse(localStorage.getItem('consultations')) || [];
        existingConsultations.push(newConsultation);
        localStorage.setItem('consultations', JSON.stringify(existingConsultations));

        alert('Konsultacija sėkmingai pateikta!');
        renderActiveConsultations();
        document.getElementById('consultation-form').reset();
        selectedDatasets = [];
        renderSelectedDatasets();
    });

    // Pradinis puslapio užkrovimas
    renderSelectedDatasets();
    renderActiveConsultations();
});
