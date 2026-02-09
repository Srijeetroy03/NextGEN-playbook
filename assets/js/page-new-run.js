window.startPlanningWorkflow = function() {
    const promptTextarea = document.querySelector('textarea');
    const prompt = promptTextarea ? promptTextarea.value.trim() : '';

    if (!prompt) {
        alert('Please enter a planning prompt before generating the workflow.');
        return;
    }

    const encodedPrompt = encodeURIComponent(prompt);
    window.location.hash = `#/workflows?prompt=${encodedPrompt}&autostart=true`;
};

window.initPage = function() {
    // New run page uses inline onclick handler for startPlanningWorkflow.
};
