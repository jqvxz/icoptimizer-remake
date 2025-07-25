const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const execAsync = promisify(exec);
const path = require('path');
const os = require('os');
let isRunning = false;

// Function to run commands and get the output
async function runCommand(command) {
    try {
        console.log(`Current command: ${command}`);
        const { stdout } = await execAsync(command);
        console.log(`Command output: ${stdout}`);
        return `Successfully executed: ${command}\nOutput: ${stdout}`;

    } catch (error) {
        console.error(`Error executing command: ${command}\nError: ${error.message}`);
        return `Error executing command: ${command}\nError: ${error.message}`;
    }
}

// Object to handle each specific optimization operation
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
    'disable-compatibility': () => runCommand('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\AppData" /v DisableUAR /t REG_DWORD /d 1 /f'),
    'disableregistry': () => runCommand('sc config RemoteRegistry start= disabled'),
    'disable-cortana': () => runCommand('reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f'),
    'disable-copilot' : () => runCommand('reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot" /v TurnOffWindowsCopilot /t REG_DWORD /d 1 /f'),
    'disable-remote-management': () => runCommand('sc config WinRM start= disabled'),
    'disable-sticky-keys': disableStickyKeys,
    'restart-explorer': restartExplorer,
    'restart-audiosrv': restartAudiosrv,
    'disk-cleanup': () => runCommand('start /b cleanmgr /sagerun:1'),
    'clear-temp-bin': clearTempAndBin,
    'sfc-scan': () => runCommand('sfc /scannow'),
    'disable-startup-programs': disableStartUpPrograms,
    'check-programs': checkProblematicPrograms,
    'disable-win-update': disableUpdate,
    'disable-gamebar': disableGameBar,
    'change-powerplan': changePowerplan,
    'disable-onedrive': disableOneDrive,
    'clear-update': clearUpdate,
    'create-netfile': netfileCreate,
    'clean-registery': clearReg,
    'create-restore': createRestorePoint,
    'backup-reg': backupRegistry
};

// Main function to execute a list of operations
async function executeOptimizations(operations, currentOperationCallback) {
    console.log('executeOptimizations called with operations:', operations);
    const results = [];
    isRunning = true;

    for (const operation of operations) {
        if (!isRunning) {
            console.log('Script was stopped by user');
            break;
        }
        console.log('Current operation:', operation);
        currentOperationCallback(operation);

        try {
            const handler = operationHandlers[operation];
            if (!handler) {
                throw new Error(`Unknown operation: ${operation}`);
            }
            const result = await handler();
            console.log('Result:', result);
            results.push({ operation, result });

        } catch (error) {
            console.error(`Error while trying operation ${operation}:`, error);
            results.push({ operation, result: `Error in operation ${operation}: ${error.message}` });
        }
    }

    isRunning = false;
    console.log('Finished operations or stopped by user');
    return results;
}

// Function to kill unnecessary apps
async function killUselessApps() {
    const processesToKill = ['NewsAndInterests.exe', 'OneDrive.exe', 'ctfmon.exe', 'PhoneExperienceHost.exe', 'GrooveMusic.exe', 'Cortana.exe'];
    const results = await Promise.all(processesToKill.map(process => runCommand(`taskkill /f /im ${process}`)));
    return results.join('\n');
}

// Function to disable telemetry services
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

// Function to disable sticky keys accessibility feature
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

// Function to disable Windows updates
async function disableUpdate() {
    const commands = [
        'sc config wuauserv start= disabled',
        'net stop wuauserv',
        'reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate /t REG_DWORD /d 1 /f'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to clear Windows update cache
async function clearUpdate() {
    const commands = [
        'net stop wuauserv',
        'net stop bits',
        'rd /s /q C:\\Windows\\SoftwareDistribution',
        'net start wuauserv',
        'net start bits'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

async function clearReg() {
    const commands = [
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ComDlg32\\OpenSavePidlMRU" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\\WordWheelQuery" /f',
        'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Map Network Drive MRU" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\MountPoints2" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v "Start_TrackProgs" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v "Start_TrackDocs" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v "RecentDocsHistory" /f',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Applets\\Regedit" /v "LastKey" /f'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.map(r => r.stdout).join('\n');
}

// Function to disable Game Bar
async function disableGameBar() {
    const commands = [
        'reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f',
        'reg add "HKEY_CURRENT_USER\\System\\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f',
        'reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" /v AllowGameDVR /t REG_DWORD /d 0 /f'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to disable OneDrive
async function disableOneDrive() {
    const commands = [
        'taskkill /f /im OneDrive.exe',
        'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\OneDrive" /v DisableFileSyncNGSC /t REG_DWORD /d 1 /f',
        'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\OneDrive" /v DisableLibrariesDefaultSaveToOneDrive /t REG_DWORD /d 1 /f'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to change the power plan settings
async function changePowerplan() {
    const commands = [
        'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
        'powercfg /change standby-timeout-ac 0',
        'powercfg /change monitor-timeout-ac 0'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to modify TCP settings
async function tcpEdit() {
    const commands = [
        'netsh int tcp set global autotuninglevel=normal',
        'netsh int tcp set global dca=enabled',
        'netsh int tcp set global netdma=enabled',
        'netsh int tcp set global ecncapability=enabled,'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to release and renew IP
async function releaseRenew() {
    await runCommand('ipconfig /release');
    return runCommand('ipconfig /renew');
}

// Function to restart Windows Explorer
async function restartExplorer() {
    await runCommand('cmd /c taskkill /f /im explorer.exe && start explorer.exe');
    return runCommand('tasklist | findstr /i "explorer.exe" || start explorer.exe');
}

// Function to restart audio service
async function restartAudiosrv() {
    await runCommand('net stop audiosrv');
    return runCommand('net start audiosrv');
}

// Function to clear temporary files and recycle bin
async function clearTempAndBin() {
    const commands = [
        'del "%temp%\\*.*" /s /q /f',
        'rd /s /q C:\\$Recycle.Bin'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to disable startup programs
async function disableStartUpPrograms() {
    const programs = [
        'Microsoft Teams', 'Medal', 'Smartphone Link', 'Skype', 'Discord', 'Steam', 
        'Epic Games Launcher', 'Spotify', 'Dropbox', 'OneDrive', 'Google Drive', 
        'Adobe Creative Cloud', 'Origin', 'Slack', 'Zoom'
    ];
    const registryKeys = [
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    ];
    const results = await Promise.all(programs.flatMap(p => 
        registryKeys.map(key => 
            new Promise((resolve) => {
                require('child_process').exec(`reg delete "${key}" /v "${p}" /f`, (error, stdout, stderr) => {
                    if (error) {
                        resolve(`Failed: ${p} in ${key} - ${error.message.trim()}`);
                    } else {
                        resolve(`Disabled: ${p} in ${key}`);
                    }
                });
            })
        )
    ));
    return results.join('\n');
}

// Function to check for anti virus programs
async function checkProblematicPrograms() {
    const programsToCheck = [
        'AhnLab', 'AVG', 'Avast', 'Bitdefender', 'F-Secure', 'G Data', 'K7', 
        'Kasper sky', 'Malwarebytes', 'McAfee', 'Norton', 'RAV', 'Surfshark', 
        'TotalAV', 'Trend Micro', 'Vba32', 'Webroot', 'ZoneAlarm'
    ];
    const command = `power shell -Command "Get ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select_Object DisplayName"`;
    const output = await runCommand(command);

    const installedPrograms = output.split('\n').filter(line => line.trim() !== "").map(line => line.trim());
    const detectedPrograms = programsToCheck.filter(program => installedPrograms.some(installed => installed.includes(program)));

    if (detectedPrograms.length > 0) {
        await runCommand(`power shell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('The following programs were found: ${detectedPrograms.join(', ')}', 'icoptimizer')"`);
    }
    return detectedPrograms.join(', ');
}

// Function to create a network diagnostic file
async function netfileCreate() {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filePath = path.join(desktopPath, 'ic-netfile.txt');
    
    try {
        let output = '';
        output += `PC: ${os.hostname()}\n`;
        output += `Username: ${os.userInfo().username}\n`;
        output += `OS: Windows ${os.release()}\n\n`;

        const commands = [
            { name: 'IP Configuration', cmd: 'ipconfig /all' },
            { name: 'Network Adapters', cmd: 'wmic nic get name,macaddress,netconnectionstatus' },
            { name: 'Routing Table', cmd: 'route print' },
            { name: 'Active Network Connections', cmd: 'netstat -ano' }
        ];

        for (const command of commands) {
            output += `${command.name}\n`;
            try {
                const cmdOutput = await new Promise((resolve, reject) => {
                    exec(command.cmd, (error, stdout) => {
                        if (error) reject(error);
                        resolve(stdout);
                    });
                });
                output += cmdOutput + '\n\n';
            } catch (cmdError) {
                output += `Error executing ${command.name}: ${cmdError.message}\n\n`;
            }
        }
        await fs.promises.writeFile(filePath, output);
        console.log(`Network file created at: ${filePath}`);

    } catch (error) {
        console.error(`Error creating network file: ${error.message}`);
    }
}

// Function to create a Windows Restore Point
async function createRestorePoint() {
    const commands = [
        'power shell.exe -Command "Checkpoint-Computer -Description \'Restore Point created by icoptimizer\' -RestorePointType \'MODIFY_SETTINGS\'"'
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.map(r => r.stdout).join('\n');
}

// Function to backup the Windows registry
async function backupRegistry() {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filePath = path.join(desktopPath, 'registryBackup.reg');
    const commands = [
        `reg export HKLM "${filePath}" /y`,
        `reg export HKCU "${filePath}" /y /reg:64`
    ];
    const results = await Promise.all(commands.map(runCommand));
    return results.join('\n');
}

// Function to stop all ongoing operations
function stopOperations() {
    if (isRunning) {
        isRunning = false;
        console.log('Stopping optimization operations');
    }
}

module.exports = { executeOptimizations, stopOperations };