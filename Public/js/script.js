/*document.addEventListener('DOMContentLoaded', async () => {
    // Antag, at brugeren er logget ind, og deres e-mail gemmes i en cookie eller JWT.
    const email = getLoggedInUserEmail(); // Implementér denne funktion til at få brugerens e-mail fra JWT eller cookie.

    try {
        const response = await fetch(`/feedback/${email}`);
        if (response.ok) {
            const feedbacks = await response.json();
            const feedbackList = document.getElementById('feedback-list');

            feedbackList.innerHTML = ''; // Tøm liste, hvis der allerede er elementer
            feedbacks.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.feedback;
                feedbackList.appendChild(li);
            });
        } else {
            console.error('Fejl ved hentning af feedback:', response.statusText);
        }
    } catch (error) {
        console.error('Fejl under hentning af feedback:', error);
    }
});

// Funktion til at få den loggede brugers e-mail (skal implementeres)
function getLoggedInUserEmail() {
    // Eksempel: dekod JWT-token for at få e-mail
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
    }
    return null;
}
*/