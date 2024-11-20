function showFeedback(categoryId) {
    // Hide all feedback categories
    const categories = document.querySelectorAll('.feedback-category');
    categories.forEach(category => {
        category.classList.add('hidden');
    });

    // Show the selected feedback category
    const selectedCategory = document.getElementById(categoryId);
    if (selectedCategory) {
        selectedCategory.classList.remove('hidden');
    }
}
