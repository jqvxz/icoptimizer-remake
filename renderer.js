const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    const executeButton = document.getElementById('execute-operations');
    const closeButton = document.getElementById('close-program');
    const restartButton = document.getElementById('restart-button'); // New restart button
    const checkboxes = document.querySelectorAll('.checkbox');
    const currentOperationContainer = document.getElementById('current-operation-container');
    const currentOperationSpan = document.getElementById('current-operation');

    // Execute operations button event listener
    executeButton.addEventListener('click', () => {
        console.log('Execute button clicked');
        const selectedOperations = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.id);

        console.log('Selected operations:', selectedOperations);

        if (selectedOperations.length === 0) {
            alert('Please select at least one option');
            return;
        }

        currentOperationContainer.style.display = 'block';
        currentOperationSpan.textContent = 'Starting...';
        executeButton.disabled = true;

        console.log('Sending execute-operations message to main process');
        ipcRenderer.send('execute-operations', selectedOperations);

        // Scroll to the bottom after 0.2 seconds
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 200);
    });

    // Close application button event listener
    closeButton.addEventListener('click', () => {
        console.log('Close button clicked');
        ipcRenderer.send('close-app');
    });

    // Restart application button event listener
    restartButton.addEventListener('click', () => {
        console.log('Restart button clicked');
        ipcRenderer.send('restart-button'); // Send message to main process to restart
    });
});

// IPC listeners for current operation, results, and errors
ipcRenderer.on('current-operation', (event, operation) => {
    console.log('Received current-operation:', operation);
    const currentOperationSpan = document.getElementById('current-operation');
    currentOperationSpan.textContent = operation;
});

ipcRenderer.on('operation-results', (event, results) => {
    console.log('Operation Results:', results);
    const executeButton = document.getElementById('execute-operations');
    const currentOperationContainer = document.getElementById('current-operation-container');
    executeButton.disabled = false;
    currentOperationContainer.style.display = 'none';
    alert('All optimizations were executed successfully (Please restart your PC)');
});

ipcRenderer.on('operation-error', (event, error) => {
    console.error('Operation Error:', error);
    const executeButton = document.getElementById('execute-operations');
    const currentOperationContainer = document.getElementById('current-operation-container');
    executeButton.disabled = false;
    currentOperationContainer.style.display = 'none';
    alert('An error occurred while executing');
});

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Check for saved preference in localStorage
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Add event listener to toggle dark mode
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('dark-mode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('dark-mode', 'disabled');
        }
    });
});
