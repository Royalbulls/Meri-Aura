
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Message, Sender, Persona, StudioTool, VoiceSettings } from './types';
import { DEFAULT_PERSONAS, CREATIVE_TOOLS } from './constants';
import { generateCreativeContent, generateSpeech } from './services/geminiService';
import { ChatInterface } from './components/ChatInterface';
import { AvatarDisplay } from './components/AvatarDisplay';
import { LiveManager } from './services/liveManager';
import { SystemDiagnostics } from './components/SystemDiagnostics';

// Dynamic App Imports
const CreativeStudioModal = React.lazy(() => import('./components/CreativeStudioModal').then(m => ({ default: m.CreativeStudioModal })));
const AuraNews = React.lazy(() => import('./components/AuraNews').then(m => ({ default: m.AuraNews })));
const AuraGenesis = React.lazy(() => import('./components/AuraGenesis').then(m => ({ default: m.AuraGenesis })));
const BrowserOverlay = React.lazy(() => import('./components/BrowserOverlay').then(m => ({ default: m.BrowserOverlay })));
const LiveScanner = React.lazy(() => import('./components/LiveScanner').then(m => ({ default: m.LiveScanner })));
const AuraConnect = React.lazy(() => import('./components/AuraConnect').then(m => ({ default: m.AuraConnect })));
const AuraPodcast = React.lazy(() => import('./components/AuraPodcast').then(m => ({ default: m.AuraPodcast })));

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
      { id: '1', text: "Aura Neural OS v3.0 Online. Bhai, hum fully optimized hain! Kya program hai aaj?", sender: Sender.Bot, timestamp: new Date() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedTool, setSelectedTool] = useState<StudioTool | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

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
    return () => liveManagerRef.current?.disconnect();
  }, []);

  const stopAudio = () => {
    if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
        currentSourceRef.current = null;
    }
    setAvatarState(prev => ({ ...prev, isTalking: false }));
    setAudioLevel(0);
    setCurrentlyPlayingId(null);
  };

  const handleSpeakMessage = async (text: string, messageId: string) => {
      if (currentlyPlayingId === messageId && avatarState.isTalking) { stopAudio(); return; }
      stopAudio();
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          setAvatarState(prev => ({ ...prev, isTalking: true }));
          setCurrentlyPlayingId(messageId);
          const buffer = await generateSpeech(text, 'Kore', audioContextRef.current);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          const analyzer = audioContextRef.current.createAnalyser();
          source.connect(analyzer);
          analyzer.connect(audioContextRef.current.destination);
          currentSourceRef.current = source;
          const updateLevel = () => {
              if (!currentSourceRef.current) return;
              const data = new Uint8Array(analyzer.frequencyBinCount);
              analyzer.getByteFrequencyData(data);
              setAudioLevel(data.reduce((a, b) => a + b) / data.length * 2);
              requestAnimationFrame(updateLevel);
          };
          updateLevel();
          source.onended = () => { setAvatarState(prev => ({ ...prev, isTalking: false })); setCurrentlyPlayingId(null); };
          source.start(0);
      } catch (e) { setAvatarState(prev => ({ ...prev, isTalking: false })); }
  };

  const handleSendMessage = async (text: string) => {
      const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.User, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsProcessing(true);
      try {
          const result = await generateCreativeContent('chat', text, DEFAULT_PERSONAS[0]);
          const botMsg: Message = { id: (Date.now() + 1).toString(), text: result.text, sender: Sender.Bot, timestamp: new Date(), codeSnippet: result.code, contentType: result.contentType as any, groundingMetadata: result.groundingMetadata };
          setMessages(prev => [...prev, botMsg]);
          if (!isLive && result.text.length < 200) handleSpeakMessage(result.text, botMsg.id);
      } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleExecuteTool = async (tool: StudioTool, input: string, image?: string) => {
    setActiveModal(null);
    setIsProcessing(true);
    const userMsg: Message = { id: Date.now().toString(), text: `[${tool.label}] ${input}`, sender: Sender.User, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    try {
        const result = await generateCreativeContent(tool.action, input, DEFAULT_PERSONAS[0], image);
        const botMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            text: result.text, 
            sender: Sender.Bot, 
            timestamp: new Date(), 
            codeSnippet: result.code, 
            contentType: result.contentType as any,
            groundingMetadata: result.groundingMetadata 
        };
        setMessages(prev => [...prev, botMsg]);
        if (!isLive && result.text.length < 400) handleSpeakMessage(result.text, botMsg.id);
    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  if (isBooting) return <SystemDiagnostics onClose={() => setIsBooting(false)} />;

  return (
    <div className="h-full w-full bg-[#020205] text-white overflow-hidden relative font-sans select-none">
        
        {/* --- DYNAMIC BACKGROUND & AVATAR --- */}
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
            <AvatarDisplay 
                avatarState={{...avatarState, isTalking: isLive || avatarState.isTalking}} 
                audioLevel={audioLevel} 
                isThinking={isProcessing} 
                isListening={isLive} 
                onInteraction={(part) => {
                    if (part === 'head') handleSendMessage("Bhai, gudgudi ho rahi hai! Haha.");
                    if (part === 'belly') handleSendMessage("Oye, bhook lagi hai kya?");
                }} 
            />
        </div>

        {/* --- GLOBAL APP SHORTCUTS (Sidebar/Top) --- */}
        <div className="absolute top-[var(--sat)] left-4 md:left-8 z-[100] flex md:flex-col gap-4 py-6 pointer-events-none">
            {[
                { id: 'studio', icon: '🎨', label: 'Studio' },
                { id: 'genesis', icon: '🚀', label: 'Genesis' },
                { id: 'scanner', icon: '👁️', label: 'Vision' },
                { id: 'news', icon: '📰', label: 'News' },
            ].map(app => (
                <button 
                    key={app.id} 
                    onClick={() => setActiveModal(app.id)}
                    className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex flex-col items-center justify-center group hover:bg-white/20 hover:border-white/30 hover:-translate-y-1 md:hover:translate-x-2 transition-all shadow-2xl active:scale-90"
                >
                    <span className="text-xl md:text-2xl">{app.icon}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-white/40 group-hover:text-white">{app.label}</span>
                </button>
            ))}
        </div>

        {/* --- CHAT HUB (SNAPPABLE WINDOW) --- */}
        <div className={`fixed z-[400] transition-all duration-500 ease-in-out flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden 
            ${isChatMinimized 
                ? 'bottom-24 right-4 w-16 h-16 rounded-full bg-blue-600 justify-center items-center cursor-pointer' 
                : 'bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[450px] h-[55vh] md:h-[75vh] rounded-[3rem] bg-black/40 backdrop-blur-3xl'
            }`}
            onClick={() => isChatMinimized && setIsChatMinimized(false)}
        >
            {isChatMinimized ? (
                <div className="flex items-center justify-center text-2xl animate-pulse">💬</div>
            ) : (
                <>
                    <div className="h-14 px-8 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Neural Link: Active</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setIsChatMinimized(true); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <span className="text-white/40 text-[10px]">➖</span>
                            </button>
                        </div>
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
                            onOpenNews={() => setActiveModal('news')}
                        />
                    </div>
                </>
            )}
        </div>

        {/* --- SYSTEM TASKBAR (FOOTER) --- */}
        <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 z-[500] flex items-center justify-between px-6 md:px-12 safe-pb">
            
            {/* Start / Launcher Button */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsLauncherOpen(!isLauncherOpen)}
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-all shadow-2xl relative group ${isLauncherOpen ? 'bg-blue-600 rotate-90' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-110 active:scale-90'}`}
                >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 animate-pulse"></div>
                    🌀
                </button>
                <div className="hidden sm:flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">System Status</span>
                    <span className="text-xs font-bold text-white/80">All Protocols Optimized</span>
                </div>
            </div>

            {/* Quick Toggle Area */}
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar max-w-[40%] px-4">
                {[
                    { id: 'connect', icon: '🤝', label: 'CRM' },
                    { id: 'podcast', icon: '🎙️', label: 'Podcast' },
                    { id: 'browser', icon: '🌐', label: 'Web' }
                ].map(item => (
                    <button 
                        key={item.id} onClick={() => setActiveModal(item.id)}
                        className={`h-10 md:h-12 px-4 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${activeModal === item.id ? 'bg-white/10 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Time / Settings Area */}
            <div className="flex items-center gap-6 pl-6 border-l border-white/10">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-black tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[8px] font-black uppercase text-white/20">Aura Neural v3</span>
                </div>
                <button onClick={() => setActiveModal('settings')} className="text-xl opacity-30 hover:opacity-100 hover:rotate-90 transition-all">⚙️</button>
            </div>
        </div>

        {/* --- APP LAUNCHER PANEL --- */}
        <div className={`fixed bottom-24 left-4 right-4 md:left-8 md:right-auto z-[600] md:w-[600px] bg-[#0a0a0c]/98 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 transition-all duration-500 shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden ${isLauncherOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-40 opacity-0 scale-95 pointer-events-none'}`}>
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-blue-500">Aura Tool Ecosystem</h3>
                <span className="text-[10px] text-white/30 font-bold uppercase">42 Experts Online</span>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-8 h-[45vh] md:h-[450px] overflow-y-auto -webkit-overflow-scrolling-touch custom-scrollbar pr-4">
                {CREATIVE_TOOLS.map(tool => (
                    <button 
                        key={tool.id} 
                        onClick={() => { setActiveModal('studio'); setSelectedTool(tool); setIsLauncherOpen(false); }}
                        className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group active:scale-95"
                    >
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-white/10 transition-all shadow-xl">
                            {tool.icon}
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-black uppercase tracking-tight text-white/80 leading-none">{tool.label}</div>
                            <div className="text-[7px] text-white/20 uppercase mt-1.5 font-black">{tool.category}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* --- MODAL ENGINE (LAZY LOADED) --- */}
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 z-[1000] backdrop-blur-md" />}>
            {activeModal === 'studio' && <CreativeStudioModal isOpen={true} onClose={() => setActiveModal(null)} selectedTool={selectedTool} onSelectTool={setSelectedTool} onExecute={handleExecuteTool} />}
            {activeModal === 'news' && <AuraNews isOpen={true} onClose={() => setActiveModal(null)} currentPersona={DEFAULT_PERSONAS[0]} />}
            {activeModal === 'genesis' && <AuraGenesis isOpen={true} onClose={() => setActiveModal(null)} onAddMessage={(m) => setMessages(p => [...p, m])} />}
            {activeModal === 'browser' && <BrowserOverlay isOpen={true} initialUrl="https://google.com" onClose={() => setActiveModal(null)} />}
            {activeModal === 'scanner' && <LiveScanner isOpen={true} onClose={() => setActiveModal(null)} currentPersona={DEFAULT_PERSONAS[0]} />}
            {activeModal === 'connect' && <AuraConnect isOpen={true} onClose={() => setActiveModal(null)} currentPersona={DEFAULT_PERSONAS[0]} />}
            {activeModal === 'podcast' && <AuraPodcast isOpen={true} onClose={() => setActiveModal(null)} />}
        </Suspense>

        {/* Overlay Backdrop for Launcher */}
        {isLauncherOpen && <div className="fixed inset-0 z-[550] bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsLauncherOpen(false)}></div>}

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
    </div>
  );
};

export default App;
