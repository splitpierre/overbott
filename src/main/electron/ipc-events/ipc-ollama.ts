import { ipcMain } from 'electron';
import { exec } from 'child_process';

// reboots ollama service, issue: systemctl restart ollama
ipcMain.on('ollama-reboot', () => {
  console.log('ollama-reboot');
  exec('systemctl restart ollama', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
});

// ollama start
ipcMain.on('ollama-start', () => {
  console.log('ollama-start');
  exec('systemctl start ollama', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
});

// ollama stop
ipcMain.on('ollama-stop', () => {
  console.log('ollama-stop');
  exec('systemctl stop ollama', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
});
