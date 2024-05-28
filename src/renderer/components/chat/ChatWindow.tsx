import { useState, useRef } from 'react';
import { Box, Grid } from '@mui/material';
import ChatMessages from './ChatMessages';
import ChatPrompt from './ChatPrompt';
import customScrollBar from '../../ScrollBar';

function ChatWindow() {
  const containerRef = useRef(null);

  const [streamResponse, setStreamResponse] = useState<string>(
    window.electron.store.get('streamResponse') || '',
  );

  const chatMessagesRef: any = useRef(null);
  const scrollToBottom = (listRef: any, type: 'smooth' | 'hard' = 'smooth') => {
    if (type === 'hard') {
      if (listRef.current) listRef.current.scrollIntoView();
    } else if (listRef.current)
      listRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '95vh' }}>
      <Box
        flexGrow={1}
        ref={containerRef}
        sx={{
          overflow: 'auto',
          ...customScrollBar({
            primary: 'primary.main',
            secondary: 'secondary.main',
          }),
        }}
      >
        <ChatMessages
          mode="default"
          scrollToBottom={scrollToBottom}
          streamResponse={streamResponse}
          chatMessagesRef={chatMessagesRef}
          containerRef={containerRef}
        />
      </Box>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ChatPrompt
              mode="default"
              streamResponse={streamResponse}
              setStreamResponse={setStreamResponse}
              scrollToBottom={scrollToBottom}
              chatMessagesRef={chatMessagesRef}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
export default ChatWindow;
