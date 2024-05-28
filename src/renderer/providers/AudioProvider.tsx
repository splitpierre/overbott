import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AudioHandles, AudioContextProps } from '../../main/types/app-types';
// @ts-ignore
import messagePopAudio from '../audio/message-pop-alert.mp3';
// @ts-ignore
import hoverAudio from '../audio/hover.mp3';
import { AppContext } from './AppProvider';

interface AudioContextProviderProps {
  children: ReactNode;
}

const AudioContext = createContext({} as AudioContextProps);

function AudioContextProvider({ children }: AudioContextProviderProps) {
  const { setIsLoading } = useContext(AppContext);
  const shouldPlayAudioEffects = window.electron.store.get('playAudioEffects');
  const [audioIsPlaying, setAudioIsPlaying] = useState<boolean>(false);
  const [audioSource, setAudioSource] = useState(new Audio());
  const [audioSpeechSource, setAudioSpeechSource] = useState(new Audio());
  const playAudioSpeech = useCallback(
    (src: string) => {
      if (src) {
        window.electron.store.set('isLoading', true);
        setIsLoading(true);
        window.electron.store.set(
          'executionDescription',
          'Generating audio speech',
        );

        console.log('playAudioSpeech', src);
        audioSpeechSource.src = src;
        audioSpeechSource
          .play()
          // eslint-disable-next-line promise/always-return
          .then(() => {
            window.electron.store.set('isLoading', false);
            setIsLoading(false);
            setAudioIsPlaying(true);
            console.log('Audio speech playback started');
            window.electron.store.set('executionDescription', 'Playing TTS');
          })
          .catch((error) => console.error('Failed to play audio:', error));
        audioSpeechSource.addEventListener('ended', () => {
          setAudioIsPlaying(false);

          window.electron.store.set('executionDescription', '');
        });
      }
    },
    [audioSpeechSource, setIsLoading, setAudioIsPlaying],
  );

  const playAudio = useCallback(
    (src: AudioHandles) => {
      if (shouldPlayAudioEffects) {
        let source = src;
        if (src === 'messagePop') {
          source = messagePopAudio;
        }
        if (src === 'hover') {
          source = hoverAudio;
        }
        audioSource.src = source;
        audioSource
          .play()
          // eslint-disable-next-line promise/always-return
          .then(() => {
            console.log('Audio playback started');
          })
          .catch((error) => console.error('Failed to play audio:', error));
      }
    },
    [audioSource, shouldPlayAudioEffects],
  );

  const stopAudioSpeech = useCallback(() => {
    audioSpeechSource.pause();
    audioSpeechSource.currentTime = 0;
    window.electron.store.set('executionDescription', '');
    window.electron.store.set('isLoading', false);
    setAudioIsPlaying(false);
  }, [audioSpeechSource]);

  const memoValue = useMemo(
    () => ({
      shouldPlayAudioEffects,
      audioIsPlaying,
      setAudioIsPlaying,
      audioSource,
      setAudioSource,
      audioSpeechSource,
      setAudioSpeechSource,
      playAudioSpeech,
      playAudio,
      stopAudioSpeech,
    }),
    [
      shouldPlayAudioEffects,
      audioIsPlaying,
      audioSource,
      audioSpeechSource,
      playAudio,
      playAudioSpeech,
      stopAudioSpeech,
    ],
  );
  return (
    <AudioContext.Provider value={memoValue}>{children}</AudioContext.Provider>
  );
}

export { AudioContext, AudioContextProvider };
