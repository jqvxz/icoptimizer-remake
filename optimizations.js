const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let isRunning = false;

async function runCommand(command) {
    try {
        console.log(`Executing command: ${command}`);
        const { stdout } = await execAsync(command);
        console.log(`Command output: ${stdout}`);
        return `Successfully executed: ${command}\nOutput: ${stdout}`;
    } catch (error) {
        console.error(`Error executing command: ${command}\nError: ${error.message}`);
        return `Error executing command: ${command}\nError: ${error.message}`;
    }
}

const operationHandlers = {
    'clear-dns-cache': () => runCommand('ipconfig /flushdns'),
    'reset-network-adapter': () => runCommand('netsh winsock reset'),
    'reset-ip-stack': () => runCommand('netsh int ip reset'),
    'tcp-edit': tcpEdit,
    'clear-arp': () => runCommand('arp -d *'),
    'release-renew-ip': releaseRenew,
    'reset-firewall': () => runCommand('netsh advfirewall reset'),
    'kill-apps': killUselessApps,
    'modify-search': () => runCommand('reg add "HKEY_CURRENT_USER\\Software\\Policies\\Microsoft\\Windows\\Explorer" /v DisableSearchBoxSuggestions /t REG_DWORD /d 1 /f'),
    'disable-error-report': () => runCommand('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Windows Error Reporting\\LocalDumps" /v DoNotPromptForNonCriticalErrors /t REG_DWORD /d 1 /f'),
    'disable-telemetry': disableTelemetry,
    'disable-compatibility': () => runCommand('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\AppCompat" /v DisableUAR /t REG_DWORD /d 1 /f'),
    'disable-registry': () => runCommand('sc config RemoteRegistry start= disabled'),
    'disable-cortana': () => runCommand('reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f'),
    'disable-remote-management': () => runCommand('sc config WinRM start= disabled'),
    'disable-sticky-keys': disableStickyKeys,
    'restart-explorer': restartExplorer,
    'restart-audiosrv': restartAudiosrv,
    'disk-cleanup': () => runCommand('start /b cleanmgr /sagerun:1'),
    'clear-temp-bin': clearTempAndBin,
    'sfc-scan': () => runCommand('sfc /scannow'),
    'disable-startup-programs': disableStartupPrograms,
    'check-programs': checkProblematicPrograms,
};

async function executeOptimizations(operations, currentOperationCallback) {
    console.log('executeOptimizations called with operations:', operations);
    const results = [];
    isRunning = true;

    for (const operation of operations) {
        if (!isRunning) {
            console.log('Operations stopped by user');
            break;
        }
        console.log('Executing operation:', operation);
        currentOperationCallback(operation);

        try {
            const handler = operationHandlers[operation];
            if (!handler) {
                throw new Error(`Unknown operation: ${operation}`);
            }
            const result = await handler();
            console.log('Operation result:', result);
            results.push({ operation, result });
        } catch (error) {
            console.error(`Error in operation ${operation}:`, error);
            results.push({ operation, result: `Error in operation ${operation}: ${error.message}` });
        }
    }

    isRunning = false;
    console.log('All operations completed or stopped');
    return results;
}

async function killUselessApps() {
    const processesToKill = ['NewsAndInterests.exe', 'OneDrive.exe', 'ctfmon.exe', 'PhoneExperienceHost.exe', 'GrooveMusic.exe', 'Cortana.exe'];
    const results = await Promise.all(processesToKill.map(process => runCommand(`taskkill /f /im ${process}`)));
    return results.join('\n');
}

async function disableTelemetry() {
    const commands = [
        'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f',
        'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v DisableEnterpriseAuthProxy /t REG_DWORD /d 1 /f',
        'sc stop DiagTrack',
        'sc config DiagTrack start= disabled',
        'sc stop dmwappushservice',
        'sc config dmwappushservice start= disabled'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

async function disableStickyKeys() {
    const commands = [
        'reg add "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "Flags" /t REG_DWORD /d "506" /f',
        'reg add "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "StickyKeysEnabled" /t REG_DWORD /d "0" /f',
        'reg add "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "HotkeyTriggered" /t REG_DWORD /d "0" /f',
        'reg add "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "AudibleFeedback" /t REG_DWORD /d "0" /f',
        'reg add "HKCU\\Control Panel\\Accessibility" /v "KeyboardPreference" /t REG_DWORD /d "0" /f'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

async function tcpEdit() {
    const commands = [
        'netsh int tcp set global autotuninglevel=normal',
        'netsh int tcp set global chimney=enabled',
        'netsh int tcp set global dca=enabled',
        'netsh int tcp set global netdma=enabled',
        'netsh int tcp set global ecncapability=enabled,'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

async function releaseRenew() {
    await runCommand('ipconfig /release');
    return runCommand('ipconfig /renew');
}

async function restartExplorer() {
    await runCommand('cmd /c taskkill /f /im explorer.exe && start explorer.exe');
    return runCommand('tasklist | findstr /i "explorer.exe" || start explorer.exe');
}

async function restartAudiosrv() {
    await runCommand('net stop audiosrv');
    return runCommand('net start audiosrv');
}

async function clearTempAndBin() {
    const commands = [
        'del "%temp%\\*.*" /s /q /f',
        'rd /s /q C:\\$Recycle.Bin'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

async function disableStartupPrograms() {
    const programsToDisable = ['Microsoft Teams', 'Medal', 'Smartphone Link', 'Skype', 'Discord', 'Steam', 'Epic Games Launcher', 'Spotify', 'Dropbox', 'OneDrive', 'Google Drive', 'Adobe Creative Cloud', 'Origin', 'Slack', 'Zoom'];
    const registryKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const results = await Promise.all(programsToDisable.map(program => runCommand(`reg delete "${registryKey}" /v "${program}" /f`)));
    return results.join('\n');
}

async function checkProblematicPrograms() {
    const problematicKeywords = ['AhnLab', 'AVG', 'Avast', 'Bitdefender', 'F-Secure', 'G Data', 'K7', 'Kaspersky', 'Malwarebytes', 'McAfee', 'Norton', 'RAV', 'Surfshark', 'TotalAV', 'Trend Micro', 'Vba32', 'Webroot', 'ZoneAlarm'];
    const command = 'wmic product get name';
    
    try {
        const { stdout } = await execAsync(command);
        const installedPrograms = stdout.split('\n').map(line => line.trim()).filter(line => line && line !== 'Name');
        const foundPrograms = installedPrograms.flatMap(program => 
            problematicKeywords.filter(keyword => program.toLowerCase().includes(keyword.toLowerCase()))
                .map(keyword => `Found potentially problematic program: ${program} (matched keyword: ${keyword})`)
        );

        if (foundPrograms.length > 0) {
            alert(foundPrograms.join('\n'));
        } else {
            console.log("No potentially problematic programs found.");
        }
        
        return foundPrograms.join('\n') || "No potentially problematic programs found.";
    } catch (error) {
        console.error('Error executing WMIC command:', error);
        return 'Error checking installed programs';
    }
}

function stopOperations() {
    if (isRunning) {
        isRunning = false;
        console.log('Stopping optimization operations');
    }
}

module.exports = { executeOptimizations, stopOperations };
