
// ... existing imports ...
import React, { useState, useEffect, useRef } from 'react';
import { 
  Message, Sender, Persona, AvatarState, VoiceSettings, 
  PersonalitySettings, AvatarLayout, StudioTool, AstrologyDetails,
  StoredFile, BrowserState
} from './types';
import { 
  DEFAULT_PERSONAS, INITIAL_GREETING 
} from './constants';
import { 
  generateChatResponse, generateAvatarImage, generateAvatarVideo, 
  generateSpeech, generatePersonaFromAstrology, generateCollabImage,
  generateCreativeContent
} from './services/geminiService';
import { storageService } from './services/storageService';
import { memoryService } from './services/memoryService';
import { LiveManager } from './services/liveManager';

import { AvatarDisplay } from './components/AvatarDisplay';
import { ChatInterface } from './components/ChatInterface';
import { CustomizationModal } from './components/CustomizationModal';
import { CreativeStudioModal } from './components/CreativeStudioModal';
import { BrowserOverlay } from './components/BrowserOverlay';
import { LiveScanner } from './components/LiveScanner'; // New Import
import { KidsModeModal } from './components/KidsModeModal'; // New Import

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
  const [showLiveScanner, setShowLiveScanner] = useState(false); // New state
  const [showKidsMode, setShowKidsMode] = useState(false); // New State
  const [dreamCoins, setDreamCoins] = useState(0); // New State
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  
  const liveManagerRef = useRef<LiveManager | null>(null);

  // ... existing useEffects ...
  useEffect(() => {
    liveManagerRef.current = new LiveManager(process.env.API_KEY || '');
    liveManagerRef.current.onVolumeChange = (level) => setAudioLevel(level);
    liveManagerRef.current.onDisconnect = () => setIsCallActive(false);
    liveManagerRef.current.onToolCall = async (name, args) => {
        if (name === 'check_location' || name === 'navigate_to') {
             return { result: "Location services accessed." };
        }
        return { result: "Tool executed." };
    };

    const loadData = async () => {
      const storedHistory = localStorage.getItem('chat_history');
      if (storedHistory) setMessages(JSON.parse(storedHistory));
      else setMessages([{ id: 'init', text: INITIAL_GREETING, sender: Sender.Bot, timestamp: new Date() }]);

      const storedPersona = localStorage.getItem('app_persona');
      if (storedPersona) setCurrentPersona(JSON.parse(storedPersona));
      
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
          handleUpdateLook(currentPersona.visualPrompt);
      }
    };

    loadData();
    return () => { liveManagerRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleUpdateCoins = (newAmount: number) => {
      setDreamCoins(newAmount);
      localStorage.setItem('dream_coins', newAmount.toString());
  };

  // ... handleSendMessage ...
  const handleSendMessage = async (text: string) => {
    // CHECK FOR BROWSER COMMANDS
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

    const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.User, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    memoryService.addMemory(text);
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
          messages.slice(-10), 
          text,
          currentPersona,
          location,
          context,
          personalitySettings
      );
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: Sender.Bot,
        timestamp: new Date(),
        groundingMetadata: response.groundingMetadata,
        directionsUrl: response.directionsUrl
      };
      setMessages(prev => [...prev, botMsg]);
      
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
      
      // HANDLE WEB BROWSER TOOL EXPLICITLY
      if (tool.action === 'web_browser') {
          setBrowserState({ isOpen: true, url: input.startsWith('http') ? input : `https://www.google.com/search?q=${input}`, advice: '', isLoadingAdvice: true });
          return;
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
          // Updated to include live_vastu
          if (['vastu_scan', 'check_location', 'live_vastu'].includes(tool.action)) {
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
          else if (tool.action === 'earth') type = 'earth';
          else if (tool.action === 'music_video_gen') type = 'music_visual';
          else if (tool.action === 'generate_csv') type = 'spreadsheet';
          else if (['generate_report', 'generate_doc'].includes(tool.action)) type = 'document';
          else if (['blog_post', 'vastu_scan', 'ai_chef', 'vision_scan', 'live_vastu'].includes(tool.action)) type = 'blog';
          else if (tool.action === 'smart_measure') type = 'html'; // Render HUD HTML as standard HTML
          
          const botMsg: Message = {
              id: Date.now().toString(),
              text: result.text,
              sender: Sender.Bot,
              timestamp: new Date(),
              codeSnippet: result.code,
              contentType: type as any,
              attachmentUrl: result.imageUrl,
              earthLocation: result.earthLocation,
              groundingMetadata: result.groundingMetadata
          };
          setMessages(prev => [...prev, botMsg]);
      } catch (e) {
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "Tool execution failed.", sender: Sender.Bot, timestamp: new Date() }]);
      } finally { setIsProcessing(false); }
  };

  // --- UPDATED HANDLERS FOR AVATAR ---

  const handleUpdateLook = async (prompt: string) => {
      setAvatarState(prev => ({ ...prev, isLoading: true }));
      try {
          const fullPrompt = `${currentPersona.visualPrompt}, ${prompt}, high quality, 8k`;
          const base64Image = await generateAvatarImage(fullPrompt);
          await storageService.saveImage('current_avatar', base64Image);
          await storageService.clearImage('current_video');
          setAvatarState(prev => ({ ...prev, imageUrl: base64Image, videoUrl: null, isLoading: false }));
          
          // Inject into Chat
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: "I updated my look! How is it? ✨",
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

  const handleAnimateAvatar = async (style: string) => {
      if (!avatarState.imageUrl) return;
      setAvatarState(prev => ({ ...prev, isLoading: true }));
      try {
          const prompt = `animate this character, ${style} style, moving naturally, looking at camera, 720p, high quality`;
          const videoUrl = await generateAvatarVideo(avatarState.imageUrl, prompt);
          
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
              const base64data = reader.result as string;
               storageService.saveImage('current_video', base64data).then(() => {
                   setAvatarState(prev => ({ ...prev, videoUrl: base64data, isLoading: false }));
                   
                   // Inject Video into Chat
                   setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      text: "Check out my new moves! 🎬",
                      sender: Sender.Bot,
                      timestamp: new Date(),
                      videoUrl: base64data
                   }]);
               });
          }
      } catch (e) {
          console.error(e);
          setAvatarState(prev => ({ ...prev, isLoading: false }));
          alert("Animation failed.");
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

  // ... remaining handlers (call, camera, file, speech, cosmic) ...
  const handleCallToggle = async () => {
    if (isCallActive) {
        liveManagerRef.current?.disconnect();
        setIsCallActive(false);
    } else {
        setIsCallActive(true);
        let visualDesc = "";
        if (avatarState.userPhotoUrl) {
            visualDesc = "User provided a photo."; 
        }
        
        const recentHistory = messages.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
        
        let location = undefined;
        try {
            await new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => { location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; resolve(); },
                    () => resolve(), 
                    { timeout: 1000 }
                );
            });
        } catch(e) {}

        liveManagerRef.current?.connect(currentPersona, recentHistory, location, visualDesc);
    }
  };
  
  const handleCameraToggle = async () => {
      if (isCameraActive) {
          liveManagerRef.current?.stopVideo();
          setLocalVideoStream(null);
          setIsCameraActive(false);
      } else {
          try {
              const stream = await liveManagerRef.current?.startVideo();
              if (stream) {
                  setLocalVideoStream(stream);
                  setIsCameraActive(true);
              }
          } catch (e) {
              alert("Could not access camera.");
          }
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

  const handleSpeakMessage = async (text: string) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      try {
          const buffer = await generateSpeech(text, currentPersona.voiceName, audioContext);
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
      } catch (e) {
          console.error("TTS failed", e);
      }
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
    <div className="flex flex-col h-[100dvh] bg-gray-900 text-white overflow-hidden relative">
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

      <div className="relative z-10 h-full flex flex-col">
          {/* HEADER: NOW INCLUDES CALL BUTTON */}
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
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
                           <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                           <span className="text-xs text-white/70 shadow-black drop-shadow-sm">
                               {isCallActive ? 'Live Call Active' : 'Online (Free Mode)'}
                           </span>
                       </div>
                   </div>
               </div>

               {/* SEPARATE LIVE CALL BUTTON (PHONE ICON) */}
               <button 
                   onClick={handleCallToggle}
                   className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all border border-white/10 ${isCallActive ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-green-500 hover:bg-green-600'}`}
                   title={isCallActive ? "End Call" : "Start Live Call (Premium)"}
               >
                   {isCallActive ? (
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M15.22 6.268a.75.75 0 01.968-.432l5.942 2.28a.75.75 0 01.431.97l-2.28 5.941a.75.75 0 11-1.4-.537l1.63-4.252-4.253 1.63a.75.75 0 01-.97-.432l-2.28-5.942a.75.75 0 01.433-.969zM4.5 9.75a.75.75 0 00-.75.75V15c0 .414.336.75.75.75h4.5A.75.75 0 009.75 15V10.5a.75.75 0 00-.75-.75h-4.5z" clipRule="evenodd" /></svg>
                   ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>
                   )}
               </button>
          </div>

          <ChatInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            onMicClick={() => {}}
            isListening={false}
            isCallActive={isCallActive}
            onCallToggle={handleCallToggle}
            localVideoStream={localVideoStream}
            onCameraToggle={handleCameraToggle}
            isCameraActive={isCameraActive}
            onMagicClick={() => handleSendMessage("Surprise me with something amazing!")}
            onOpenStudio={() => setShowStudio(true)}
            onTypingChange={setIsUserTyping}
            onFeedback={(id, rating) => {
                 setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: rating } : m));
            }}
            onSpeakMessage={handleSpeakMessage}
            onStopAudio={() => {}}
            isTalking={audioLevel > 5}
            onFileUpload={handleFileUpload}
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
             if (liveManagerRef.current) liveManagerRef.current.setVoiceSettings(s);
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
    </div>
  );
};

export default App;
