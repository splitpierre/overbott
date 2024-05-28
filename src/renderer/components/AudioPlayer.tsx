import { PlayArrow } from '@mui/icons-material';
import { Button } from '@mui/material';
import React from 'react';

function AudioPlayer(props: { src: string }) {
  const { src } = props;
  // Function to play audio
  const playAudio = () => {
    const audio = new Audio(src);
    audio
      .play()
      .then(() => console.log('Audio playback started'))
      .catch((error) => console.error('Failed to play audio:', error));
  };

  // Render an invisible button to trigger audio playback
  return (
    <Button onClick={playAudio}>
      <PlayArrow />
    </Button>
  );
}

// const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
//   // Function to play audio
//   const playAudio = () => {
//     const audio = new Audio(src);
//     audio.play()
//       .then(() => console.log('Audio playback started'))
//       .catch(error => console.error('Failed to play audio:', error));
//   };

//   // Render an invisible button to trigger audio playback
//   return (
//     <button style={{ display: 'none' }} onClick={playAudio}></button>
//   );
// };

export default AudioPlayer;
