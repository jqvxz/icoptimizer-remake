const { app } = require('electron');
const { Client } = require('discord-rpc');

const CLIENT_ID = '1312025186861842502'; 

const rpc = new Client({ transport: 'ipc' });

rpc.on('ready', () => {
    console.log('Discord Rich Presence is ready');

    // Set activity
    rpc.setActivity({
        details: "Windows optimizer by jqvon",
        state: "Running icoptimizer",
        startTimestamp: new Date(),
        largeImageKey: 'app_icon', 
        largeImageText: 'icoptimizer',
        buttons: [
            { label: "Website", url: "https://jqvxz.github.io/web/" }, 
            { label: "Source", url: "https://github.com/jqvxz/icoptimizer-remake/" }, 
        ]
    });

    console.log('Rich Presence set');
});

rpc.on('error', (error) => {
    console.error('An error occurred with Discord RPC:', error);
});

rpc.login({ clientId: CLIENT_ID }).catch(console.error);

app.on('before-quit', () => {
    rpc.destroy();
});
