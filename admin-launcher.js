const { exec } = require('child_process');
const path = require('path');
const electron = require('electron');
const appPath = path.join(__dirname, 'main.js');

// Comment or remove this line to run without admin
const command = `powershell.exe -Command "Start-Process '${electron}' -ArgumentList '${appPath}' -Verb RunAs"`;

process.env.ELECTRON_ENABLE_LOGGING = 'true';

// Execute
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});