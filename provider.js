document.addEventListener('DOMContentLoaded', () => {
    // Duomenys reikalingi sutarties teksto atkūrimui peržiūroje
    const dataStructure = { /* ... nepakito ... */ };
    
    // --- ELEMENTAI ---
    const contractsList = document.getElementById('contracts-list');
    const agreementModal = document.getElementById('agreement-view-modal');

    // --- SUTARČIŲ LOGIKA ---
    const openAgreementModal = (uid) => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreement = allAgreements.find(a => a && a.uid === uid);
        if (!agreement) { alert('Klaida: sutartis nerasta.'); return; }

        // Atkuriame sutarties tekstą
        let agreementText = `AUTOMATIZUOTA DUOMENŲ TEIKIMO SUTARTIS\n...`; // Sutrumpinta dėl aiškumo
        
        document.getElementById('agreement-view-text').textContent = agreementText;
        document.getElementById('agreement-view-json').textContent = JSON.stringify(agreement, null, 2);

        // Mygtukų logika
        const actionsContainer = document.getElementById('agreement-modal-actions');
        actionsContainer.innerHTML = ''; // Išvalome senus mygtukus

        if (agreement.status === "Pateikta, laukia peržiūros") {
            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn-success';
            approveBtn.textContent = 'Patvirtinti sutartį';
            approveBtn.onclick = () => updateAgreementStatus(uid, 'Patvirtinta');
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'btn-danger';
            rejectBtn.textContent = 'Atmesti sutartį';
            rejectBtn.onclick = () => {
                const reason = prompt("Įveskite atmetimo priežastį:");
                if (reason) updateAgreementStatus(uid, 'Atmesta', reason);
            };

            actionsContainer.appendChild(approveBtn);
            actionsContainer.appendChild(rejectBtn);
        }

        agreementModal.style.display = 'flex';
    };

    const updateAgreementStatus = (uid, status, reason = null) => {
        let allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        const agreementIndex = allAgreements.findIndex(a => a.uid === uid);
        if (agreementIndex > -1) {
            allAgreements[agreementIndex].status = status;
            if (reason) {
                allAgreements[agreementIndex].rejectionReason = reason;
            }
            localStorage.setItem('agreements', JSON.stringify(allAgreements));
            renderLists(); // Atnaujiname sąrašą
            agreementModal.style.display = 'none'; // Uzdarome langą
        }
    };

    // --- RENDERINIMO FUNKCIJA (Apjungianti viską) ---
    const renderLists = () => {
        const allAgreements = JSON.parse(localStorage.getItem('agreements')) || [];
        // ... (likusi konsultacijų ir archyvo renderinimo logika)

        // Sutarčių atvaizdavimas
        if (contractsList) {
            contractsList.innerHTML = allAgreements.length ? '' : '<p>Pateiktų sutarčių nerasta.</p>';
            allAgreements.forEach(agreement => {
                if (!agreement) return;

                let statusClass = 'status-pending';
                let statusText = agreement.status || 'Laukia peržiūros';
                if (statusText === 'Patvirtinta') statusClass = 'status-approved';
                if (statusText === 'Atmesta') statusClass = 'status-rejected';

                const card = document.createElement('div');
                card.className = `contract-card ${statusClass}-border`;
                card.innerHTML = `
                    <h3>Sutartis su: ${agreement.assignee['ex:companyName']}</h3>
                    <p><strong>Statusas:</strong> <span class="${statusClass}">${statusText}</span></p>
                    <button class="btn-secondary" onclick="window.openAgreementModal('${agreement.uid}')">Peržiūrėti</button>
                `;
                contractsList.appendChild(card);
            });
        }
    };

    // --- PRADINIS PALEIDIMAS ---
    window.openAgreementModal = openAgreementModal;
    // ... (kitų funkcijų priskyrimas window objektui)
    renderLists();
});
