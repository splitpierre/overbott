/* eslint-disable react-hooks/exhaustive-deps */
import { TextField, Button, ButtonGroup, Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Delete, Send, Stop } from '@mui/icons-material';
import * as UUID from 'uuid';
import { t } from 'i18next';
import { ChatLogMessage } from '../../../main/types/app-types';
import { AppContext } from '../../providers/AppProvider';
import { LanguageModelContext } from '../../providers/LanguageModelProvider';
// import { AudioContext } from '../../providers/AudioProvider';

function ChatPrompt(props: {
  mode: 'default' | 'minimal';
  streamResponse: string;
  setStreamResponse: any;
  scrollToBottom: any;
  chatMessagesRef: any;
  // eslint-disable-next-line react/require-default-props
  windowInject?: any;
}) {
  let activeWindow: any;

  const {
    mode,
    streamResponse,
    setStreamResponse,
    scrollToBottom,
    chatMessagesRef,
    windowInject,
  } = props;
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
  // const { playAudio } = useContext(AudioContext);
  const { llmModel } = useContext(LanguageModelContext);
  const {
    filePaths,
    imageList,
    isLoading,
    setIsLoading,
    setChatMessages,
    servicesStatus,
  } = useContext(AppContext);

  const [userMsg, setUserMsg] = useState<string>('');

  const generateResponseStream = async (message: string) => {
    setIsLoading(true);
    activeWindow.electron.store.set('isLoading', 'true');
    activeWindow.electron.chat.stream(message);

    const pollStreamResponse = setInterval(async () => {
      const loadingStatus = await activeWindow.electron.store.get('isLoading');
      const streamResponseGet =
        await activeWindow.electron.store.get('streamResponse');

      if (loadingStatus === 'false') {
        // playAudio('messagePop');
        clearInterval(pollStreamResponse);
        setIsLoading(false);
        setStreamResponse('');
        setTimeout(() => {
          setChatMessages(
            activeWindow.electron.store.get('chatMessages') || [],
          );
          // scrollToBottom(chatMessagesRef);
        }, 1000);
        return;
      }
      setStreamResponse(streamResponseGet);
      scrollToBottom(chatMessagesRef, 'hard');
    }, 400);
  };

  // const generateResponse = async (message: string, messages: any) => {
  //   // setIsLoading(true);
  //   // const images: string[] = activeWindow.electron.store.get('promptImages') || [];
  //   if (filePath) {
  //     const result: any = activeWindow.electron.chat.sendWithContext(
  //       message,
  //       filePath,
  //     );
  //     addBotMessage(result, messages);
  //     // result is streaming data
  //     // console.log('result', result, typeof result);

  //     // setIsLoading(false);
  //     return true;
  //   }
  //   const result: any = activeWindow.electron.chat.send(message);
  //   addBotMessage(result, messages);
  //   // setIsLoading(false);
  //   return true;
  // };
  // const generateResponseOld = async (message: string, messages: any) => {
  //   setIsLoading(true);
  //   const images: string[] = activeWindow.electron.store.get('promptImages') || [];
  //   const reqParams: OllamaGenerateParams = {
  //     model: llmModel || activeWindow.electron.store.get('llmModel'),
  //     prompt: message,
  //     ...(images.length &&
  //       llmModel &&
  //       llmModel.includes('llava') && { images }),
  //     options: {
  //       temperature: modelTemperature,
  //     },
  //   };
  //   try {
  //     const response = await fetch(`${mainModelEndpoint}/api/generate`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(reqParams),
  //     });
  //     if (!response.ok || !response.body) {
  //       throw response.statusText;
  //     }
  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder();
  //     const loopRunner = true;
  //     let botAnswerStr = '';
  //     while (loopRunner) {
  //       const { value, done } = await reader.read();
  //       if (done || stopStream) {
  //         setIsLoading(false);
  //         setStopStream(false);
  //         break;
  //       }
  //       const decodedChunk = decoder.decode(value, { stream: true });
  //       const cleanChunk = decodedChunk.replace(/\n/g, '');
  //       const fixedChunk = cleanChunk.includes('}{')
  //         ? `[${cleanChunk.replace(/}{/g, '},{')}]`
  //         : cleanChunk;
  //       const isValidJson = (str: string) => {
  //         try {
  //           JSON.parse(str);
  //         } catch (e) {
  //           console.log(
  //             'pre-test validJson',
  //             JSON.stringify({
  //               example: str,
  //               error: e,
  //               test1: decodedChunk.includes('}{'),
  //               test2: decodedChunk.includes('},{'),
  //               test3: decodedChunk.includes('}\n{'),
  //             }),
  //           );
  //           console.log('Error parsing JSON:', str);
  //           return false;
  //         }
  //         return true;
  //       };
  //       console.log('isValidJson', isValidJson(fixedChunk), decodedChunk);
  //       const messageResponse = JSON.parse(fixedChunk);
  //       // console.log('messageResponse', decodedChunk);
  //       if (messageResponse.response) {
  //         botAnswerStr += messageResponse.response;
  //         console.log('botAnswerStr', botAnswerStr);
  //         addBotMessage(botAnswerStr, messages);
  //         // setBotAnswer((answer: any) => {
  //         //   const botAnswerFull = answer + messageResponse.response;

  //         //   addBotMessage(botAnswerFull, messages);
  //         //   return botAnswerFull;
  //         // });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error generating response:', error);
  //     setIsLoading(false);
  //     activeWindow.electron.dialog.error(
  //       'Error generating response',
  //       'Please check your Ollama configuration',
  //     );
  //   }
  // };
  const handleSubmit = async () => {
    console.log('eval raw userMsg', userMsg, servicesStatus);
    if (!userMsg) return false;
    if (!servicesStatus[activeWindow.electron.store.get('llmService')]) {
      activeWindow.electron.dialog.error(
        'No active service',
        'Please make sure you have an active service',
      );
      return false;
    }
    if (
      activeWindow.electron.store.get('llmModel') === 'no-model' ||
      !activeWindow.electron.store.get('llmModel')
    ) {
      activeWindow.electron.dialog.error(
        'No active model',
        'Please make sure you have an active model',
      );
      return false;
    }
    // double new line
    const newUserMsg = userMsg.replace(/\n/g, '\n\n');
    console.log(
      'test ollama',
      activeWindow.electron.store.get('mainModelEndpoint'),
    );
    if (
      !activeWindow.electron.store.get('llmService') ||
      !activeWindow.electron.store.get('mainModelEndpoint') ||
      !activeWindow.electron.store.get('llmModel')
    ) {
      console.log('submitNoOllama!');
      activeWindow.electron.dialog.error(
        'Incomplete Ollama configuration',
        'Please make sure you have selected a service, model and endpoint',
      );
      return false;
    }

    // playAudio('messagePop');

    const currentMessages =
      activeWindow.electron.store.get('chatMessages') || [];
    const messageId = UUID.v4();
    const newMessages: ChatLogMessage[] = [
      ...currentMessages,
      {
        message: newUserMsg,
        author: 'user',
        id: messageId,
        model: llmModel,
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    ];
    setChatMessages(newMessages);
    activeWindow.electron.store.set('chatMessages', newMessages);
    // generateContextResponse(newUserMsg);
    if (filePaths.length > 0) {
      activeWindow.electron.store.set('promptContextFile', filePaths);
    }
    if (imageList.length > 0) {
      activeWindow.electron.store.set('promptImages', imageList);
    }
    generateResponseStream(newUserMsg);
    setUserMsg('');
    return true;
  };

  const handleKeyDown = (event: any) => {
    // prevent single enter to create new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // useEffect(() => {
  //   if (
  //     !llmModels.length &&
  //     !isLoading &&
  //     activeWindow.electron.store.get('mainModelEndpoint')
  //   ) {
  //     fetchModels();
  //   }
  // }, [llmModels]);

  useEffect(() => {
    if (activeWindow.electron.store.get('isLoading') === 'true') {
      // console.log('dangerous use effect isLoading');
      const pollStreamResponse = setInterval(async () => {
        const loadingStatus =
          await activeWindow.electron.store.get('isLoading');
        const streamResponseGet =
          await activeWindow.electron.store.get('streamResponse');
        if (loadingStatus === 'false') {
          // playAudio('messagePop');
          clearInterval(pollStreamResponse);
          setIsLoading(false);
          setStreamResponse('');
          activeWindow.electron.store.set('audioResponse', '');
          setTimeout(() => {
            setChatMessages(
              activeWindow.electron.store.get('chatMessages') || [],
            );
            // scrollToBottom(chatMessagesRef);
          }, 1000);
          return;
        }
        setStreamResponse(streamResponseGet);
        scrollToBottom(chatMessagesRef, 'hard');
      }, 333);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (streamResponse) {
      setChatMessages(activeWindow.electron.store.get('chatMessages') || []);
    }
  }, [streamResponse]);

  return (
    <TextField
      id="prompt-input"
      label={`${t('Chat with')} OverBott (${llmModel || '--'})`}
      variant="outlined"
      value={userMsg}
      onChange={(e) => setUserMsg(e.target.value)}
      onKeyDown={handleKeyDown}
      autoFocus
      multiline
      maxRows={mode === 'default' ? 10 : 2}
      onFocus={() => scrollToBottom(chatMessagesRef)}
      fullWidth
      InputProps={{
        endAdornment: (
          <Box>
            {mode === 'default' ? (
              <ButtonGroup>
                {isLoading ? (
                  <Button
                    title="Stop generation"
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setIsLoading(false);
                      activeWindow.electron.chat.stopStream();
                      activeWindow.electron.store.set('streamResponse', '');
                      activeWindow.electron.store.set('isLoading', 'false');
                    }}
                  >
                    <Stop />
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={handleSubmit}
                    variant="contained"
                    onMouseEnter={() => {
                      // playAudio('hover');
                    }}
                    title={t('Send')}
                  >
                    <Send />
                  </Button>
                )}

                <Button
                  title={t('Clear chat')}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    activeWindow.electron.store.set('chatMessages', []);
                    setChatMessages([]);
                  }}
                >
                  <Delete />
                </Button>
                {/* <Button
                  title="DOWNLOAD MD TEST"
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    console.log('init download');
                    console
                      .log
                      // activeWindow.electron.docs.download(
                      //   'https://angular.dev/overview',
                      // ),
                      // activeWindow.electron.chat.stream(),
                      ();
                  }}
                >
                  <Download />
                </Button> */}
              </ButtonGroup>
            ) : (
              <ButtonGroup>
                {isLoading ? (
                  <Button
                    title="Stop generation"
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setIsLoading(false);
                      activeWindow.electron.chat.stopStream();
                      activeWindow.electron.store.set('streamResponse', '');
                      activeWindow.electron.store.set('isLoading', 'false');
                    }}
                  >
                    <Stop />
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={handleSubmit}
                    onMouseEnter={() => {
                      // playAudio('hover');
                    }}
                    variant="contained"
                    title={t('Send')}
                  >
                    <Send />
                  </Button>
                )}
              </ButtonGroup>
            )}
          </Box>
        ),
      }}
    />
  );
}

export default ChatPrompt;
