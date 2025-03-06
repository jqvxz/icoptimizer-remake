const { app } = require('electron');
const { Client } = require('discord-rpc');

// Initialize Discord Rich Presence client
const CLIENT_ID = '1312025186861842502'; 
const rpc = new Client({ transport: 'ipc' });

rpc.on('ready', () => {
    console.log('Discord Rich Presence is ready');

    // Set activity details and buttons
    rpc.setActivity({
        details: "Windows optimizer by jqvon",
        state: "Version 1.0.2 - stable", 
        startTimestamp: new Date(),
        largeImageKey: 'app_icon', 
        largeImageText: 'icoptimizer',
        buttons: [
            { label: "Discord", url: "https://discord.gg/enf9WY5pPn/" }, 
            { label: "Source", url: "https://github.com/jqvxz/icoptimizer-remake/" }, 
        ]
    });

    console.log('Rich Presence set');
});

// Handle errors 
rpc.on('error', (error) => {
    console.error('Could not set Rich Presence:', error);
});

// Log in to Discord
rpc.login({ clientId: CLIENT_ID }).catch(console.error);

// Clean before quitting
app.on('before-quit', () => {
    rpc.destroy();
});
