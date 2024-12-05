document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();

    // Load all employees for dropdown
    async function loadEmployees() {
        try {
            const response = await fetch('/employees');
            if (response.ok) {
                const employees = await response.json();
                console.log("Hentede medarbejdere:", employees); // Debug punkt: Log hentede medarbejdere

                const employeeSelect = document.getElementById('feedbackRecipient');
                if (!employeeSelect) {
                    console.error('Dropdown-menuen kunne ikke findes i DOM. Kontroller elementets id.');
                    return;
                }

                employeeSelect.innerHTML = ''; // Sørg for at rydde eventuelle eksisterende options

                // Tilføj en standard 'Vælg medarbejder' option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Vælg medarbejder';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                employeeSelect.appendChild(defaultOption);

                // Tilføj medarbejdere til dropdown-menuen
                employees.forEach(employee => {
                    const option = document.createElement('option');
                    option.value = employee.email;
                    option.textContent = employee.email;
                    employeeSelect.appendChild(option);
                });
            } else {
                console.error('Fejl ved hentning af medarbejdere:', response.statusText);
                alert('Fejl ved hentning af medarbejdere. Prøv igen senere.');
            }
        } catch (error) {
            console.error('Fejl under hentning af medarbejdere:', error);
            alert('Der opstod en fejl under hentning af medarbejdere. Prøv igen.');
        }
    }

    // Funktion til at sende feedback
    document.getElementById('giveFeedbackButton').addEventListener('click', async () => {
        const recipientEmail = document.getElementById('feedbackRecipient').value;
        const feedbackText = document.getElementById('feedbackText').value.trim();

        if (!recipientEmail || !feedbackText) {
            alert('Begge felter er påkrævet for at give feedback.');
            return;
        }

        try {
            const response = await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipient_email: recipientEmail, feedback: feedbackText }),
            });

            if (response.ok) {
                alert('Feedback givet med succes!');
                loadFeedback(); // Opdater feedback-listen
            } else {
                const errorData = await response.json();
                console.error("Fejl fra server:", errorData);
                alert(`Fejl: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Fejl under indsendelse af feedback:', error);
            alert('Der opstod en fejl. Prøv igen.');
        }
    });
});
