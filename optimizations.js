const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
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
                    result = await tcpEdit();
                    break;
                case 'clear-arp':
                    result = await runCommand('arp -d *');
                    break;
                case 'release-renew-ip':
                    result = await releaseRenew();
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
                case 'sfc-scan':
                    result = await sfcScan();
                    break;
                case 'disable-startup-programs':
                    result = await disableStartupPrograms();
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

async function sfcScan(){
    return runCommand('sfc /scannow');
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

async function restartExplorer() { // different approach to restart (not tested on w11)
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
  const programsToDisable = [
    'Microsoft Teams',
    'Medal',
    'Smartphone Link',
    'Skype',
    'Discord',
    'Steam',
    'Epic Games Launcher',
    'Spotify',
    'Dropbox',
    'OneDrive',
    'Google Drive',
    'Adobe Creative Cloud',
    'Origin',
    'Slack',
    'Zoom'
  ];

  const results = await Promise.all(programsToDisable.map(program => 
    runCommand(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${program}" /f`)
  ));

  return results.join('\n');
}
  
// checkProblematicPrograms not ready yet - No ouput when executed but working

async function checkProblematicPrograms() {
    const problematicPrograms = [
        { name: 'AhnLab V3 Internet Security', regKey: '{A1234567-89AB-CDEF-0123-456789ABCDEF}' },
        { name: 'AVG Antivirus', regKey: '{B056A5B5-1E98-4872-8779-5BB072220D6E}' },
        { name: 'Avast Antivirus', regKey: '{E6F465A5-1FB8-406F-99C0-7E3E10C4B55A}' },
        { name: 'Bitdefender', regKey: '{C4124E95-5061-4776-8D20-84A40CF79E8D}' },
        { name: 'F-Secure Total', regKey: '{F1234567-89AB-CDEF-0123-456789ABCDEF}' },
        { name: 'G Data Internet Security', regKey: '{G1234567-89AB-CDEF-0123-456789ABCDEF}' },
        { name: 'K7 Computing Total Security', regKey: '{K7123456-7890-ABCD-EF01-23456789ABCD}' },
        { name: 'Kaspersky Security', regKey: '{2F617D7C-D9AA-4D74-9182-2A0F36EEDCB4}' },
        { name: 'Malwarebytes', regKey: '{8A461A59-5A3C-4A3E-9E99-1A89B9D48D66}' },
        { name: 'McAfee', regKey: '{26C36889-3AE9-467D-8D32-79AF9D5E644A}' },
        { name: 'Norton Security', regKey: '{8C704500-4BF2-11D1-9F44-00C04FC295EE}' },
        { name: 'RAV Protection', regKey: '{A659376D-C397-4F52-9479-6B189509045E}' },
        { name: 'Surfshark Antivirus', regKey: '{D4B7E9F1-5A3E-4B2F-9C8D-1A2B3C4D5E6F}' },
        { name: 'TotalAV', regKey: '{1AD39C6F-6A4F-4E50-A9C0-0E6A9C1A9E77}' },
        { name: 'Trend Micro Titanium', regKey: '{T1234567-89AB-CDEF-0123-456789ABCDEF}' },
        { name: 'Vba32 AntiVirus', regKey: '{V1234567-89AB-CDEF-0123-456789ABCDEF}' },
        { name: 'Webroot SecureAnywhere', regKey: '{W1234567-89AB-CDEF-0123-456789ABCDEF}' },
        { name: 'ZoneAlarm', regKey: '{Z1234567-89AB-CDEF-0123-456789ABCDEF}' }
    ];

    const results = await Promise.all(problematicPrograms.map(async program => {
        const command = `reg query "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${program.regKey}" /v DisplayName`;
        try {
            await execAsync(command);
            return `Found ${program.name}`;
        } catch (error) {
            return `${program.name} is not installed`;
        }
    }));

    const installedPrograms = results.filter(result => result.startsWith('Found'));
    if (installedPrograms.length > 0) {
        alert(installedPrograms.join('\n'));
    }

    return results.join('\n');
}


module.exports = {
    executeOptimizations 
};