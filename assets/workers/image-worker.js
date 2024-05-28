const http = require('http');
// const { AbortController } = require('abort-controller');

// let controller = new AbortController();

// function abortRequest() {
//   console.log('Aborting worker request...');
//   controller.abort();
//   controller = new AbortController();
// }

async function stableDiffusionRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    console.log('Fetching data...', { body, endpoint });
    const requestData = JSON.stringify(body);
    console.log('Request data:', requestData);
    const { hostname, port, path } = new URL(endpoint);
    console.log('Request URL:', { hostname, port, path });
    const requestOptions = {
      timeout: 900000 * 2, // 30 minutes
      // signal: controller.signal,
      hostname,
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
      },
    };
    console.log('Request options:', requestOptions);
    const req = http.request(requestOptions, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        console.log('Received data:', chunk);
        responseData += chunk.toString();
      });
      res.on('end', () => {
        try {
          console.log('Data received:', responseData);
          const imageJson = JSON.parse(responseData);
          const base64Image = imageJson.image_base64;
          const imgSrc = `data:image/png;base64,${base64Image}`;
          resolve(imgSrc);
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', (error) => {
      console.error('Error fetching data:', error.message);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

process.on('message', async (message) => {
  console.log('Worker received message:', message);
  if (message.signal === 'start') {
    try {
      const result = await stableDiffusionRequest(
        message.endpoint,
        message.body,
      );
      process.send({ type: 'success', data: result });
    } catch (error) {
      process.send({ type: 'error', message: error.message });
    }
  }
  if (message.signal === 'abort') {
    // abortRequest();
    console.log('Aborting worker request...');
  }
});

// Handle exit events
process.on('exit', (code) => {
  console.log(`Worker exiting with code ${code}`);
});
