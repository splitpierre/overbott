/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-children-prop */
/* eslint-disable react/no-unstable-nested-components */
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Stack,
  Box,
  Button,
  ButtonGroup,
  TextField,
  Paper,
  CircularProgress,
} from '@mui/material';
import Markdown from 'react-markdown';
import { useContext, useEffect, useState } from 'react';
import {
  Bolt,
  CopyAll,
  DataObject,
  Delete,
  Person,
  // StopCircle,
  // VoiceChat,
} from '@mui/icons-material';
import { dracula, github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { t } from 'i18next';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { ChatLogMessage } from '../../../main/types/app-types';
import customScrollBar from '../../ScrollBar';
// import defaultEndpoints from '../../../main/data/default-endpoints';
import { AppContext } from '../../providers/AppProvider';
// import { AudioContext } from '../../providers/AudioProvider';

function ChatMessages(props: {
  mode: 'default' | 'minimal';
  scrollToBottom: any;
  streamResponse: string;
  chatMessagesRef: any;
  containerRef: any;
  // eslint-disable-next-line react/require-default-props
  windowInject?: any;
}) {
  const {
    mode,
    scrollToBottom,
    streamResponse,
    chatMessagesRef,
    containerRef,
    windowInject,
  } = props;
  let activeWindow: any;
  try {
    if (window) {
      // console.log('test window', window);
    }
    activeWindow = window;
  } catch (error) {
    if (windowInject) {
      activeWindow = windowInject;
    } else {
      console.error('no window');
      throw new Error('no window');
    }
  }
  // const { stopAudioSpeech, audioIsPlaying, playAudioSpeech } =
  //   useContext(AudioContext);
  const {
    chatMessages,
    setDisplaySearchChat,
    displaySearchChat,
    setSearchChatText,
    searchChatText,
    // servicesStatus,
    setChatMessages,
    executionDescription,
  } = useContext(AppContext);

  const [displayedMessages, setDisplayedMessages] = useState<ChatLogMessage[]>(
    [],
  );
  const [displayHoverButtons, setDisplayHoverButtons] = useState(-1);
  const handleLoadPreviousMessages = () => {
    const startIndex = chatMessages.indexOf(displayedMessages[0]) - 20;
    const endIndex = chatMessages.indexOf(displayedMessages[0]);
    const prevMessages = chatMessages.slice(
      startIndex >= 0 ? startIndex : 0,
      endIndex,
    );
    setDisplayedMessages(prevMessages.concat(displayedMessages));
  };

  useEffect(() => {
    // Display initial messages
    if (chatMessages) {
      const latestMessages = chatMessages.slice(-20);
      setDisplayedMessages(latestMessages);
    }

    // if (containerRef.current) {
    //   containerRef.current.scrollTop = containerRef.current.scrollHeight;
    // }
  }, [chatMessages]);
  // const handleScroll = () => {
  //   const container = containerRef.current;

  //   if (container.scrollTop === 0) {
  //     // Scroll to top, load previous 20 messages if available
  //     const startIndex = chatMessages.indexOf(displayedMessages[0]) - 20;
  //     const endIndex = chatMessages.indexOf(displayedMessages[0]);
  //     const prevMessages = chatMessages.slice(
  //       startIndex >= 0 ? startIndex : 0,
  //       endIndex,
  //     );
  //     setDisplayedMessages(prevMessages.concat(displayedMessages));
  //   }
  // };
  // useEffect(() => {
  //   const container = containerRef.current;

  //   container.addEventListener('scroll', handleScroll);

  //   return () => {
  //     container.removeEventListener('scroll', handleScroll);
  //   };
  //   //  react-hooks/exhaustive-deps
  // }, [displayedMessages, chatMessages]);
  const handleSearch = () => {
    console.log('searching for:', searchChatText);
    const index = displayedMessages.findIndex((chatObj) =>
      chatObj.message.toLowerCase().includes(searchChatText.toLowerCase()),
    );
    console.log('index:', index);
    if (index !== -1) {
      // Scroll to the position of the found message
      console.log(
        'messageElement:',
        containerRef.current.children[0].children[0],
      );
      const messageElement = containerRef.current.children[0].children[index];
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
        // Highlight the found word (You can apply a different style here)
        messageElement.innerHTML = messageElement.innerHTML.replace(
          new RegExp(searchChatText, 'gi'),
          (match: any) =>
            `<span style="background-color: yellow;color:black; font-weight:bold">${match}</span>`,
        );
      }
    }
  };
  useEffect(() => {
    if (chatMessagesRef.current) {
      scrollToBottom(chatMessagesRef, 'hard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, streamResponse]);

  useEffect(() => {
    const handleKeyDown = (event: { ctrlKey: any; key: string }) => {
      if (event.ctrlKey && event.key === 'f') {
        // Ctrl + F pressed, do something
        console.log('Ctrl + F pressed!', displaySearchChat);
        setDisplaySearchChat(!displaySearchChat);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySearchChat]);

  return (
    <Box
      sx={{
        width: '100%',
        // maxHeight: mode === 'default' || isExpanded ? '80vh' : '48vh',
        padding: mode === 'default' ? 3 : 0,
      }}
    >
      {displaySearchChat && (
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          <TextField
            sx={{ width: '100%' }}
            title="Search"
            placeholder="Search"
            value={searchChatText}
            onChange={(e) => setSearchChatText(e.target.value)}
            InputProps={{
              endAdornment: (
                <Button
                  variant="contained"
                  title="Search"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              ),
            }}
          />
        </Paper>
      )}
      {chatMessages && chatMessages.length > 20 && (
        <ButtonGroup fullWidth sx={{ marginBottom: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              handleLoadPreviousMessages();
            }}
            startIcon={<DataObject />}
          >
            {t('Load more')}
          </Button>
        </ButtonGroup>
      )}

      {displayedMessages &&
        displayedMessages.map((m: ChatLogMessage, i: number) => (
          <Stack alignItems={m.author === 'user' ? 'flex-end' : 'flex-start'}>
            <ListItem
              key={i}
              className={m.author === 'user' ? 'bubble right' : 'bubble left'}
              sx={{
                width: 'fit-content',
                paddingTop: 0,
                paddingBottom: 0,
                // margin: 0,
                // padding: 0,
                minWidth: '85%',
                bgcolor: (() => {
                  switch (m.author) {
                    case 'assistant':
                      return 'primary.main';
                    case 'user':
                      return 'secondary.main';
                    default:
                      return 'primary.main';
                  }
                })(),
                marginBottom: '2px',

                // borderRadius: '10px',
                // ...(m.author === 'user'
                //   ? {
                //       borderBottomRightRadius: '0px',
                //     }
                //   : {
                //       borderBottomLeftRadius: '0px',
                //     }),
                // borderBottomWidth: '1px',
                // borderBottomStyle: 'solid',
                // borderBottomColor: 'grey.800',
              }}
            >
              {mode === 'default' && (
                <ListItemAvatar>
                  <Avatar>
                    {m.author === 'assistant' ? <Bolt /> : <Person />}
                  </Avatar>
                </ListItemAvatar>
              )}
              {/* <ListItemText primary={m.author} secondary={m.message} /> */}
              <ListItemText
                onMouseEnter={() => {
                  setDisplayHoverButtons(i);
                }}
                onMouseLeave={() => {
                  setDisplayHoverButtons(-1);
                }}
                primaryTypographyProps={{
                  fontSize: '0.85em',
                }}
                secondaryTypographyProps={{
                  fontSize: '0.7em',
                }}
                primary={
                  <Box
                    sx={{
                      minHeight: '30px',
                    }}
                  >
                    {m.message.replace(/\n$/, '').includes('![image]') && (
                      <img
                        src={String(m.message)
                          .replace(/\n$/, '')
                          .split(']')[1]
                          .split('(')[1]
                          .replace(')', '')}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                        }}
                        alt={`Generated ${m.message}`}
                      />
                    )}
                    {!m.message.replace(/\n$/, '').includes('![image]') && (
                      <Markdown
                        components={{
                          code(propsCode: any) {
                            const { children, ...rest } = propsCode;
                            return (
                              <Box
                                sx={{
                                  overflow: 'auto',
                                  // width: '100%',
                                  // maxWidth: '800px',
                                  ...customScrollBar({
                                    primary: 'primary.main',
                                    secondary: 'secondary.main',
                                  }),
                                }}
                              >
                                <SyntaxHighlighter
                                  wrapLongLines
                                  {...rest}
                                  // PreTag="div"
                                  children={String(children).replace(/\n$/, '')}
                                  // language="javascript"
                                  // {...(findCodeBlocks(String(children)) && {
                                  //   language: findCodeBlocks(String(children)),
                                  // })}
                                  style={dracula}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    right: 0,
                                    marginTop: '-47px',
                                    marginRight: '17px',
                                    zIndex: 100,
                                  }}
                                >
                                  <ButtonGroup>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      title="Copy to clipboard"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          String(children).replace(/\n$/, ''),
                                        );
                                      }}
                                    >
                                      <CopyAll />
                                    </Button>
                                  </ButtonGroup>
                                </Box>
                              </Box>
                            );
                          },
                        }}
                      >
                        {m.message}
                      </Markdown>
                    )}

                    {displayHoverButtons === i && (
                      <Box
                        sx={{
                          position: 'absolute',
                          right: 0,
                          bottom: 5,
                          // marginTop: '-10px',
                          marginRight: '17px',
                          zIndex: 10000,
                        }}
                      >
                        <ButtonGroup>
                          <Button
                            variant="contained"
                            size="small"
                            title="Delete message"
                            onClick={() => {
                              console.log('Deleting message:', m);
                              const messageId = m.id;
                              const newMessages = chatMessages.filter(
                                (message) => message.id !== messageId,
                              );
                              console.log('newMessages:', newMessages);
                              setChatMessages(newMessages);
                            }}
                          >
                            <Delete />
                          </Button>
                          {/* {servicesStatus && servicesStatus.openTts && (
                            <div>
                              {audioIsPlaying ? (
                                <Button
                                  variant="contained"
                                  size="small"
                                  title="Text to Speech"
                                  onClick={() => {
                                    stopAudioSpeech();
                                  }}
                                >
                                  <StopCircle />
                                </Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  size="small"
                                  title="Text to Speech"
                                  onClick={() => {
                                    const message = m.message.replace(
                                      /\n/g,
                                      ' ',
                                    );
                                    console.log('Text to Speech', message);
                                    // playAudioSpeech(m.message.replace(/\n/g, ' '));
                                    playAudioSpeech(
                                      `${defaultEndpoints.openTts}/api/tts?voice=coqui-tts:en_ljspeech&text=${message}&vocoder=high&denoiserStrength=0.03&cache=false`,
                                    );
                                  }}
                                >
                                  <VoiceChat />
                                </Button>
                              )}
                            </div>
                          )} */}
                        </ButtonGroup>
                      </Box>
                    )}
                  </Box>
                }
                secondary={
                  <div>
                    {mode === 'default' && (
                      <div>
                        {m.author === 'assistant'
                          ? `OverBott (${m.model || 'default'}) - ${
                              m && m.duration
                                ? `${(m.duration / 1000).toFixed(0)}s`
                                : ''
                            } - ${
                              m.timestamp
                                ? new Date(m.timestamp).toLocaleString()
                                : '---'
                            }`
                          : `You - ${
                              m.timestamp
                                ? new Date(m.timestamp).toLocaleString()
                                : '---'
                            }`}
                      </div>
                    )}
                  </div>
                }
              />
              {/* {JSON.stringify(m)} */}
            </ListItem>
          </Stack>
        ))}
      {streamResponse && (
        <Stack
          // direction="column"
          // spacing={2}
          alignItems="flex-start"
          width="99%"
          // sx={{
          //   margin: 0,
          //   padding: 0,
          // }}
        >
          <ListItem
            key={chatMessages ? chatMessages.length : 0}
            className="bubble left"
            sx={{
              width: 'fit-content',
              paddingTop: 0,
              paddingBottom: 0,
              // margin: 0,
              // padding: 0,
              minWidth: '85%',
              bgcolor: 'primary.main',
              marginBottom: '2px',
            }}
          >
            {mode === 'default' && (
              <ListItemAvatar>
                <Avatar>
                  <Bolt />
                </Avatar>
              </ListItemAvatar>
            )}
            <ListItemText
              primaryTypographyProps={{
                fontSize: '0.9em',
              }}
              primary={
                <Markdown
                  components={{
                    code(propsCode: any) {
                      const { children, ...rest } = propsCode;
                      return (
                        <SyntaxHighlighter
                          {...rest}
                          children={String(children).replace(/\n$/, '')}
                          style={dracula}
                        />
                      );
                    },
                  }}
                >
                  {streamResponse}
                </Markdown>
              }
              secondary={
                <div>
                  <div>OverBott (stream)</div>
                </div>
              }
            />
          </ListItem>
        </Stack>
      )}

      {executionDescription && (
        <Stack
          // direction="column"
          // spacing={2}
          alignItems="flex-start"
          width="99%"
          // sx={{
          //   margin: 0,
          //   padding: 0,
          // }}
        >
          <ListItem
            key={chatMessages ? chatMessages.length : 0}
            className="bubble left"
            sx={{
              width: 'fit-content',
              paddingTop: 0,
              paddingBottom: 0,
              // margin: 0,
              // padding: 0,
              minWidth: '85%',
              bgcolor: 'primary.main',
              opacity: 0.5,
              marginBottom: '2px',
            }}
          >
            {mode === 'default' && (
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <CircularProgress color="info" />
                </Avatar>
              </ListItemAvatar>
            )}
            <ListItemText
              primaryTypographyProps={{
                fontSize: '0.9em',
              }}
              primary={
                <SyntaxHighlighter
                  language="json"
                  style={
                    activeWindow.electron.store.get('themeMode') === 'dark'
                      ? dracula
                      : github
                  }
                  wrapLines
                  lineProps={{
                    style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
                  }}
                >
                  {`${executionDescription}`}
                </SyntaxHighlighter>
              }
              secondary={
                <div>
                  <div>System message</div>
                </div>
              }
            />
          </ListItem>
        </Stack>
      )}

      <div ref={chatMessagesRef} />
    </Box>
  );
}
export default ChatMessages;
