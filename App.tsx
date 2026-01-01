
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Message, Sender, Persona, StudioTool, VoiceSettings, AvatarLayout, PersonalitySettings } from './types';
import { DEFAULT_PERSONAS, CREATIVE_TOOLS } from './constants';
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
const AuraGenesis = React.lazy(() => import('./components/AuraGenesis').then(m => ({ default: m.AuraGenesis })));
const BrowserOverlay = React.lazy(() => import('./components/BrowserOverlay').then(m => ({ default: m.BrowserOverlay })));
const LiveScanner = React.lazy(() => import('./components/LiveScanner').then(m => ({ default: m.LiveScanner })));
const AuraConnect = React.lazy(() => import('./components/AuraConnect').then(m => ({ default: m.AuraConnect })));
const AuraPodcast = React.lazy(() => import('./components/AuraPodcast').then(m => ({ default: m.AuraPodcast })));
const CustomizationModal = React.lazy(() => import('./components/CustomizationModal').then(m => ({ default: m.CustomizationModal })));
const NeuralLaunchpad = React.lazy(() => import('./components/NeuralLaunchpad').then(m => ({ default: m.NeuralLaunchpad })));
const AuraMusicLab = React.lazy(() => import('./components/AuraMusicLab').then(m => ({ default: m.AuraMusicLab })));

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
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
        else setMessages([{ id: '1', text: "Oye Chief Admin! Aura Neural OS v4.0 is here. ✨", sender: Sender.Bot, timestamp: new Date() }]);

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

  const handleUpdateAvatarAppearance = async (prompt: string) => {
    setAvatarState(prev => ({ ...prev, isLoading: true }));
    setIsProcessing(true);
    try {
        const result = await generateCreativeContent('avatar_maker', `MATERIALIZE LOOK: ${prompt}. Character: ${currentPersona.name}. Style: Disney-Pixar 3D. Expressive, colorful, high quality.`, currentPersona);
        if (result.imageUrl) {
            setAvatarState(prev => ({ ...prev, imageUrl: result.imageUrl! }));
            await storageService.saveImage('current_avatar', result.imageUrl!);
        }
        const botMsg: Message = { id: Date.now().toString(), text: "Bhai, look change ho gaya! Kaisa lag raha hu? ✨", sender: Sender.Bot, timestamp: new Date() };
        persistMessages([...messages, botMsg]);
    } catch (e) {
        console.error(e);
    } finally {
        setAvatarState(prev => ({ ...prev, isLoading: false }));
        setIsProcessing(false);
    }
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
          source.detune.value = voiceSettings.pitch * 100;
          const analyzer = audioContextRef.current.createAnalyser();
          source.connect(analyzer);
          analyzer.connect(audioContextRef.current.destination);
          currentSourceRef.current = source;
          source.onended = () => { setAvatarState(prev => ({ ...prev, isTalking: false })); setCurrentlyPlayingId(null); };
          source.start(0);
      } catch (e) { setAvatarState(prev => ({ ...prev, isTalking: false })); }
  };

  const stopAudio = () => {
    if (currentSourceRef.current) try { currentSourceRef.current.stop(); } catch(e) {}
    currentSourceRef.current = null;
    setAvatarState(prev => ({ ...prev, isTalking: false }));
    setAudioLevel(0);
    setCurrentlyPlayingId(null);
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
      const updated = messages.map(m => m.id === messageId ? { ...m, feedback: type } : m);
      persistMessages(updated);
  };

  const openApp = (appId: string) => {
      setActiveModal(appId);
      setIsLauncherOpen(false);
  };

  const handleResetMemory = async () => {
      if (window.confirm("Bhai, are you sure? Sab kuch delete ho jayega!")) {
          localStorage.clear();
          await memoryService.clearMemory();
          window.location.reload();
      }
  };

  if (isBooting) return <SystemDiagnostics onClose={() => setIsBooting(false)} />;

  return (
    <div className="h-full w-full bg-[#020205] text-white overflow-hidden relative font-sans select-none">
        
        {/* --- FLOATING AUDIO PLAYER (POPUP) --- */}
        {currentlyPlayingId && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-sm bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-4 flex items-center justify-between shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center animate-pulse shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5a3 3 0 00-3 3v4.88a3 3 0 003 3h2.19l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.563 2.683a.75.75 0 01.428 1.032 11.25 11.25 0 010 8.57a.75.75 0 01-1.032.428.75.75 0 01-.428-1.032 9.75 9.75 0 000-7.43.75.75 0 011.032-.428z" /></svg>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-pink-500">Vocal Transmission</div>
                        <div className="text-[11px] font-bold text-white/80">Aura is speaking...</div>
                    </div>
                </div>
                <button 
                    onClick={stopAudio} 
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 active:scale-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
                </button>
            </div>
        )}

        {/* --- AVATAR DISPLAY --- */}
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
            <AvatarDisplay 
                avatarState={{...avatarState, isTalking: isLive || avatarState.isTalking}} 
                audioLevel={audioLevel} 
                isThinking={isProcessing} 
                isListening={isLive} 
                layout={avatarLayout}
                onInteraction={(part) => {
                    if (part === 'head') handleSendMessage("Bhai, gudgudi ho rahi hai! Haha.");
                    if (part === 'belly') handleSendMessage("Oye, bhook lagi hai kya?");
                }} 
            />
        </div>

        {/* --- TOP LEFT SHORTCUTS --- */}
        <div className="absolute top-[var(--sat)] left-4 md:left-8 z-[100] flex md:flex-col gap-4 py-6 pointer-events-none">
            {[{ id: 'studio', icon: '🎨', label: 'Studio' }, { id: 'launchpad', icon: '🚀', label: 'Launch' }, { id: 'music', icon: '🎹', label: 'Music' }, { id: 'news', icon: '📰', label: 'News' }].map(app => (
                <button 
                    key={app.id} 
                    onClick={() => openApp(app.id)} 
                    className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-90 transition-all shadow-2xl"
                >
                    <span className="text-xl md:text-2xl">{app.icon}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-white/40">{app.label}</span>
                </button>
            ))}
        </div>

        {/* --- LAUNCHER OVERLAY --- */}
        {isLauncherOpen && (
            <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl animate-in fade-in duration-300 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 animate-in zoom-in-95 duration-300">
                    {[
                        { id: 'studio', icon: '🎨', label: 'Creative Studio', desc: 'Viral Content' },
                        { id: 'launchpad', icon: '🚀', label: 'Neural Launchpad', desc: 'App Store & Sandbox' },
                        { id: 'music', icon: '🎹', label: 'Music Lab', desc: 'Compose & Perform' },
                        { id: 'genesis', icon: '🛠️', label: 'Genesis Builder', desc: 'Materialize Apps' },
                        { id: 'scanner', icon: '👁️', label: 'Live Vision', desc: 'Scan Reality' },
                        { id: 'news', icon: '📰', label: 'Aura News', desc: 'Daily Gazette' },
                        { id: 'connect', icon: '🤝', label: 'Connect CRM', desc: 'Growth Hub' },
                        { id: 'settings', icon: '⚙️', label: 'Settings', desc: 'Customization' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => openApp(item.id)}
                            className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center text-center gap-4 hover:bg-white/20 hover:scale-105 transition-all group"
                        >
                            <span className="text-4xl md:text-5xl group-hover:rotate-12 transition-transform">{item.icon}</span>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-white">{item.label}</div>
                                <div className="text-[9px] text-white/40 font-bold uppercase mt-1">{item.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setIsLauncherOpen(false)}
                    className="absolute bottom-12 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:bg-white/20 transition-all border border-white/10"
                >✕</button>
            </div>
        )}

        {/* --- CHAT HUB --- */}
        <div className={`fixed z-[400] transition-all duration-500 flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden ${isChatMinimized ? 'bottom-24 right-4 w-16 h-16 rounded-full bg-blue-600 justify-center items-center cursor-pointer' : 'bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[480px] h-[60vh] md:h-[80vh] rounded-[3rem] bg-black/40 backdrop-blur-3xl'}`} onClick={() => isChatMinimized && setIsChatMinimized(false)}>
            {isChatMinimized ? <div className="text-2xl animate-pulse">💬</div> : (
                <>
                    <div className="h-14 px-8 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{currentPersona.name}: Online</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setIsChatMinimized(true); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">➖</button>
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
                            onFeedback={handleFeedback}
                        />
                    </div>
                </>
            )}
        </div>

        {/* --- TASKBAR --- */}
        <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 z-[500] flex items-center justify-between px-6 md:px-12 safe-pb">
            <button 
                onClick={() => setIsLauncherOpen(!isLauncherOpen)} 
                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-all shadow-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 ${isLauncherOpen ? 'rotate-90 scale-90' : 'hover:scale-110 active:scale-90'}`}
            >🌀</button>
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar max-w-[40%] px-4">
                {[{ id: 'genesis', icon: '🛠️', label: 'Build' }, { id: 'launchpad', icon: '🚀', label: 'Launch' }, { id: 'music', icon: '🎹', label: 'Studio' }].map(item => (
                    <button key={item.id} onClick={() => openApp(item.id)} className={`h-10 md:h-12 px-4 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${activeModal === item.id ? 'bg-white/10 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}>
                        <span className="text-lg">{item.icon}</span>
                        <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-6 pl-6 border-l border-white/10">
                <button onClick={() => openApp('settings')} className={`text-xl transition-all ${activeModal === 'settings' ? 'text-pink-500 scale-125' : 'opacity-30 hover:opacity-100 hover:rotate-90'}`}>⚙️</button>
            </div>
        </div>

        {/* --- MODAL ENGINE --- */}
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 z-[1000] backdrop-blur-md" />}>
            {activeModal === 'studio' && <CreativeStudioModal isOpen={true} onClose={() => setActiveModal(null)} selectedTool={selectedTool} onSelectTool={setSelectedTool} onExecute={(t, i, img) => { setActiveModal(null); handleSendMessage(`[${t.label}] ${i}`); }} />}
            {activeModal === 'launchpad' && <NeuralLaunchpad isOpen={true} onClose={() => setActiveModal(null)} />}
            {activeModal === 'news' && <AuraNews isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'genesis' && <AuraGenesis isOpen={true} onClose={() => setActiveModal(null)} onAddMessage={(m) => persistMessages([...messages, m])} onOpenLaunchpad={() => setActiveModal('launchpad')} />}
            {activeModal === 'browser' && <BrowserOverlay isOpen={true} initialUrl="https://google.com" onClose={() => setActiveModal(null)} />}
            {activeModal === 'scanner' && <LiveScanner isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'connect' && <AuraConnect isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'podcast' && <AuraPodcast isOpen={true} onClose={() => setActiveModal(null)} />}
            {activeModal === 'music' && <AuraMusicLab isOpen={true} onClose={() => setActiveModal(null)} currentPersona={currentPersona} />}
            {activeModal === 'settings' && (
                <CustomizationModal 
                    isOpen={true} onClose={() => setActiveModal(null)} 
                    currentPersona={currentPersona} availablePersonas={DEFAULT_PERSONAS} onSelectPersona={setCurrentPersona} 
                    onUpdateLook={handleUpdateAvatarAppearance} 
                    onAnimateAvatar={() => {}} onDownloadAvatar={() => {}} onDownloadHistory={() => {}} onResetMemory={handleResetMemory} 
                    voiceSettings={voiceSettings} onUpdateVoiceSettings={setVoiceSettings} 
                    personalitySettings={personalitySettings} onUpdatePersonalitySettings={setPersonalitySettings} 
                    avatarLayout={avatarLayout} onUpdateAvatarLayout={setAvatarLayout} 
                    isLoading={avatarState.isLoading} onUploadUserPhoto={() => {}} onGenerateCollab={() => {}} 
                    userPhotoUrl={avatarState.userPhotoUrl} hasImage={!!avatarState.imageUrl} hasVideo={!!avatarState.videoUrl} 
                />
            )}
        </Suspense>

        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>
    </div>
  );
};

export default App;
