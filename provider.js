document.addEventListener('DOMContentLoaded', () => {
    // ... (dataStructure ir elementų apibrėžimai lieka tie patys) ...

    const generateAgreementText = (agreement) => { /* ... (identiška funkcija iš script.js) ... */ };

    const openAgreementModal = (uid) => {
        // ... (atidarymo logika lieka ta pati) ...
        document.getElementById('agreement-view-text').textContent = generateAgreementText(agreement);
        // ...
        const actionsContainer = document.getElementById('agreement-modal-actions');
        actionsContainer.innerHTML = ''; 

        if (agreement.status === "Pateikta, laukia peržiūros") {
            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn-success';
            approveBtn.textContent = 'Patvirtinti sutarties projektą'; // Pakeistas tekstas
            approveBtn.onclick = () => updateAgreementStatus(uid, 'Sutarties projektas patvirtintas');
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'btn-danger';
            rejectBtn.textContent = 'Atmesti';
            rejectBtn.onclick = () => {
                const reason = prompt("Įveskite atmetimo priežastį:");
                if (reason) updateAgreementStatus(uid, 'Atmesta', reason);
            };
            actionsContainer.appendChild(approveBtn);
            actionsContainer.appendChild(rejectBtn);
        }
        agreementModal.style.display = 'flex';
    };

    const updateAgreementStatus = (uid, status, reason = null) => { /* ... (logika nepakito) ... */ };

    const renderLists = () => {
        // ... (konsultacijų logika lieka nepakitusi) ...
        
        // Sutarčių atvaizdavimas
        allAgreements.forEach(agreement => {
            // ...
            let statusText = agreement.status || 'Pateikta, laukia peržiūros';
            // ...
            card.innerHTML = `
                <h3>Sutartis su: ...</h3>
                <p><strong>Statusas:</strong> <span class="${statusClass}">${statusText}</span></p>
                <button class="btn-secondary" onclick="window.openAgreementModal('${agreement.uid}')">Peržiūrėti</button>
            `;
            // ...
        });
    };
    
    // ... (likusi dalis)
});
