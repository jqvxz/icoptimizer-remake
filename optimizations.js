const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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


async function executeOptimizations(operations, currentOperationCallback) {
    console.log('executeOptimizations called with operations:', operations);
    const results = [];

    for (const operation of operations) {
        console.log('Executing operation:', operation);
        currentOperationCallback(operation);
        let result;
        
        try {
            switch (operation) {
                // Network optimizations
                case 'clear-dns-cache':
                    result = await runCommand('ipconfig /flushdns');
                    break;
                case 'reset-network-adapter':
                    result = await runCommand('netsh winsock reset');
                    break;
                case 'reset-ip-stack':
                    result = await runCommand('netsh int ip reset');
                    break;
                case 'tcp-edit':
                    result = await runCommand('netsh int tcp set heuristics disabled');
                    break;
                case 'clear-arp':
                    result = await runCommand('arp -d *');
                    break;

                // General Windows optimizations
                case 'kill-apps':
                    result = await killUselessApps();
                    break;
                case 'modify-search':
                    result = await runCommand('reg add "HKEY_CURRENT_USER\\Software\\Policies\\Microsoft\\Windows\\Explorer" /v DisableSearchBoxSuggestions /t REG_DWORD /d 1 /f');
                    break;
                case 'disable-error-report':
                    result = await runCommand('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Windows Error Reporting\\LocalDumps" /v DoNotPromptForNonCriticalErrors /t REG_DWORD /d 1 /f');
                    break;
                case 'disable-telemetry':
                    result = await disableTelemetry();
                    break;
                case 'disable-compatibility':
                    result = await runCommand('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\AppCompat" /v DisableUAR /t REG_DWORD /d 1 /f');
                    break;
                case 'disable-registry':
                    result = await runCommand('sc config RemoteRegistry start= disabled');
                    break;
                case 'disable-cortana':
                    result = await runCommand('reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f');
                    break;
                case 'disable-remote-management':
                    result = await runCommand('sc config WinRM start= disabled');
                    break;
                case 'disable-sticky-keys':
                    result = await disableStickyKeys();
                    break;
                case 'restart-explorer':
                    result = await restartExplorer();
                    break;
                case 'restart-audiosrv':
                    result = await restartAudiosrv();
                    break;
                case 'disk-cleanup':
                    result = await runCommand('start /b cleanmgr /sagerun:1');
                    break;
                case 'clear-temp-bin':
                    result = await clearTempAndBin();
                    break;
                case 'check-programs':
                    result = await checkProblematicPrograms();
                    break;
                default:
                    result = `Unknown operation: ${operation}`;
            }
        } catch (error) {
            console.error(`Error in operation ${operation}:`, error);
            result = `Error in operation ${operation}: ${error.message}`;
        }

        console.log('Operation result:', result);
        results.push({ operation, result });
    }

    console.log('All operations completed');
    return results;
}

async function killUselessApps() {
    const processesToKill = [
        'NewsAndInterests.exe',
        'OneDrive.exe',
        'ctfmon.exe',
        'PhoneExperienceHost.exe',
        'GrooveMusic.exe',
        'Cortana.exe'
    ];

    const results = await Promise.all(processesToKill.map(process => 
        runCommand(`taskkill /f /im ${process}`)
    ));

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

async function restartExplorer() {
    await runCommand('taskkill /f /im explorer.exe');
    return runCommand('start explorer.exe');
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

// checkProblematicPrograms not ready yet - No ouput when executed

async function checkProblematicPrograms() {
    const problematicPrograms = [
        { name: 'McAfee', regKey: '{26C36889-3AE9-467D-8D32-79AF9D5E644A}' },
        { name: 'RAV Protection', regKey: '{A659376D-C397-4F52-9479-6B189509045E}' },
        { name: 'Norton Security', regKey: '{8C704500-4BF2-11D1-9F44-00C04FC295EE}' },
        { name: 'Avast Antivirus', regKey: '{E6F465A5-1FB8-406F-99C0-7E3E10C4B55A}' },
        { name: 'Kaspersky Security', regKey: '{2F617D7C-D9AA-4D74-9182-2A0F36EEDCB4}' },
        { name: 'AVG Antivirus', regKey: '{B056A5B5-1E98-4872-8779-5BB072220D6E}' }
    ];

    const results = await Promise.all(problematicPrograms.map(async program => {
        const command = `reg query "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${program.regKey}" /v DisplayName`;
        try {
            await execAsync(command);
            return `Please remove ${program.name}`;
        } catch (error) {
            return `${program.name} is not installed`;
        }
    }));

    return results.join('\n');
}

module.exports = {
    executeOptimizations
};