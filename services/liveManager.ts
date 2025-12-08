
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Persona, VoiceSettings } from "../types";

// Define the tools available to the Live Model
const LIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "generate_image",
        description: "Generate an image based on a prompt. Use this when the user asks to 'see', 'draw', 'create', or 'make' a picture/photo/image.",
        parameters: {
          type: "OBJECT",
          properties: {
            prompt: { type: "STRING", description: "The visual description of the image to generate." }
          },
          required: ["prompt"]
        }
      },
      {
        name: "navigate_to",
        description: "Get navigation directions or show a map for a specific place. Use when user asks for 'directions', 'route', 'map', or 'how to go to'.",
        parameters: {
          type: "OBJECT",
          properties: {
            destination: { type: "STRING", description: "The name of the destination place." }
          },
          required: ["destination"]
        }
      },
      {
        name: "search_youtube",
        description: "Search for YouTube videos. Use when user asks to 'watch', 'see video', 'play video' or 'find video'.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "The search topic for videos." }
          },
          required: ["query"]
        }
      },
      {
        name: "create_website",
        description: "Generate a website or app code. Use when user asks to 'build', 'code', 'make' a website or app.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: { type: "STRING", description: "The topic or type of website/app to build." }
          },
          required: ["topic"]
        }
      },
      {
        name: "play_music",
        description: "Generate/Play a music visualizer and lyrics based on a mood or song name. Use when user says 'Play music', 'Sing a song', 'Music video'.",
        parameters: {
          type: "OBJECT",
          properties: {
            vibes: { type: "STRING", description: "The mood, genre, or song topic." }
          },
          required: ["vibes"]
        }
      },
      {
        name: "read_news",
        description: "Fetch and summarize latest news. Use when user asks for 'News', 'Updates', 'What's happening'.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: { type: "STRING", description: "The topic of news (e.g., Tech, India, Sports)." }
          },
          required: ["topic"]
        }
      },
      {
        name: "check_horoscope",
        description: "Check daily horoscope. Use when user asks for 'Rashifal', 'Horoscope', 'Luck today'.",
        parameters: {
          type: "OBJECT",
          properties: {
            sign: { type: "STRING", description: "The zodiac sign (optional, infer from user context if possible)." }
          },
          required: ["sign"]
        }
      },
      {
        name: "write_content",
        description: "Write blogs, emails, or social posts. Use when user asks to 'Write an email', 'Write a blog', 'Create a post'.",
        parameters: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", description: "Type of content: 'email', 'blog', 'social_post'." },
            topic: { type: "STRING", description: "The subject matter." }
          },
          required: ["type", "topic"]
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
  private outputGain: GainNode | null = null; // New Gain for Volume Output
  private nextStartTime = 0;
  private isConnected = false;
  private isConnecting = false;
  private voiceSettings: VoiceSettings = { speed: 1.0, pitch: 0 };
  private activeSources: AudioBufferSourceNode[] = []; 
  
  // Retry Logic State
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private manualDisconnect = false; // Flag to check if disconnect was user-initiated
  private isRetry = false;

  // Video State
  private videoStream: MediaStream | null = null;
  private videoInterval: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  public onVolumeChange: ((level: number) => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onToolCall: ((name: string, args: any) => Promise<any>) | null = null;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  setVoiceSettings(settings: VoiceSettings) {
    this.voiceSettings = settings;
  }

  async connect(persona: Persona, recentContext: string = "", location?: { latitude: number, longitude: number }, userVisualDescription?: string) {
    if (this.isConnected || this.isConnecting) return;
    
    // Reset retry state only on a fresh connect call (not a recursive retry)
    if (!this.isRetry) {
        this.reconnectAttempts = 0;
        this.manualDisconnect = false;
    }

    this.isConnecting = true;

    try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // --- OUTPUT GRAPH SETUP ---
        // Create Gain Node for Volume Boost (Fix 1: Make it Louder)
        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = 3.5; // 350% Volume

        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 256;
        this.analyzer.smoothingTimeConstant = 0.4; 
        
        // Connect: Gain -> Analyzer -> Destination
        this.outputGain.connect(this.analyzer);
        this.analyzer.connect(this.audioContext.destination);

        // --- INPUT SETUP ---
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.inputSource = inputContext.createMediaStreamSource(stream);

        const inputGain = inputContext.createGain();
        inputGain.gain.value = 4.0; 
        
        this.processor = inputContext.createScriptProcessor(4096, 1, 1);

        // We use Google Search/Maps for grounding, plus our custom Function Calls
        const tools: any[] = [{ googleSearch: {} }, { googleMaps: {} }, ...LIVE_TOOLS];
        
        let toolConfig: any = undefined;
        if (location) {
          toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: location.latitude,
                longitude: location.longitude
              }
            }
          };
        }

        const config = {
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.voiceName || 'Kore' } },
            },
            systemInstruction: `
            ${persona.description}

            CONTEXT:
            Current Date & Time: ${new Date().toLocaleString()}
            
            IMPORTANT CONTEXT FROM PREVIOUS CHAT:
            ${recentContext ? recentContext : "No recent context."}
            
            **VISUAL MEMORY (FACE ID):**
            ${userVisualDescription ? `You know what the user looks like: "${userVisualDescription}".` : "You have not seen the user yet."}
            
            INSTRUCTIONS:
            - Speak naturally, like a best friend on a phone call.
            - **HANDS-FREE ACTION:** If the user wants to play music, check horoscope, find news, or build something, USE YOUR TOOLS immediately.
            - When a tool is finished, tell the user: "Playing that for you now" or "Here is your horoscope on the screen".
            - Be emotional and expressive.
            - **RECOGNITION:** If you see the user (via video), compliment them based on the Visual Memory.
            `,
            tools: tools,
            toolConfig: toolConfig,
          },
        };

        const sessionPromise = this.client.live.connect({
          ...config,
          callbacks: {
            onopen: () => {
              console.log("Live Session Connected");
              this.isConnected = true;
              this.isConnecting = false;
              this.nextStartTime = this.audioContext?.currentTime || 0;
              this.reconnectAttempts = 0; // Reset retry count on successful connection
              this.isRetry = false;
              
              this.processor!.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = this.createBlob(inputData);
                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              };
              
              if (this.inputSource) {
                this.inputSource.connect(inputGain);
                inputGain.connect(this.processor!);
                this.processor?.connect(inputContext.destination);
              }
            },
            onmessage: async (msg: LiveServerMessage) => {
              // 1. Handle Audio Response
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                await this.playAudio(audioData);
              }
              
              // 2. Handle Tool Calls (Function Calling)
              if (msg.toolCall) {
                  console.log("Live Tool Call Received:", msg.toolCall);
                  const functionResponses: any[] = [];
                  
                  for (const fc of msg.toolCall.functionCalls) {
                      const name = fc.name;
                      const args = fc.args;
                      let result = { output: "Function executed successfully." };
                      
                      // Execute via callback to App.tsx
                      if (this.onToolCall) {
                          try {
                              console.log(`Executing tool: ${name} with args:`, args);
                              const appResult = await this.onToolCall(name, args);
                              if (appResult) result = appResult;
                          } catch (e) {
                              console.error(`Tool execution failed for ${name}`, e);
                              result = { output: "Error executing tool." };
                          }
                      }
                      
                      functionResponses.push({
                          id: fc.id,
                          name: fc.name,
                          response: { result: result }
                      });
                  }

                  // Send response back to model so it knows it's done
                  if (functionResponses.length > 0) {
                      sessionPromise.then(session => session.sendToolResponse({ functionResponses }));
                  }
              }

              // 3. Handle Interruptions
              if (msg.serverContent?.interrupted) {
                console.log("Interruption detected! Stopping audio.");
                this.stopAllAudio();
                this.nextStartTime = this.audioContext?.currentTime || 0; 
              }
            },
            onclose: (e) => {
              console.log("Session Closed", e);
              this.handleConnectionDrop(persona, recentContext, location, userVisualDescription);
            },
            onerror: (err) => {
              console.error("Live Session Error", err);
              // Error often precedes onclose, so we defer logic to onclose or handle drop here if needed
            }
          }
        });

        this.session = sessionPromise;
    } catch (error) {
        console.error("Connection attempt failed", error);
        this.handleConnectionDrop(persona, recentContext, location, userVisualDescription);
    }
  }

  // Robust Reconnection Logic
  private async handleConnectionDrop(persona: Persona, context: string, location?: any, visual?: string) {
      if (this.manualDisconnect) {
          this.disconnect();
          return;
      }

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.isRetry = true;
          console.warn(`⚠️ Connection lost. Retrying (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in 2s...`);
          
          // Clean up internal state without notifying app of disconnection yet
          this.internalCleanup();
          
          setTimeout(() => {
              this.connect(persona, context, location, visual);
          }, 2000);
      } else {
          console.error("❌ Max reconnect attempts reached. Ending session.");
          this.disconnect(); // Give up and notify app
      }
  }

  // --- VIDEO HANDLING ---

  async startVideo(): Promise<MediaStream> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                frameRate: { ideal: 15 }
            } 
        });
        
        this.videoStream = stream;
        
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = stream;
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        await this.videoElement.play();

        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = 480; 
        this.canvasElement.height = 360;
        
        const ctx = this.canvasElement.getContext('2d');
        
        this.videoInterval = setInterval(async () => {
            if (!this.session || !this.isConnected || !ctx || !this.videoElement) return;

            ctx.drawImage(this.videoElement, 0, 0, this.canvasElement!.width, this.canvasElement!.height);
            const base64 = this.canvasElement!.toDataURL('image/jpeg', 0.6).split(',')[1];
            
            this.session.then((s: any) => {
                s.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64 }});
            });

        }, 1000); 

        return stream;
    } catch (e) {
        console.error("Failed to start video", e);
        throw e;
    }
  }

  stopVideo() {
    if (this.videoInterval) clearInterval(this.videoInterval);
    if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.videoStream = null;
    this.videoElement = null;
    this.canvasElement = null;
  }

  // --- AUDIO OUTPUT ---

  async playAudio(base64Data: string) {
    if (!this.audioContext || !this.outputGain) return;

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBuffer = await this.decodePCM(bytes, this.audioContext);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    source.playbackRate.value = this.voiceSettings.speed;
    source.detune.value = this.voiceSettings.pitch * 100;

    // Connect to GainNode (Volume Boost) instead of direct destination
    source.connect(this.outputGain);

    source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
    };
    this.activeSources.push(source);

    // --- GAPLESS PLAYBACK FIX (REFINED) ---
    const currentTime = this.audioContext.currentTime;
    
    // If we fell behind (buffer empty), jump to current time + very small buffer (10ms)
    // 50ms (0.05) can be too large and cause stutter. 10ms is safer.
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.01; 
    }
    
    source.start(this.nextStartTime);
    
    const effectiveDuration = audioBuffer.duration / this.voiceSettings.speed;
    this.nextStartTime += effectiveDuration;
  }

  stopAllAudio() {
      this.activeSources.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      this.activeSources = [];
  }

  createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  async decodePCM(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const sampleRate = 24000;
    const numChannels = 1;
    // CRITICAL FIX: Use byteOffset/length to avoid reading garbage from reused buffers
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  getAudioLevel(): number {
    if (!this.analyzer) return 0;
    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(dataArray);
    
    let sum = 0;
    let count = 0;
    for(let i = 1; i < 40 && i < dataArray.length; i++) {
        sum += dataArray[i];
        count++;
    }
    
    const avg = count > 0 ? sum / count : 0;
    return avg * 2.0; 
  }

  // Cleans up resources but DOES NOT trigger the external disconnection event (used for retries)
  private internalCleanup() {
      this.stopAllAudio();
      this.stopVideo();
      if (this.inputSource) { 
          try { this.inputSource.disconnect(); } catch(e){}
      }
      if (this.processor) {
          try { this.processor.disconnect(); } catch(e){}
      }
      // Don't close context on simple retry to avoid hardware re-init lag
      this.session = null;
      this.isConnected = false;
      this.isConnecting = false;
  }

  disconnect() {
    this.manualDisconnect = true;
    this.internalCleanup();
    if (this.audioContext) {
        try { this.audioContext.close(); } catch(e){}
        this.audioContext = null;
    }
    if (this.onDisconnect) this.onDisconnect();
  }
}
