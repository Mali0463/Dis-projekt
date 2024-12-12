document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/feedback/user');
        if (!response.ok) {
            throw new Error('Kunne ikke hente feedback.');
        }

        const feedbacks = await response.json();
        const feedbackList = document.getElementById('feedback-list');
        feedbackList.innerHTML = '';

        feedbacks.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.feedback;
            feedbackList.appendChild(li);
        });
    } catch (err) {
        console.error('Fejl:', err);
        alert('Kunne ikke hente feedback. Prøv igen senere.');
    }
});

document.getElementById('logout-button').addEventListener('click', () => {
    fetch('/logout', { method: 'POST' })
        .then(() => (window.location.href = '/login.html'))
        .catch(err => console.error('Fejl under logout:', err));
});
