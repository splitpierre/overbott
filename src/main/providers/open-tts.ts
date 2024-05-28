import defaultEndpoints from '../../data/default-endpoints';

export default class OpenTTS {
  private static currentAudioPath: string = '';

  public static async textToSpeech(text: string, model: string) {
    // fetch audio on 5500
    const response = await fetch(
      `${defaultEndpoints.openTts}/api/tts?voice=${model}&text=${text}&vocoder=high&denoiserStrength=0.03&cache=false`,
    );
    console.log({ tts: response.body });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    console.log({ url });
    this.currentAudioPath = url;
    return url;
  }
}
