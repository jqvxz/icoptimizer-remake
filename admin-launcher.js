const { exec } = require('child_process');
const path = require('path');
const electron = require('electron');
const appPath = path.join(__dirname, 'main.js');

// Run with admin command (remove if u want to run without)
const command = `powershell.exe -Command "Start-Process '${electron}' -ArgumentList '${appPath}' -Verb RunAs"`;

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