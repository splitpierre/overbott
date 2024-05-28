import { exec } from 'child_process';
import LocalStorage from './local-storage';
import { isWindows } from '../helpers/util';

const Docker = require('dockerode');

class DockerProvider {
  /**
   * Streams logs from a docker container
   * @param service
   */
  public static streamLogs = async (service: { name: any }) => {
    const docker = new Docker();
    try {
      // Get the container object
      const container = docker.getContainer(service.name);

      // Attach to container logs
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
      });

      // Buffer to store log lines
      // let buffer = '';

      // Stream logs to console
      stream.on('data', (chunk: { toString: () => any }) => {
        let log = chunk.toString().trim(); // Convert chunk to string and trim whitespace
        // eslint-disable-next-line no-control-regex
        log = log.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        // buffer += log;
        // console.log(log);
        LocalStorage.set('dockerStream', log);
      });
      // setTimeout(() => {
      //   console.log('Stopping log stream...');
      //   LocalStorage.set('dockerStream', '');
      //   LocalStorage.set('dockerIsLoading', false);
      //   stream.destroy(); // Close the stream
      // }, 60000); // Stop streaming after 1 minute
      // Handle error
      stream.on('error', (err: any) => {
        console.error('Error streaming logs:', err);
        LocalStorage.set('dockerStream', err);
      });

      // Handle stream end
      stream.on('end', () => {
        console.log('Log streaming ended.');
        LocalStorage.set('dockerStream', 'Log streaming ended.');

        // Split buffer into lines
        // const lines = buffer.split('\n');
        // // Retrieve the last 500 lines
        // const last500Lines = lines
        //   .slice(Math.max(lines.length - 500, 0))
        //   .join('\n');
        // // Output last 500 lines to console
        // console.log(last500Lines);
        // LocalStorage.set('dockerStream', last500Lines);
      });
    } catch (error) {
      console.error('Error:', error);
      LocalStorage.set('dockerStream', error);
    }
  };

  /**
   * Checks if Docker is installed
   * @returns
   */
  public static checkDockerInstalled() {
    if (isWindows) {
      return new Promise((resolve) => {
        exec('sc query Docker', (error, stdout) => {
          const isActive =
            stdout.includes('STATE') && stdout.includes('RUNNING');
          resolve(isActive); // Docker service is active if it's running
        });
      });
    }
    return new Promise((resolve) => {
      exec('pgrep dockerd', (error, stdout) => {
        resolve(stdout.trim() !== ''); // Docker service is active if the process is running
      });
    });
  }

  /**
   * Pulls a docker image
   * @param image
   * @returns
   */
  static async pullImage(image: any) {
    return new Promise<void>((resolve, reject) => {
      const docker = new Docker();

      function onFinished(err: any) {
        if (err) reject(err);
        resolve();
      }
      function onProgress(event: { status: any }) {
        console.log(event.status);
        LocalStorage.set('dockerStream', event.status);
      }

      docker.pull(image, (err: any, stream: any) => {
        if (err) reject(err);
        docker.modem.followProgress(stream, onFinished, onProgress);
      });
    });
  }

  /**
   * Creates a docker container
   * @param service
   * @returns
   */
  static async createContainer(service: {
    image: any;
    name: any;
    portExpose?: any;
    portDefault?: any;
    envs?: any;
  }) {
    const docker = new Docker();
    const container = await docker.createContainer({
      name: service.name,
      Image: service.image,
      Hostname: '0.0.0.0',
      HostConfig: {
        PortBindings: {
          [`${service.portDefault}/tcp`]: [{ HostPort: service.portExpose }],
        },
        ...(service.name.includes('diffusers-api') && {
          Resources: {
            Devices: [
              {
                Driver: 'nvidia',
                Count: -1, // Allocate all available GPUs
                Capabilities: [['gpu']],
              },
            ],
          },
        }),
      },
    });
    return container;
  }

  /**
   * Stops a docker container
   * @param name
   */
  public static async stopContainer(name: any) {
    const docker = new Docker();
    const container = docker.getContainer(name);
    await container.stop();
    LocalStorage.set('dockerIsLoading', false);
  }

  /**
   * Starts a docker container
   * @param name
   */
  static async startContainer(name: any) {
    const docker = new Docker();
    const container = docker.getContainer(name);
    await container.start();
  }

  /**
   * Removes a docker service (container and image)
   * @param service
   */
  public static async removeService(service: { name: any; image: any }) {
    try {
      const docker = new Docker();
      const container = docker.getContainer(service.name);
      await container.remove();
      // delete image
      const image = docker.getImage(service.image);
      await image.remove();
      LocalStorage.set('dockerStream', `Service ${service.name} removed.`);
    } catch (error) {
      console.error('Error:', error);
      LocalStorage.set('dockerStream', error);
    }
    LocalStorage.set('dockerIsLoading', false);
  }

  /**
   * Starts a docker service (pulls image, creates container and starts it)
   * @param service
   */
  public static async startService(service: { image: any; name: any }) {
    const docker = new Docker();

    try {
      // Check if the image exists
      const images = await docker.listImages({
        filters: { reference: [service.image] },
      });
      if (images.length === 0) {
        console.log(`Pulling image ${service.image}...`);
        await this.pullImage(service.image);
        console.log(`Image ${service.image} pulled successfully.`);
      }

      // Check if the container exists
      const containers = await docker.listContainers({ all: true });
      const container = containers.find((c: { Names: string | string[] }) =>
        c.Names.includes(`/${service.name}`),
      );
      if (!container) {
        console.log(`Creating container ${service.name}...`);
        LocalStorage.set(
          'dockerStream',
          `Creating container ${service.name}...`,
        );
        await this.createContainer(service);
        console.log(`Container ${service.name} created successfully.`);
        LocalStorage.set(
          'dockerStream',
          `Container ${service.name} created successfully.`,
        );
      }

      // Start the container
      console.log(`Starting container ${service.name}...`);
      LocalStorage.set('dockerStream', `Starting container ${service.name}...`);
      await this.startContainer(service.name);
      console.log(`Container ${service.name} started successfully.`);
      LocalStorage.set(
        'dockerStream',
        `Container ${service.name} started successfully.`,
      );
      setTimeout(() => {
        LocalStorage.set('dockerStream', '');
      }, 5000);
    } catch (error) {
      console.error('Error:', error);
      // dialog.showErrorBox('Docker Error', error.message);
    }
    LocalStorage.set('dockerIsLoading', false);
  }
}

export default DockerProvider;
