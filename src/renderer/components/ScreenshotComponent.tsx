import { Button, Typography } from '@mui/material';
import React, { useRef } from 'react';
import * as htmlToImage from 'html-to-image';

function ComponentScreenshot() {
  const componentRef = useRef<HTMLDivElement>(null);

  const handleScreenshot = async () => {
    // Get the DOM node of the component
    const componentNode = componentRef.current;

    if (componentNode) {
      try {
        // Convert the component to an image using html-to-image library
        const dataUrl = await htmlToImage.toPng(componentNode);

        // Display the screenshot or save it as an image
        // For example, display in an image element:
        const imageElement = document.createElement('img');
        imageElement.src = dataUrl;
        document.body.appendChild(imageElement);

        // Or save it as an image:
        // const link = document.createElement('a');
        // link.href = dataUrl;
        // link.download = 'screenshot.png';
        // link.click();
      } catch (error) {
        console.error('Error capturing screenshot:', error);
      }
    }
  };

  return (
    <div>
      <div ref={componentRef}>
        {/* Your component content goes here */}
        <Typography variant="h4">Component to Capture</Typography>
        <Typography>This is the content of the component.</Typography>
        <webview src="https://www.youtube.com" />
      </div>
      <Button variant="contained" onClick={handleScreenshot}>
        Take Screenshot
      </Button>
    </div>
  );
}

export default ComponentScreenshot;
