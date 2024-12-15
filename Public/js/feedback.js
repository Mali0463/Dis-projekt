document.addEventListener('DOMContentLoaded', () => {
    const userEmail = 'y@live.dk'; // Hardcodet test - her skal brugerens e-mail dynamisk indsættes

    fetch(`/feedback/user?email=${encodeURIComponent(userEmail)}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Fejl ved hentning af feedback.');
            }
            return response.json();
        })
        .then((data) => {
            const feedbackContainer = document.getElementById('feedback-container');
            feedbackContainer.innerHTML = ''; // Rens tidligere feedback

            if (data.length === 0) {
                feedbackContainer.textContent = 'Ingen feedback fundet.';
            } else {
                data.forEach((item) => {
                    const feedbackItem = document.createElement('p');
                    feedbackItem.textContent = item.feedback;
                    feedbackContainer.appendChild(feedbackItem);
                });
            }
        })
        .catch((error) => {
            console.error('Fejl:', error.message);
            alert('Kunne ikke hente feedback. Prøv igen senere.');
        });
});