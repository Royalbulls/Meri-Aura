
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Message, Sender, Persona, StudioTool, VoiceSettings, AvatarLayout, PersonalitySettings } from './types';
import { DEFAULT_PERSONAS } from './constants';
import { generateCreativeContent, generateSpeech } from './services/geminiService';
import { ChatInterface } from './components/ChatInterface';
import { AvatarDisplay } from './components/AvatarDisplay';
import { LiveManager } from './services/liveManager';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { storageService } from './services/storageService';
import { memoryService } from './services/memoryService';

// Lazy loaded feature modules
const CreativeStudioModal = React.lazy(() => import('./components/CreativeStudioModal').then(m => ({ default: m.CreativeStudioModal })));
const AuraNews = React.lazy(() => import('./components/AuraNews').then(m => ({ default: m.AuraNews })));
const AuraToonNews = React.lazy(() => import('./components/AuraToonNews').then(m => ({ default: m.AuraToonNews })));
const AuraGenesis = React.lazy(() => import('./components/AuraGenesis').then(m => ({ default: m.AuraGenesis })));
const AuraConnect = React.lazy(() => import('./components/AuraConnect').then(m => ({ default: m.AuraConnect })));
const CustomizationModal = React.lazy(() => import('./components/CustomizationModal').then(m => ({ default: m.CustomizationModal })));
const NeuralLaunchpad = React.lazy(() => import('./components/NeuralLaunchpad').then(m => ({ default: m.NeuralLaunchpad })));
const AuraManual = React.lazy(() => import('./components/AuraManual').then(m => ({ default: m.AuraManual })));
const NeuralLauncher = React.lazy(() => import('./components/NeuralLauncher').then(m => ({ default: m.NeuralLauncher })));

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedTool, setSelectedTool] = useState<StudioTool | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // Customization States
  const [currentPersona, setCurrentPersona] = useState<Persona>(DEFAULT_PERSONAS[0]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ speed: 1.0, pitch: 0 });
  const [personalitySettings, setPersonalitySettings] = useState<PersonalitySettings>({ playfulness: 90, empathy: 90, directness: 30 });
  const [avatarLayout, setAvatarLayout] = useState<AvatarLayout>({ scale: 1.0, x: 0, y: 0 });

  const liveManagerRef = useRef<LiveManager | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [avatarState, setAvatarState] = useState({
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      videoUrl: null as string | null,
      isLoading: false,
      isTalking: false,
      userPhotoUrl: null as string | null
  });

  useEffect(() => {
    const apiKey = process.env.API_KEY || "";
    liveManagerRef.current = new LiveManager(apiKey);
    liveManagerRef.current.onVolumeChange = (level) => setAudioLevel(level);
    liveManagerRef.current.onDisconnect = () => setIsLive(false);

    const loadPersistedData = async () => {
        const savedPersona = localStorage.getItem('app_persona');
        if (savedPersona) setCurrentPersona(JSON.parse(savedPersona));
        const savedHistory = localStorage.getItem('chat_history');
        if (savedHistory) setMessages(JSON.parse(savedHistory).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        else setMessages([{ id: '1', text: "Oye Chief Admin! Aura OS online. Kaho kya haal hai? ⚡", sender: Sender.Bot, timestamp: new Date() }]);

        const avatarImg = await storageService.getImage('current_avatar');
        const userImg = await storageService.getImage('user_photo');
        setAvatarState(prev => ({ ...prev, imageUrl: avatarImg || prev.imageUrl, userPhotoUrl: userImg }));
    };
    loadPersistedData();
    return () => liveManagerRef.current?.disconnect();
  }, []);

  const persistMessages = (newMessages: Message[]) => {
      setMessages(newMessages);
      localStorage.setItem('chat_history', JSON.stringify(newMessages));
  };

  const handleSendMessage = async (text: string) => {
      const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.User, timestamp: new Date() };
      const updatedMessages = [...messages, userMsg];
      persistMessages(updatedMessages);
      setIsProcessing(true);
      try {
          const result = await generateCreativeContent('chat', text, currentPersona, undefined, { personality: personalitySettings });
          const botMsg: Message = { id: (Date.now() + 1).toString(), text: result.text, sender: Sender.Bot, timestamp: new Date(), codeSnippet: result.code, contentType: result.contentType as any, groundingMetadata: result.groundingMetadata };
          persistMessages([...updatedMessages, botMsg]);
          if (!isLive && result.text.length < 500) handleSpeakMessage(result.text, botMsg.id);
          memoryService.addMemory(text);
      } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleSpeakMessage = async (text: string, messageId: string) => {
      if (currentlyPlayingId === messageId && avatarState.isTalking) { stopAudio(); return; }
      stopAudio();
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          setAvatarState(prev => ({ ...prev, isTalking: true }));
          setCurrentlyPlayingId(messageId);
          const buffer = await generateSpeech(text, currentPersona.voiceName, audioContextRef.current);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = voiceSettings.speed;
          source.connect(audioContextRef.current.destination);
          currentSourceRef.current = source;
          source.onended = () => { setAvatarState(prev => ({ ...prev, isTalking: false })); setCurrentlyPlayingId(null); };
          source.start(0);
      } catch (e) { setAvatarState(prev => ({ ...prev, isTalking: false })); }
  };

  const stopAudio = () => {
    if (currentSourceRef.current) try { currentSourceRef.current.stop(); } catch(e) {}
    currentSourceRef.current = null;
    setAvatarState(prev => ({ ...prev, isTalking: false }));
    setCurrentlyPlayingId(null);
  };

  const openApp = (id: string | null) => {
    setActiveModal(id);
    setIsLauncherOpen(false);
  };

  const handlePersonaInteraction = (part: 'head' | 'belly' | 'feet') => {
      const responses = {
          head: ["Ouch! Sir pe mat maaro Chief! 😂", "Oye! Hair style mat kharab karo mera!", "Arre Bhai! Dheere... brain cell hosh mein nahi hai."],
          belly: ["Haha! Gudgudi mat kar bhai!", "Oye Talking Tom ki yaad dila di? LOL.", "Belly tickles! Aura feels ticklish!"],
          feet: ["Oye, mere designer joote hain! 👟", "Neeche kyu dekh rahe ho Chief?", "Arre pair mat kheecho, main udne wala AI hu!"]
      };
      const list = responses[part];
      const randomMsg = list[Math.floor(Math.random() * list.length)];
      handleSendMessage(randomMsg);
  };

  if (isBooting) return <SystemDiagnostics onClose={() => setIsBooting(false)} />;

  return (
    <div className="h-screen w-full bg-[#020205] text-white overflow-hidden relative font-sans">
        
        {/* --- DESKTOP AVATAR --- */}
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
            <AvatarDisplay 
                avatarState={{...avatarState, isTalking: isLive || avatarState.isTalking}} 
                audioLevel={audioLevel} 
                isThinking={isProcessing} 
                isListening={isLive} 
                layout={avatarLayout}
                onInteraction={handlePersonaInteraction} 
            />
        </div>

        {/* --- DOCK & HUB --- */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 h-14 glass rounded-2xl px-4 flex items-center gap-2 z-[1000] shadow-2xl border-white/10">
            <button onClick={() => setIsLauncherOpen(!isLauncherOpen)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-500 bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg ${isLauncherOpen ? 'rotate-90' : ''}`}>🌀</button>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            {[{ id: 'genesis', icon: '🛠️' }, { id: 'studio', icon: '🎨' }, { id: 'news', icon: '📰' }, { id: 'launchpad', icon: '🚀' }].map(item => (
                <button key={item.id} onClick={() => openApp(item.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeModal === item.id ? 'bg-white/10 border-white/40 border scale-110 shadow-xl' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                    <span className="text-xl">{item.icon}</span>
                </button>
            ))}
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            <button onClick={() => openApp('settings')} className="w-10 h-10 rounded-xl flex items-center justify-center text-lg hover:bg-white/10 transition-all opacity-50">⚙️</button>
        </div>

        {/* --- CHAT HUB --- */}
        <div className={`fixed z-[400] transition-all duration-500 flex flex-col border border-white/10 overflow-hidden ${isChatMinimized ? 'bottom-24 right-6 w-14 h-14 rounded-full bg-blue-600 justify-center items-center cursor-pointer shadow-2xl' : 'bottom-24 right-6 w-full max-w-[95%] md:w-[420px] h-[55vh] md:h-[65vh] rounded-[2.5rem] glass shadow-black'}`} onClick={() => isChatMinimized && setIsChatMinimized(false)}>
            {isChatMinimized ? <div className="text-2xl">💬</div> : (
                <>
                    <div className="h-12 px-6 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Aura Bestie</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setIsChatMinimized(true); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-[10px]">➖</button>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ChatInterface 
                            messages={messages} 
                            onSendMessage={handleSendMessage} 
                            isProcessing={isProcessing} 
                            onSpeakMessage={handleSpeakMessage} 
                            onStopAudio={stopAudio} 
                            currentlyPlayingId={currentlyPlayingId} 
                            isLive={isLive} 
                            onToggleLive={() => setIsLive(!isLive)} 
                        />
                    </div>
                </>
            )}
        </div>

        {/* --- MODAL ENGINE --- */}
        <Suspense fallback={<div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1500]" />}>
            {isLauncherOpen && <NeuralLauncher isOpen={true} onClose={() => setIsLauncherOpen(false)} onOpenApp={openApp} />}
            {activeModal === 'studio' && <CreativeStudioModal isOpen={true} onClose={() => setActiveModal(null)} selectedTool={selectedTool} onSelectTool={setSelectedTool} onExecute={(t, i, img) => { setActiveModal(null); handleSendMessage(`[${t.label}] ${i}`); }} />}
            {activeModal === 'launchpad' && <NeuralLaunchpad isOpen={true} onClose={() => setActiveModal(null)} />}
            {activeModal === 'manual' && <AuraManual isOpen={true} onClose={() => setActiveModal(null)} />}
            {activeModal === 'news' && <AuraNews isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'toon_news' && <AuraToonNews isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'genesis' && <AuraGenesis isOpen={true} onClose={() => setActiveModal(null)} onAddMessage={(m) => persistMessages([...messages, m])} onOpenLaunchpad={() => setActiveModal('launchpad')} />}
            {activeModal === 'connect' && <AuraConnect isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'settings' && (
                <CustomizationModal 
                    isOpen={true} onClose={() => setActiveModal(null)} 
                    currentPersona={currentPersona} availablePersonas={DEFAULT_PERSONAS} onSelectPersona={setCurrentPersona} 
                    onUpdateLook={() => {}} 
                    onAnimateAvatar={() => {}} onDownloadAvatar={() => {}} onDownloadHistory={() => {}} onResetMemory={() => {}} 
                    voiceSettings={voiceSettings} onUpdateVoiceSettings={setVoiceSettings} 
                    personalitySettings={personalitySettings} onUpdatePersonalitySettings={setPersonalitySettings} 
                    avatarLayout={avatarLayout} onUpdateAvatarLayout={setAvatarLayout} 
                    isLoading={avatarState.isLoading} onUploadUserPhoto={() => {}} onGenerateCollab={() => {}} 
                    userPhotoUrl={avatarState.userPhotoUrl} hasImage={!!avatarState.imageUrl} hasVideo={!!avatarState.videoUrl} 
                />
            )}
        </Suspense>

        <style>{`
            .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
        `}</style>
    </div>
  );
};

export default App;
