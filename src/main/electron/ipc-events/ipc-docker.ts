import { ipcMain, dialog } from 'electron';
import dockerServices from '../../data/docker-services';
import DockerProvider from '../../providers/docker';

const Docker = require('dockerode');

// docker start service
ipcMain.on('docker-start', async (event, service) => {
  console.log('docker-start', service);
  await DockerProvider.startService(
    dockerServices[service as keyof typeof dockerServices],
  );
});

// docker stop service
ipcMain.on('docker-stop', (event, service) => {
  console.log('docker-stop', service);

  DockerProvider.stopContainer(
    dockerServices[service as keyof typeof dockerServices].name,
  );
});

// remove docker container
ipcMain.on('docker-remove', (event, service: keyof typeof dockerServices) => {
  console.log('docker-remove', service);
  DockerProvider.removeService(dockerServices[service]);
});

// inspect docker container
ipcMain.on('docker-inspect', (event, service) => {
  console.log('docker-inspect', service);
  const docker = new Docker();
  const container = docker.getContainer(service);
  container.inspect((err: { message: string }, data: any) => {
    if (err) {
      console.error(err);
      dialog.showErrorBox('Docker Inspect Error', err.message);
      event.returnValue = err.message;
    }
    console.log(data);
    event.returnValue = data;
  });
});

// docker run service
ipcMain.on('docker-run', (event, service) => {
  console.log('docker-run', service);
  const docker = new Docker();
  docker.run(
    service,
    [],
    process.stdout,
    (err: { message: string }, data: any) => {
      if (err) {
        console.error(err);
        dialog.showErrorBox('Docker Run Error', err.message);
        event.returnValue = err.message;
      }
      console.log(data);
      event.returnValue = data;
    },
  );
});

// docker list images
ipcMain.on('docker-list-images', (event) => {
  console.log('docker-list-images');
  const docker = new Docker();
  docker.listImages((err: { message: string }, data: any) => {
    if (err) {
      console.error(err);
      dialog.showErrorBox('Docker Images Error', err.message);
      event.returnValue = err.message;
    }
    console.log(data);
    event.returnValue = data;
  });
});

// docker stream logs
ipcMain.on(
  'docker-stream-logs',
  (event, service: keyof typeof dockerServices) => {
    console.log('docker-stream-logs', service);
    DockerProvider.streamLogs(dockerServices[service]);
  },
);
