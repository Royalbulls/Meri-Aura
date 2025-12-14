
import React, { useState, useEffect, useRef } from 'react';
import { 
  Message, Sender, Persona, AvatarState, VoiceSettings, 
  PersonalitySettings, AvatarLayout, StudioTool, AstrologyDetails,
  StoredFile, BrowserState
} from './types';
import { 
  DEFAULT_PERSONAS, INITIAL_GREETING, CREATIVE_TOOLS 
} from './constants';
import { 
  generateChatResponse, generateAvatarImage, generateAvatarVideo, 
  generateSpeech, generatePersonaFromAstrology, generateCollabImage,
  generateCreativeContent, generateSpeechDownloadUrl 
} from './services/geminiService';
import { storageService } from './services/storageService';
import { memoryService } from './services/memoryService';

import { AvatarDisplay } from './components/AvatarDisplay';
import { ChatInterface } from './components/ChatInterface';
import { CustomizationModal } from './components/CustomizationModal';
import { CreativeStudioModal } from './components/CreativeStudioModal';
import { BrowserOverlay } from './components/BrowserOverlay';
import { LiveScanner } from './components/LiveScanner'; 
import { KidsModeModal } from './components/KidsModeModal';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { AuraConnect } from './components/AuraConnect';
import { AuraNews } from './components/AuraNews';
import { AuraPodcast } from './components/AuraPodcast';
import { AuraGenesis } from './components/AuraGenesis'; 

// --- LOCAL RESPONSES (No API Cost) ---
const getLocalResponse = (text: string, personaName: string): string | null => {
    const lower = text.toLowerCase().trim();
    
    // Greetings
    if (['hi', 'hello', 'hey', 'hlo', 'hii'].includes(lower)) 
        return `Hey! Kaisi ho? I am ${personaName}.`;
    
    if (['kaise ho', 'how are you', 'kya haal hai'].includes(lower))
        return "Main badhiya hu! Bas tumhara wait kar rahi thi. Batao kya plan hai?";

    if (['bye', 'goodbye', 'tata', 'gn', 'good night'].includes(lower))
        return "Bye! Jaldi wapas aana. Miss you! ✨";

    if (['thanks', 'thank you', 'tq'].includes(lower))
        return "Arey dost ko thanks nahi bolte! ❤️";

    if (['who are you', 'tum kaun ho'].includes(lower))
        return `Main ${personaName} hu, tumhari virtual friend!`;

    return null; // Return null to use Gemini API
};

const App: React.FC = () => {
  // ... existing state ...
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Persona>(DEFAULT_PERSONAS[0]);
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  
  const [avatarState, setAvatarState] = useState<AvatarState>({
    imageUrl: null,
    videoUrl: null,
    isLoading: false,
    isTalking: false,
    userPhotoUrl: null
  });

  // NEW BROWSER STATE
  const [browserState, setBrowserState] = useState<BrowserState>({
      isOpen: false,
      url: 'https://www.google.com',
      advice: '',
      isLoadingAdvice: false
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ speed: 1.0, pitch: 0 });
  const [personalitySettings, setPersonalitySettings] = useState<PersonalitySettings>({ playfulness: 50, empathy: 80, directness: 30 });
  const [avatarLayout, setAvatarLayout] = useState<AvatarLayout>({ scale: 1.0, x: 0, y: 0 });

  const [showCustomization, setShowCustomization] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showLiveScanner, setShowLiveScanner] = useState(false); 
  const [showKidsMode, setShowKidsMode] = useState(false); 
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showAuraConnect, setShowAuraConnect] = useState(false); 
  const [showAuraNews, setShowAuraNews] = useState(false); 
  const [showAuraPodcast, setShowAuraPodcast] = useState(false); 
  const [showAuraGenesis, setShowAuraGenesis] = useState(false); 
  const [dreamCoins, setDreamCoins] = useState(0); 
  
  // Audio State for Lip Sync
  const [audioLevel, setAudioLevel] = useState(0);
  const [isUserTyping, setIsUserTyping] = useState(false);
  
  // --- SHARED AUDIO SYSTEM REFS ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ... handlers (avatar update, animation, collab, etc.) ...
  const handleUpdateLook = async (prompt: string, customMessage?: string) => {
      setAvatarState(prev => ({ ...prev, isLoading: true }));
      try {
          // If level is high, force high quality terms
          const levelMod = (currentPersona.level || 1) > 2 ? ", highly detailed, masterpiece, 8k, cinematic lighting" : "";
          const fullPrompt = `${currentPersona.visualPrompt}, ${prompt}${levelMod}`;
          
          const base64Image = await generateAvatarImage(fullPrompt);
          await storageService.saveImage('current_avatar', base64Image);
          await storageService.clearImage('current_video');
          setAvatarState(prev => ({ ...prev, imageUrl: base64Image, videoUrl: null, isLoading: false }));
          
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: customMessage || "I updated my look! How is it? ✨",
              sender: Sender.Bot,
              timestamp: new Date(),
              attachmentUrl: base64Image
          }]);

      } catch (e) {
          console.error(e);
          setAvatarState(prev => ({ ...prev, isLoading: false }));
          alert("Failed to generate avatar look.");
      }
  };

  // ... existing useEffects ...
  useEffect(() => {
    const loadData = async () => {
      const storedHistory = localStorage.getItem('chat_history');
      if (storedHistory) setMessages(JSON.parse(storedHistory));
      else setMessages([{ id: 'init', text: INITIAL_GREETING, sender: Sender.Bot, timestamp: new Date() }]);

      const storedPersona = localStorage.getItem('app_persona');
      if (storedPersona) {
          // Merge with default to ensure new fields like Level/XP exist
          const p = JSON.parse(storedPersona);
          setCurrentPersona({ ...DEFAULT_PERSONAS[0], ...p });
      }
      
      const storedPersonas = localStorage.getItem('app_custom_personas');
      if (storedPersonas) setPersonas([...DEFAULT_PERSONAS, ...JSON.parse(storedPersonas)]);

      const storedVoice = localStorage.getItem('app_voice_settings');
      if (storedVoice) setVoiceSettings(JSON.parse(storedVoice));
      
      const storedLayout = localStorage.getItem('app_avatar_layout');
      if (storedLayout) setAvatarLayout(JSON.parse(storedLayout));

      const storedPersonality = localStorage.getItem('app_personality_settings');
      if (storedPersonality) setPersonalitySettings(JSON.parse(storedPersonality));
      
      // Load Coins
      const savedCoins = localStorage.getItem('dream_coins');
      if (savedCoins) setDreamCoins(parseInt(savedCoins));

      const avatarImg = await storageService.getImage('current_avatar');
      const videoImg = await storageService.getImage('current_video');
      const userImg = await storageService.getImage('user_photo');
      
      setAvatarState(prev => ({
        ...prev,
        imageUrl: avatarImg || null,
        videoUrl: videoImg || null,
        userPhotoUrl: userImg || null
      }));

      if (!avatarImg) {
          handleUpdateLook(currentPersona.visualPrompt, "Hello! I have manifested myself based on our connection. I am Aura. How do I look? ✨");
      }
    };

    loadData();
    return () => { 
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleUpdateCoins = (newAmount: number) => {
      setDreamCoins(newAmount);
      localStorage.setItem('dream_coins', newAmount.toString());
  };

  // --- AUTO UPGRADE SYSTEM ---
  const handleXpGain = (amount: number) => {
      setCurrentPersona(prev => {
          const newXp = (prev.xp || 0) + amount;
          const currentLevel = prev.level || 1;
          const nextLevelThreshold = currentLevel * 100; // e.g. 100, 200, 300...
          
          let newLevel = currentLevel;
          let leveledUp = false;

          if (newXp >= nextLevelThreshold) {
              newLevel += 1;
              leveledUp = true;
          }

          const updatedPersona = { ...prev, xp: newXp, level: newLevel };
          localStorage.setItem('app_persona', JSON.stringify(updatedPersona));

          if (leveledUp) {
              // Trigger Auto-Upgrade of Appearance
              setTimeout(() => {
                  setMessages(prevMsgs => [...prevMsgs, { 
                      id: Date.now().toString(), 
                      text: `✨ I feel... different. I've evolved to Level ${newLevel}! Upgrading my look...`, 
                      sender: Sender.Bot, 
                      timestamp: new Date() 
                  }]);
                  handleUpdateLook(`${updatedPersona.visualPrompt}, glowing ethereal aura, evolved form, futuristic fashion, intricate details, 8k resolution, divine lighting, level ${newLevel} evolution`);
              }, 1000);
          }

          return updatedPersona;
      });
  };

  // --- AUDIO SYSTEM INITIALIZER ---
  const initAudioSystem = () => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          // Note: We don't connect analyser to destination here because the source will connect to it
      }
      if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
      }
      return { ctx: audioContextRef.current, analyser: analyserRef.current };
  };

  // ... handleSendMessage ...
  const handleSendMessage = async (text: string) => {
    // 0. CHECK FOR SYSTEM DIAGNOSTICS COMMAND
    if (['run system check', 'system check', 'diagnostics', 'run diagnostics'].includes(text.toLowerCase().trim())) {
        setShowDiagnostics(true);
        return;
    }

    // 1. CHECK FOR BROWSER COMMANDS
    const openBrowserRegex = /(?:open|go to|browse)\s+(.+)/i;
    const browserMatch = text.match(openBrowserRegex);
    if (browserMatch && !isProcessing) {
        const query = browserMatch[1];
        let targetUrl = query;
        if (!query.includes('.') && !query.includes('http')) {
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        } else if (!query.startsWith('http')) {
            targetUrl = `https://${query}`;
        }
        
        setBrowserState(prev => ({ ...prev, isOpen: true, url: targetUrl }));
        setMessages(prev => [...prev, { id: Date.now().toString(), text: text, sender: Sender.User, timestamp: new Date() }]);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: `Opening browser for: ${query}. I'll monitor it for you.`, sender: Sender.Bot, timestamp: new Date() }]);
        return;
    }

    // 2. CHECK FOR YOUTUBE COMMANDS
    const watchRegex = /^(?:watch|play|see|search youtube for)\s+(.+)/i;
    const watchMatch = text.match(watchRegex);
    if (watchMatch && !isProcessing) {
        const query = watchMatch[1];
        const ytTool = CREATIVE_TOOLS.find(t => t.action === 'youtube_search');
        if (ytTool) {
             handleToolSelect(ytTool, query);
             return;
        }
    }

    const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.User, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    // GRANT XP
    handleXpGain(10); 
    
    // 3. TRY LOCAL RESPONSE FIRST (SAVE TOKENS)
    const localReply = getLocalResponse(text, currentPersona.name);
    if (localReply) {
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: localReply,
                sender: Sender.Bot,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
            handleSpeakMessage(localReply); // Speak local response too
            setIsProcessing(false);
        }, 600); // Small fake delay for realism
        return;
    }
    
    // Only embed long meaningful messages to save costs
    if (text.length > 20) {
        memoryService.addMemory(text);
    }
    const context = await memoryService.searchMemories(text);

    let location = undefined;
    try {
        await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => { location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; resolve(); },
                () => resolve(), 
                { timeout: 2000 }
            );
        });
    } catch(e) {}

    try {
      const response = await generateChatResponse(
          messages.slice(-6), // REDUCED HISTORY TO SAVE INPUT TOKENS
          text,
          currentPersona, // Passes current level/xp state
          location,
          context,
          personalitySettings
      );
      
      // --- AUTO TOOL EXECUTION (Aura Agent Mode) ---
      if (response.toolCall) {
          const toolName = response.toolCall.name;
          const toolArgs = response.toolCall.args;
          
          console.log(`🤖 Auto-Tool Triggered: ${toolName}`, toolArgs);
          
          // Map function names to CREATIVE_TOOLS
          const tool = CREATIVE_TOOLS.find(t => t.action === toolName);
          
          if (tool) {
              // Execute the tool automatically
              // Extract the main input parameter (query, topic, theme, story, description)
              const toolInput = toolArgs.query || toolArgs.topic || toolArgs.theme || toolArgs.story || toolArgs.description || "";
              
              // We inform the user briefly before switching context
              setMessages(prev => [...prev, { 
                  id: (Date.now() + 1).toString(), 
                  text: `I'm using the ${tool.label} to handle that...`, 
                  sender: Sender.Bot, 
                  timestamp: new Date()
              }]);

              // Call the tool handler
              await handleToolSelect(tool, toolInput);
              setIsProcessing(false);
              return; 
          }
      }

      // Normal Text Response
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: Sender.Bot,
        timestamp: new Date(),
        groundingMetadata: response.groundingMetadata,
        directionsUrl: response.directionsUrl
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Auto-speak response
      if (response.text) {
          handleSpeakMessage(response.text);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "I'm having trouble connecting to the stars right now.", sender: Sender.Bot, timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToolSelect = async (tool: StudioTool, input: string, imageInput?: string, option?: any) => {
      // HANDLE KIDS MODE
      if (tool.action === 'kids_mode') {
          setShowKidsMode(true);
          return;
      }

      // HANDLE CRM MODE
      if (tool.action === 'aura_connect') {
          setShowAuraConnect(true);
          return;
      }

      // HANDLE NEWS MODE (NEW)
      if (tool.action === 'news_reporter') {
          setShowAuraNews(true);
          return;
      }

      // HANDLE PODCAST MODE (NEW)
      if (tool.action === 'aura_podcast') {
          setShowAuraPodcast(true);
          return;
      }
      
      // HANDLE WEB BROWSER TOOL EXPLICITLY
      if (tool.action === 'web_browser') {
          setBrowserState({ isOpen: true, url: input.startsWith('http') ? input : `https://www.google.com/search?q=${input}`, advice: '', isLoadingAdvice: true });
          return;
      }

      // --- NEW: AUTO-INJECT CURRENT AVATAR FOR TRAINING, VIRAL & AUTO-CREATE ---
      if ((tool.action === 'aura_training' || tool.action === 'aura_viral' || tool.action === 'aura_auto_create') && !imageInput && avatarState.imageUrl) {
          imageInput = avatarState.imageUrl;
      }

      setIsProcessing(true);
      setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          text: `Using Tool: ${tool.label}... ${imageInput ? '(analyzing image)' : ''}`, 
          sender: Sender.User, 
          timestamp: new Date(),
          attachmentUrl: imageInput 
      }]);
      try {
          let location = undefined;
          // ADD 'website' to the list of tools that require location context
          if (['vastu_scan', 'check_location', 'live_vastu', 'trend_hunter', 'website'].includes(tool.action)) {
              await new Promise<void>((resolve) => {
                  navigator.geolocation.getCurrentPosition(pos => { location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; resolve(); }, () => resolve(), { timeout: 3000 });
              });
          }
          const result = await generateCreativeContent(tool.action, input, currentPersona, imageInput, option, location);
          
          let type = 'text';
          if (tool.action === 'website') type = 'html';
          else if (tool.action === 'react_app') type = 'react_app';
          else if (tool.action === 'comic') type = 'comic';
          else if (tool.action === 'patrika') type = 'patrika';
          else if (tool.action === 'horoscope') type = 'horoscope';
          else if (tool.action === 'kundli_milan') type = 'kundli_milan';
          else if (tool.action === 'numerology') type = 'numerology';
          else if (tool.action === 'dream_analysis') type = 'blog';
          else if (tool.action === 'earth') type = 'earth';
          else if (tool.action === 'music_video_gen') type = 'music_visual';
          else if (tool.action === 'generate_csv') type = 'spreadsheet';
          else if (['generate_report', 'generate_doc'].includes(tool.action)) type = 'document';
          else if (['blog_post', 'vastu_scan', 'ai_chef', 'vision_scan', 'live_vastu', 'trend_hunter'].includes(tool.action)) type = 'blog';
          else if (tool.action === 'smart_measure') type = 'html'; 
          else if (tool.action === 'aura_viral') type = 'viral_post'; 
          else if (tool.action === 'aura_auto_create' && result.contentType) type = result.contentType as any; // Dynamic type for auto mode
          
          const botMsg: Message = {
              id: Date.now().toString(),
              text: result.text,
              sender: Sender.Bot,
              timestamp: new Date(),
              codeSnippet: result.code,
              contentType: type as any,
              attachmentUrl: result.imageUrl,
              videoUrl: result.videoUrl, // Updated to support video response
              earthLocation: result.earthLocation,
              groundingMetadata: result.groundingMetadata,
              viralMetadata: result.viralMetadata // Pass viral metadata
          };
          setMessages(prev => [...prev, botMsg]);
          handleXpGain(20); // More XP for using tools
      } catch (e) {
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "Tool execution failed.", sender: Sender.Bot, timestamp: new Date() }]);
      } finally { setIsProcessing(false); }
  };

  const handleAnimateAvatar = async (style: string) => {
      if (!avatarState.imageUrl) return;
      
      // Prevent multiple clicks
      if (avatarState.isLoading) return;

      setAvatarState(prev => ({ ...prev, isLoading: true }));
      
      // Safety Timeout to prevent eternal black screen
      const timeoutId = setTimeout(() => {
          setAvatarState(prev => {
              if (prev.isLoading) {
                  alert("Animation request timed out. Please try again.");
                  return { ...prev, isLoading: false };
              }
              return prev;
          });
      }, 90000); // 90 seconds timeout for video gen

      try {
          const prompt = `animate this character, ${style} style, moving naturally, looking at camera, 720p, high quality`;
          
          // 1. Generate Video URI
          const videoUri = await generateAvatarVideo(avatarState.imageUrl, prompt);
          
          // 2. Fetch Blob (Video Data)
          const response = await fetch(videoUri);
          if (!response.ok) throw new Error("Video download failed");
          
          // FIX: Explicitly convert to array buffer then blob with video/mp4 MIME type
          // This ensures the browser video player recognizes the format
          const videoBuffer = await response.arrayBuffer();
          const blob = new Blob([videoBuffer], { type: 'video/mp4' });
          
          // 3. Create Immediate Playback URL (Blobs are instant)
          const playbackUrl = URL.createObjectURL(blob);
          
          setAvatarState(prev => ({ ...prev, videoUrl: playbackUrl, isLoading: false }));
          clearTimeout(timeoutId);
          
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: "Here is your animated video! 🎬",
              sender: Sender.Bot,
              timestamp: new Date(),
              videoUrl: playbackUrl
          }]);

          // 4. Save to Storage (Async Background Task) - Prevents UI freeze
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
              const base64 = reader.result as string;
              storageService.saveImage('current_video', base64).catch(err => console.error("Video save failed", err));
          };

      } catch (e) {
          console.error(e);
          clearTimeout(timeoutId);
          setAvatarState(prev => ({ ...prev, isLoading: false }));
          alert("Animation generation failed. Please try again.");
      }
  };

  const handleGenerateCollab = async (style: string) => {
      if (!avatarState.userPhotoUrl) return;
      setAvatarState(prev => ({ ...prev, isLoading: true }));
      try {
          const img = await generateCollabImage(currentPersona.visualPrompt, avatarState.userPhotoUrl, style);
           setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: "Here is our collab photo! 📸",
              sender: Sender.Bot,
              timestamp: new Date(),
              attachmentUrl: img
          }]);
          setAvatarState(prev => ({ ...prev, isLoading: false }));
      } catch (e) {
           setAvatarState(prev => ({ ...prev, isLoading: false }));
           alert("Collab generation failed.");
      }
  };
  
  const handleFileUpload = async (file: File) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          const storedFile: StoredFile = {
              id: Date.now().toString(),
              name: file.name,
              type: file.type,
              data: base64,
              timestamp: Date.now()
          };
          await storageService.saveFile(storedFile);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: "File securely uploaded to Vault.",
              sender: Sender.User,
              timestamp: new Date(),
              contentType: 'file_attachment',
              attachmentUrl: base64,
              fileName: file.name
          }]);
      };
  };

  // --- UPDATED TTS HANDLER WITH LIP SYNC ---
  const handleSpeakMessage = async (text: string) => {
      const { ctx, analyser } = initAudioSystem();
      
      // Stop previous standard audio
      if (currentSourceRef.current) {
          try { currentSourceRef.current.stop(); } catch(e) {}
      }
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
      }

      try {
          const buffer = await generateSpeech(text, currentPersona.voiceName, ctx);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          
          // Connect Graph: Source -> Analyser -> Speaker
          if (analyser) {
              source.connect(analyser);
              analyser.connect(ctx.destination);
          } else {
              source.connect(ctx.destination);
          }
          
          currentSourceRef.current = source;
          source.start(0);

          // Animation Loop for Talking Tom Effect
          const updateLipSync = () => {
              if (!analyser) return; 
              
              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(dataArray);
              
              // Calculate Volume Energy
              let sum = 0;
              const binCount = Math.floor(dataArray.length / 2); // Focus on vocals
              for (let i = 0; i < binCount; i++) {
                  sum += dataArray[i];
              }
              const avg = binCount > 0 ? sum / binCount : 0;
              
              // Boost sensitivity for visual impact
              setAudioLevel(avg * 2.5); 

              if (avg > 0 || source.context.state === 'running') {
                   animationFrameRef.current = requestAnimationFrame(updateLipSync);
              }
          };
          
          updateLipSync();

          source.onended = () => {
              if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
              setAudioLevel(0);
              currentSourceRef.current = null;
          };

      } catch (e) {
          console.error("TTS failed", e);
      }
  };
  
  const handleStopAudio = () => {
      if (currentSourceRef.current) {
          try { currentSourceRef.current.stop(); } catch(e) {}
          currentSourceRef.current = null;
      }
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
  };

  // --- NEW: HANDLE DOWNLOAD AUDIO (WAV) ---
  const handleDownloadAudio = async (text: string) => {
      const wavUrl = await generateSpeechDownloadUrl(text, currentPersona.voiceName);
      const link = document.createElement('a');
      link.href = wavUrl;
      link.download = `aura-speech-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCreateCosmicPersona = async (details: AstrologyDetails) => {
      setIsProcessing(true);
      try {
          const newPersona = await generatePersonaFromAstrology(details);
          const updatedPersonas = [...personas, newPersona];
          setPersonas(updatedPersonas);
          setCurrentPersona(newPersona);
          localStorage.setItem('app_custom_personas', JSON.stringify(updatedPersonas.filter(p => p.isCustom)));
          localStorage.setItem('app_persona', JSON.stringify(newPersona));
          handleUpdateLook(newPersona.visualPrompt);
      } catch (e) {
          alert("Failed to create cosmic persona.");
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-gray-900 overflow-hidden text-white">
      {/* Layer 0: Avatar (Background) - Z-0 */}
      <div className="absolute inset-0 z-0">
         <AvatarDisplay 
            avatarState={avatarState} 
            audioLevel={audioLevel} 
            isThinking={isProcessing} 
            isUserTyping={isUserTyping}
            layout={avatarLayout}
            onAnimateRequest={() => handleAnimateAvatar('cinematic')}
            onDownloadVideo={() => {
                if(avatarState.videoUrl) {
                    const link = document.createElement('a');
                    link.href = avatarState.videoUrl;
                    link.download = 'aura-video.mp4';
                    link.click();
                }
            }}
             onDownloadImage={() => {
                if(avatarState.imageUrl) {
                    const link = document.createElement('a');
                    link.href = avatarState.imageUrl;
                    link.download = 'aura-image.png';
                    link.click();
                }
            }}
         />
      </div>

      {/* Layer 1: UI (Foreground) - Z-50 Ensure Accessibility */}
      <div className="absolute inset-0 z-50 pointer-events-none flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {/* HEADER */}
          <div className="p-4 pt-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-auto shrink-0">
               <div className="flex items-center gap-3">
                   <button 
                    onClick={() => setShowCustomization(true)}
                    className="w-10 h-10 rounded-full border border-white/20 overflow-hidden relative group shadow-lg"
                   >
                       {avatarState.imageUrl ? (
                           <img src={avatarState.imageUrl} className="w-full h-full object-cover" />
                       ) : (
                           <div className="w-full h-full bg-pink-600 flex items-center justify-center">?</div>
                       )}
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           ⚙️
                       </div>
                   </button>
                   <div>
                       <h1 className="text-lg font-bold shadow-black drop-shadow-md">{currentPersona.name}</h1>
                       <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-green-500"></span>
                           <span className="text-xs text-white/70 shadow-black drop-shadow-sm">
                               Level {currentPersona.level || 1} • {currentPersona.xp || 0} XP
                           </span>
                       </div>
                       {/* Level Progress Bar */}
                       <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                           <div 
                                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${Math.min(((currentPersona.xp || 0) % 100), 100)}%` }}
                           ></div>
                       </div>
                   </div>
               </div>

               {/* SETTINGS BUTTON */}
               <button
                  onClick={() => setShowCustomization(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                  title="Settings"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
               </button>
          </div>

          <ChatInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            onMicClick={() => {}}
            isListening={false}
            onMagicClick={() => handleSendMessage("Surprise me with something amazing!")}
            onOpenStudio={() => setShowStudio(true)}
            onTypingChange={setIsUserTyping}
            onFeedback={(id, rating) => {
                 setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: rating } : m));
            }}
            onSpeakMessage={handleSpeakMessage}
            onDownloadAudio={handleDownloadAudio} // Pass new handler
            onStopAudio={handleStopAudio}
            isTalking={audioLevel > 5}
            onFileUpload={handleFileUpload}
            onBrowserClick={() => setBrowserState(prev => ({ ...prev, isOpen: true }))}
            onGenesisClick={() => setShowAuraGenesis(true)} // Handle Genie Click
          />
      </div>

      <CustomizationModal 
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        currentPersona={currentPersona}
        availablePersonas={personas}
        onSelectPersona={(p) => {
            setCurrentPersona(p);
            localStorage.setItem('app_persona', JSON.stringify(p));
            if (p.visualPrompt !== currentPersona.visualPrompt && !avatarState.imageUrl) {
                 handleUpdateLook(p.visualPrompt);
            }
        }}
        onUpdateLook={handleUpdateLook}
        onAnimateAvatar={handleAnimateAvatar}
        onDownloadAvatar={(type) => {
             if(type === 'video' && avatarState.videoUrl) {
                    const link = document.createElement('a');
                    link.href = avatarState.videoUrl;
                    link.download = 'aura-video.mp4';
                    link.click();
             } else if (type === 'image' && avatarState.imageUrl) {
                    const link = document.createElement('a');
                    link.href = avatarState.imageUrl;
                    link.download = 'aura-image.png';
                    link.click();
             }
        }}
        onDownloadHistory={() => {}}
        onResetMemory={() => {
             localStorage.removeItem('chat_history');
             setMessages([{ id: 'init', text: INITIAL_GREETING, sender: Sender.Bot, timestamp: new Date() }]);
        }}
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={(s) => {
             setVoiceSettings(s);
             localStorage.setItem('app_voice_settings', JSON.stringify(s));
        }}
        onTestVoice={() => handleSpeakMessage(`Hello, I am ${currentPersona.name}. Nice to meet you.`)}
        isLoading={avatarState.isLoading}
        onCreateCosmicPersona={handleCreateCosmicPersona}
        onUploadUserPhoto={async (file) => {
             const reader = new FileReader();
             reader.readAsDataURL(file);
             reader.onloadend = async () => {
                 const base64 = reader.result as string;
                 await storageService.saveImage('user_photo', base64);
                 setAvatarState(prev => ({ ...prev, userPhotoUrl: base64 }));
             }
        }}
        onGenerateCollab={handleGenerateCollab}
        userPhotoUrl={avatarState.userPhotoUrl}
        avatarLayout={avatarLayout}
        onUpdateAvatarLayout={(l) => {
            setAvatarLayout(l);
            localStorage.setItem('app_avatar_layout', JSON.stringify(l));
        }}
        personalitySettings={personalitySettings}
        onUpdatePersonalitySettings={(s) => {
            setPersonalitySettings(s);
            localStorage.setItem('app_personality_settings', JSON.stringify(s));
        }}
        hasImage={!!avatarState.imageUrl}
        hasVideo={!!avatarState.videoUrl}
      />

      <CreativeStudioModal 
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        onToolSelect={handleToolSelect}
        isProcessing={isProcessing}
        onOpenLiveScanner={() => setShowLiveScanner(true)}
      />
      
      <BrowserOverlay 
        isOpen={browserState.isOpen}
        initialUrl={browserState.url}
        onClose={() => setBrowserState(prev => ({ ...prev, isOpen: false }))}
      />

      <LiveScanner 
        isOpen={showLiveScanner}
        onClose={() => setShowLiveScanner(false)}
        currentPersona={currentPersona}
      />

      <KidsModeModal 
        isOpen={showKidsMode}
        onClose={() => setShowKidsMode(false)}
        dreamCoins={dreamCoins}
        onUpdateCoins={handleUpdateCoins}
      />

      {showDiagnostics && (
          <SystemDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}

      <AuraConnect 
        isOpen={showAuraConnect} 
        onClose={() => setShowAuraConnect(false)} 
        currentPersona={currentPersona} 
      />

      <AuraNews 
        isOpen={showAuraNews} 
        onClose={() => setShowAuraNews(false)} 
        currentPersona={currentPersona} 
      />

      <AuraPodcast 
        isOpen={showAuraPodcast} 
        onClose={() => setShowAuraPodcast(false)} 
      />

      {/* NEW: GENIE MODE */}
      <AuraGenesis
        isOpen={showAuraGenesis}
        onClose={() => setShowAuraGenesis(false)}
        onAddMessage={(msg) => setMessages(prev => [...prev, msg])}
      />

    </div>
  );
};

export default App;
