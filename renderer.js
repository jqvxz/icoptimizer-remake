const { ipcRenderer } = require('electron');

// New variables for tracking progress and time
let totalOperations = 0;
let currentOperationIndex = 0;
let startTime;

// Wait for DOM to load and set up UI event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    // Send debug mode request
    document.getElementById('launch-debug').addEventListener('click', () => {
        console.log('Debug mode requested') 
        ipcRenderer.send('launch-debug')
    })
    
    // Cache DOM elements
    const executeButton = document.getElementById('execute-operations')
    const closeButton = document.getElementById('close-program')
    const restartButton = document.getElementById('restart-button')
    const breakButton = document.getElementById('break-button')
    const checkboxes = document.querySelectorAll('.checkbox')
    const currentOperationContainer = document.getElementById('current-operation-container')
    const currentOperationSpan = document.getElementById('current-operation')

    // Execute selected operations
    executeButton.addEventListener('click', () => {
        console.log('Execute event triggered')
        const selectedOperations = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.id)

        console.log('Selected operations:', selectedOperations)

        if (selectedOperations.length === 0) {
            ipcRenderer.send('show-custom-alert', {
                title: 'Information',
                message: 'Please select at least one option'
            });
            return;
        }

        // Initialize progress tracking
        totalOperations = selectedOperations.length;
        currentOperationIndex = 0;

        // Show operation status and disable button
        currentOperationContainer.style.display = 'block'
        currentOperationSpan.textContent = 'Executing operations now (0%)'
        executeButton.disabled = true

        // Record the start time
        startTime = new Date();

        console.log('Sending execute-operations to main process')
        ipcRenderer.send('execute-operations', selectedOperations)

        // Scroll to bottom after a delay
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            })
        }, 200)
    })

    // Send close app request
    closeButton.addEventListener('click', () => {
        console.log('Close event triggered')
        ipcRenderer.send('close-app')
    })

    // Send restart request
    restartButton.addEventListener('click', () => {
        console.log('Restart event triggered')
        ipcRenderer.send('restart-button')
    })

    // Send break request
    breakButton.addEventListener('click', () => {
        console.log('Break event triggered')
        ipcRenderer.send('break-button')
    })
})

// Update current operation in UI
ipcRenderer.on('current-operation', (event, operation) => {
    console.log('Received current-operation:', operation)
    const currentOperationSpan = document.getElementById('current-operation')
    currentOperationIndex++;
    const progress = Math.round((currentOperationIndex / totalOperations) * 100);
    currentOperationSpan.textContent = `${operation} (${progress}%)`
})

// Handle operation results
ipcRenderer.on('operation-results', (event, results) => {
    console.log('Operation Results:', results)
    const executeButton = document.getElementById('execute-operations')
    const currentOperationContainer = document.getElementById('current-operation-container')
    executeButton.disabled = false
    currentOperationContainer.style.display = 'none'

    // Calculate execution time
    const endTime = new Date();
    const executionTime = ((endTime - startTime) / 1000).toFixed(2);

    ipcRenderer.send('show-custom-alert', {
        title: 'Information',
        message: `Finished executing operations or interrupted in ${executionTime}s. Please restart.`
    });
})

// Handle operation errors
ipcRenderer.on('operation-error', (event, error) => {
    console.error('Operation Error:', error)
    const executeButton = document.getElementById('execute-operations')
    const currentOperationContainer = document.getElementById('current-operation-container')
    executeButton.disabled = false
    currentOperationContainer.style.display = 'none'
    ipcRenderer.send('show-custom-alert', {
        title: 'Warning',
        message: 'There was an error while executing operations'
    });
})

// Initialize dark mode settings
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle')

    // Apply saved dark mode preference
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode')
        darkModeToggle.checked = true
    }

    // Toggle dark mode on user input
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode')
            localStorage.setItem('dark-mode', 'enabled')
            console.log('Dark Mode enabled')
        } else {
            document.body.classList.remove('dark-mode')
            localStorage.setItem('dark-mode', 'disabled')
            console.log('Dark Mode disabled')
        }
    })
})
