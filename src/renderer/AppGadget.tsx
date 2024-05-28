/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Box,
  Button,
  ButtonGroup,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useEffect, useState, useRef, useContext } from 'react';
import {
  ArrowDownward,
  ArrowUpward,
  Bolt,
  CloseRounded,
  OpenWith,
} from '@mui/icons-material';
// import { useSpring } from '@react-spring/web';
import { t } from 'i18next';
import ChatPrompt from './components/chat/ChatPrompt';
import ChatMessages from './components/chat/ChatMessages';
import customScrollBar from './ScrollBar';
import { ThemeContext } from './providers/ThemeProvider';
import ChatMessagesNoRequire from './components/chat/ChatMessagesNoRequire';

// eslint-disable-next-line react/require-default-props
export default function AppGadget(props: { windowInject?: any }) {
  const { windowInject } = props;
  let activeWindow: any;
  let isExposed = false;
  try {
    if (window) {
      // console.log('test window', window);
    }
    activeWindow = window;
  } catch (error) {
    if (windowInject) {
      isExposed = true;
      activeWindow = windowInject;
    } else {
      console.error('no window');
      throw new Error('no window');
    }
  }
  console.log('activeWindow', activeWindow);
  const { themeMode, colorScheme, customThemeGadget } =
    useContext(ThemeContext);
  const containerRef = useRef(null);
  const chatMessagesRef: any = useRef(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [streamResponse, setStreamResponse] = useState<string>(
    activeWindow.electron.store.get('streamResponse') || '',
  );
  useEffect(() => {
    const keyDownHandler = (event: {
      key: string;
      preventDefault: () => void;
    }) => {
      console.log('User pressed: ', event.key);

      if (event.key === 'Esc') {
        event.preventDefault();
        console.log('User pressed: ', event.key);
        activeWindow.electron.gadget.close();
      }
    };

    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, []);
  // const [springs, api]: any = useSpring(() => ({
  //   from: { opacity: 0.5 },
  // }));
  const handleMouseDown = (event: { clientX: any; clientY: any }) => {
    const startX = event.clientX;
    const startY = event.clientY;

    const handleMouseMove = (moveEvent: {
      clientX: number;
      clientY: number;
    }) => {
      const offsetX = moveEvent.clientX - startX;
      const offsetY = moveEvent.clientY - startY;

      // Send message to the main process to drag the window
      activeWindow.electron.gadget.drag(offsetX, offsetY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  // useEffect(() => {
  //   // api.start({
  //   //   from: { opacity: 0.5 },
  //   //   to: { opacity: 1 },
  //   // });
  //   if (isOver) {
  //     api.start({
  //       from: { opacity: 0.5 },
  //       to: { opacity: 1 },
  //     });
  //   } else {
  //     api.start({
  //       from: { opacity: 1 },
  //       to: { opacity: 0.5 },
  //     });
  //   }
  // }, [api, isOver]);
  const scrollToBottom = (listRef: any, type: 'smooth' | 'hard' = 'smooth') => {
    // console.log('scroll to bottom', listRef);
    if (type === 'hard') {
      if (listRef.current) listRef.current.scrollIntoView();
    } else if (listRef.current)
      listRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ThemeProvider theme={customThemeGadget}>
      <CssBaseline />
      {/* {isOver ? 'Hovering' : 'Not Hovering'} */}
      <Box
        height="100vh"
        display="flex"
        flexDirection="column"
        sx={{
          // borderLeftWidth: '1px',
          // borderRightWidth: '1px',
          // borderBottomWidth: '0px',
          // borderTopWidth: '0px',
          // borderColor: 'primary.main',
          // borderStyle: 'solid',
          // borderRadius: '5px',
          // shadow
          overflow: 'hidden',
          // margin: '5px',

          background:
            themeMode === 'dark'
              ? colorScheme.dark.backgroundGradient
              : colorScheme.light.backgroundGradient,
          transition: 'opacity 0.3s ease-in-out', // Transition for opacity change
          '&:hover': {
            opacity: 1,
          },
          '&:not(:hover)': {
            opacity: 0.55,
          },
        }}
      >
        <Box
          p={2}
          sx={{
            position: 'fixed',
            top: '1px',
            width: '100%',
            height: '30px',
            padding: 0,
            zIndex: 1000,
            background:
              themeMode === 'dark'
                ? colorScheme.dark.backgroundGradient
                : colorScheme.light.backgroundGradient,
          }}
        >
          <ButtonGroup fullWidth sx={{ height: '100%' }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              title={t('Move')}
              sx={{ height: '100%' }}
              onMouseDown={handleMouseDown}
            >
              <OpenWith />
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              title="Full Window Chat"
              sx={{ height: '100%' }}
              onClick={() => {
                activeWindow.electron.main.openMain();
              }}
            >
              <Bolt />
            </Button>
            {/* <Button
        variant="outlined"
        color="primary"
        title="Settings"
        size="small"
        onClick={() => {
          activeWindow.electron.main.openSettings();
        }}
      >
        <Settings />
      </Button> */}
            <Button
              variant="outlined"
              color="primary"
              title={t('Close')}
              size="small"
              sx={{ height: '100%' }}
              onClick={() => {
                activeWindow.electron.gadget.close();
              }}
            >
              <CloseRounded />
            </Button>
          </ButtonGroup>
        </Box>
        <Box
          ref={containerRef}
          flexGrow={1}
          sx={{
            borderWidth: '1px',
            borderColor: 'primary.main',
            borderStyle: 'solid',
            borderRadius: '5px',
            marginBottom: '88px',
            marginTop: '30px',
            overflow: 'auto',
            ...customScrollBar({
              primary: 'primary.main',
              secondary: 'secondary.main',
            }),
          }}
        >
          <ChatMessages
            mode="minimal"
            scrollToBottom={scrollToBottom}
            streamResponse={streamResponse}
            chatMessagesRef={chatMessagesRef}
            containerRef={containerRef}
          />
        </Box>
        <Box
          p={2}
          sx={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            height: '85px',
            padding: 0,
            zIndex: 1000,
          }}
        >
          <ChatPrompt
            mode="minimal"
            streamResponse={streamResponse}
            chatMessagesRef={chatMessagesRef}
            scrollToBottom={scrollToBottom}
            setStreamResponse={setStreamResponse}
            windowInject={activeWindow}
          />
          <ButtonGroup sx={{ height: 24 }} fullWidth>
            <Button
              size="small"
              onClick={() => {
                // activeWindow.electron.gadget.expand();
                if (isExpanded) {
                  activeWindow.electron.gadget.collapse();
                  setIsExpanded(false);
                } else {
                  activeWindow.electron.gadget.expand();
                  setIsExpanded(true);
                }
                // scrollToBottom(chatMessagesRef);
                // activeWindow.electron.gadget.reload();
              }}
            >
              {isExpanded ? <ArrowUpward /> : <ArrowDownward />}
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
