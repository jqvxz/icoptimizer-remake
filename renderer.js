const { ipcRenderer } = require('electron');

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
            alert('Please select at least one option')
            return
        }

        // Show operation status and disable button
        currentOperationContainer.style.display = 'block'
        currentOperationSpan.textContent = 'Executing operations now'
        executeButton.disabled = true

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
    currentOperationSpan.textContent = operation
})

// Handle operation results
ipcRenderer.on('operation-results', (event, results) => {
    console.log('Operation Results:', results)
    const executeButton = document.getElementById('execute-operations')
    const currentOperationContainer = document.getElementById('current-operation-container')
    executeButton.disabled = false
    currentOperationContainer.style.display = 'none'
    alert('Please restart your PC for all the changes to take effect') // Adding different output for interrupted
})

// Handle operation errors
ipcRenderer.on('operation-error', (event, error) => {
    console.error('Operation Error:', error)
    const executeButton = document.getElementById('execute-operations')
    const currentOperationContainer = document.getElementById('current-operation-container')
    executeButton.disabled = false
    currentOperationContainer.style.display = 'none'
    alert('An error occurred while executing')
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
        } else {
            document.body.classList.remove('dark-mode')
            localStorage.setItem('dark-mode', 'disabled')
        }
    })
})
