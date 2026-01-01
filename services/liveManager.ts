
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { Persona, VoiceSettings } from "../types";

const LIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "generate_image",
        description: "Generate an image based on a prompt.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: "Visual description." }
          },
          required: ["prompt"]
        }
      }
    ]
  }
];

export class LiveManager {
  private client: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private outputGain: GainNode | null = null; 
  private nextStartTime = 0;
  private isConnected = false;
  private isConnecting = false;
  private voiceSettings: VoiceSettings = { speed: 1.0, pitch: 0 };
  private activeSources: AudioBufferSourceNode[] = []; 
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private manualDisconnect = false; 
  private isRetry = false;

  public onVolumeChange: ((level: number) => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onToolCall: ((name: string, args: any) => Promise<any>) | null = null;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  setVoiceSettings(settings: VoiceSettings) {
    this.voiceSettings = settings;
  }

  async connect(persona: Persona, recentContext: string = "", location?: { latitude: number, longitude: number }) {
    if (this.isConnected || this.isConnecting) return;
    if (!this.isRetry) {
        this.reconnectAttempts = 0;
        this.manualDisconnect = false;
    }
    this.isConnecting = true;

    try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = 3.5; 
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 256;
        this.outputGain.connect(this.analyzer);
        this.analyzer.connect(this.audioContext.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.inputSource = inputContext.createMediaStreamSource(stream);
        this.processor = inputContext.createScriptProcessor(4096, 1, 1);

        const tools: any[] = [{ googleSearch: {} }, { googleMaps: {} }, ...LIVE_TOOLS];
        let toolConfig: any = location ? { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } } : undefined;

        const sessionPromise = this.client.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.voiceName || 'Kore' } },
            },
            systemInstruction: `${persona.description}. Speak naturally. Use tools.`,
            tools,
            toolConfig,
          },
          callbacks: {
            onopen: () => {
              this.isConnected = true;
              this.isConnecting = false;
              this.nextStartTime = this.audioContext?.currentTime || 0;
              this.processor!.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = this.createBlob(inputData);
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              this.inputSource?.connect(this.processor!);
              this.processor?.connect(inputContext.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) await this.playAudio(audioData);
              if (msg.toolCall) {
                  const functionResponses: any[] = [];
                  for (const fc of msg.toolCall.functionCalls) {
                      let result = this.onToolCall ? await this.onToolCall(fc.name, fc.args) : { output: "Success" };
                      functionResponses.push({ id: fc.id, name: fc.name, response: { result } });
                  }
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses }));
              }
              if (msg.serverContent?.interrupted) {
                this.stopAllAudio();
                this.nextStartTime = this.audioContext?.currentTime || 0; 
              }
            },
            onclose: () => this.handleConnectionDrop(persona, recentContext, location),
            onerror: (err) => console.error("Live Error", err)
          }
        });
        this.session = sessionPromise;
    } catch (error) {
        this.handleConnectionDrop(persona, recentContext, location);
    }
  }

  private async handleConnectionDrop(persona: Persona, context: string, location?: any) {
      if (this.manualDisconnect) {
          this.disconnect();
          return;
      }
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.isRetry = true;
          this.internalCleanup();
          setTimeout(() => this.connect(persona, context, location), 2000);
      } else {
          this.disconnect();
      }
  }

  async playAudio(base64Data: string) {
    if (!this.audioContext || !this.outputGain) return;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const audioBuffer = await this.decodePCM(bytes, this.audioContext);
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = this.voiceSettings.speed;
    source.detune.value = this.voiceSettings.pitch * 100;
    source.connect(this.outputGain);
    source.onended = () => { this.activeSources = this.activeSources.filter(s => s !== source); };
    this.activeSources.push(source);
    const currentTime = this.audioContext.currentTime;
    const jitterBuffer = 0.05; 
    if (this.nextStartTime < currentTime) this.nextStartTime = currentTime + jitterBuffer; 
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration / this.voiceSettings.speed;
  }

  stopAllAudio() {
      this.activeSources.forEach(s => { try { s.stop(); } catch(e) {} });
      this.activeSources = [];
  }

  createBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  }

  async decodePCM(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }

  private internalCleanup() {
      this.stopAllAudio();
      if (this.inputSource) try { this.inputSource.disconnect(); } catch(e){}
      if (this.processor) try { this.processor.disconnect(); } catch(e){}
      this.session = null;
      this.isConnected = false;
      this.isConnecting = false;
  }

  disconnect() {
    this.manualDisconnect = true;
    this.internalCleanup();
    if (this.audioContext) try { this.audioContext.close(); } catch(e){}
    this.audioContext = null;
    if (this.onDisconnect) this.onDisconnect();
  }
}
