
import React, { useState, useEffect } from 'react';
import { Message, Sender, StudioTool, Persona } from './types';
import { INITIAL_GREETING, DEFAULT_PERSONAS } from './constants';
import { generateCreativeContent } from './services/geminiService';

// Module Imports
import { ChatInterface } from './components/ChatInterface';
import { CreativeStudioModal } from './components/CreativeStudioModal';
import { BrowserOverlay } from './components/BrowserOverlay';
import { AuraGenesis } from './components/AuraGenesis';
import { AuraConnect } from './components/AuraConnect';
import { AuraNews } from './components/AuraNews';
import { AuraPodcast } from './components/AuraPodcast';
import { KidsModeModal } from './components/KidsModeModal';
import { LiveScanner } from './components/LiveScanner';
import { CustomizationModal } from './components/CustomizationModal';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { AvatarDisplay } from './components/AvatarDisplay';
import { EnterpriseHub } from './components/EnterpriseHub';

type OSView = 'home' | 'assistant' | 'news' | 'connect' | 'genesis' | 'podcast' | 'studio' | 'kids' | 'scanner' | 'browser' | 'enterprise';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<OSView>('home');
  const [messages, setMessages] = useState<Message[]>([
      { id: '1', text: INITIAL_GREETING, sender: Sender.Bot, timestamp: new Date() }
  ]);
  const [currentPersona, setCurrentPersona] = useState<Persona>(DEFAULT_PERSONAS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<StudioTool | null>(null);
  const [dreamCoins, setDreamCoins] = useState(10000); // Enterprise Elite Balance

  // System States
  const [showCustomization, setShowCustomization] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [avatarState, setAvatarState] = useState({
      imageUrl: null as string | null,
      videoUrl: null as string | null,
      isLoading: false,
      isTalking: false,
      userPhotoUrl: null as string | null
  });

  const handleSendMessage = async (text: string) => {
      const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.User, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsProcessing(true);
      try {
          const result = await generateCreativeContent('chat', text, currentPersona);
          const botMsg: Message = { id: Date.now().toString(), text: result.text, sender: Sender.Bot, timestamp: new Date() };
          setMessages(prev => [...prev, botMsg]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'assistant', icon: '💬', label: 'Aura' },
    { id: 'enterprise', icon: '🏢', label: 'Empire' },
    { id: 'studio', icon: '🎨', label: 'Studio' },
    { id: 'genesis', icon: '🧞‍♂️', label: 'Build' }
  ];

  return (
    <div className="flex h-[100dvh] w-screen bg-[#020202] text-white overflow-hidden relative font-sans">
        
        {/* GLOBAL BACKGROUND CHARACTER (Talking Tom Persona) */}
        <div 
            onClick={() => console.log("Aura Friend Mode Active")}
            className={`absolute inset-0 z-0 transition-all duration-1000 ease-in-out cursor-pointer ${['home', 'assistant'].includes(currentView) ? 'opacity-100 scale-100' : 'opacity-10 scale-110 blur-3xl pointer-events-none'}`}
        >
            <AvatarDisplay avatarState={avatarState} audioLevel={0} isThinking={isProcessing} />
        </div>

        {/* OS VIEWPORT */}
        <div className="relative z-10 w-full h-full flex flex-col">
            
            {/* TOP SYSTEM BAR */}
            <div className="h-14 px-6 flex justify-between items-center bg-black/60 backdrop-blur-3xl border-b border-white/5 shrink-0">
                <div className="flex items-center gap-6">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.5em] text-blue-500 uppercase leading-none mb-1">Aura Enterprise OS</span>
                        <span className="text-xs font-bold text-white/80">Krishna Vishwakarma • Founder</span>
                     </div>
                     <div className="h-6 w-px bg-white/10"></div>
                     <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        <span className="text-xs">💰</span>
                        <span className="text-xs font-black text-blue-400">{dreamCoins.toLocaleString()} CREDITS</span>
                     </div>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => setShowDiagnostics(true)} className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/40 hover:text-white">⚙️</button>
                    <div className="text-xs font-mono text-white/60 tabular-nums">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* ACTIVE APP SPACE */}
            <div className="flex-1 relative overflow-hidden">
                {currentView === 'home' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-700">
                        <div className="text-center mb-24 space-y-2">
                            <h1 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30 drop-shadow-2xl">Royal Bulls</h1>
                            <p className="text-xs text-blue-400 font-bold uppercase tracking-[1em] ml-2">Neural Solution Architecture</p>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-14 max-w-6xl w-full px-12">
                            {navItems.filter(i => i.id !== 'home').map(app => (
                                <button 
                                    key={app.id} 
                                    onClick={() => setCurrentView(app.id as any)} 
                                    className="group flex flex-col items-center gap-6 transition-all hover:scale-110 active:scale-90"
                                >
                                    <div className="w-24 h-24 md:w-28 md:h-28 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center justify-center text-4xl shadow-2xl group-hover:bg-blue-600 group-hover:text-black transition-all duration-300 relative overflow-hidden ring-offset-8 ring-offset-black hover:ring-2 ring-blue-500/50">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                                        {app.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white">{app.label}</span>
                                </button>
                            ))}
                            <button onClick={() => setCurrentView('browser')} className="group flex flex-col items-center gap-6 transition-all hover:scale-110">
                                <div className="w-24 h-24 md:w-28 md:h-28 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center justify-center text-4xl shadow-2xl group-hover:bg-blue-600 group-hover:text-black transition-all">🌐</div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white">Web OS</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setShowCustomization(true)}
                            className="mt-24 px-12 py-5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.5em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_30px_60px_rgba(255,255,255,0.05)] active:scale-95"
                        >
                            ⚙️ Personalize Global Persona
                        </button>
                    </div>
                )}

                {currentView === 'assistant' && (
                    <div className="h-full w-full pointer-events-none">
                        <ChatInterface 
                            messages={messages} onSendMessage={handleSendMessage} isProcessing={isProcessing} 
                            onMicClick={() => setCurrentView('scanner')} isListening={false} onOpenStudio={() => setCurrentView('studio')} 
                            onSpeakMessage={() => {}} onDownloadAudio={() => {}} onStopAudio={() => {}} isTalking={false} 
                            onFileUpload={() => {}} onBrowserClick={() => setCurrentView('browser')} onGenesisClick={() => setCurrentView('genesis')}
                        />
                    </div>
                )}

                {currentView === 'enterprise' && <EnterpriseHub isOpen={true} onClose={() => setCurrentView('home')} currentPersona={currentPersona} />}
                {currentView === 'news' && <AuraNews isOpen={true} onClose={() => setCurrentView('home')} currentPersona={currentPersona} />}
                {currentView === 'studio' && <CreativeStudioModal isOpen={true} onClose={() => setCurrentView('home')} selectedTool={selectedTool} onSelectTool={setSelectedTool} onExecute={() => {}} />}
                {currentView === 'genesis' && <AuraGenesis isOpen={true} onClose={() => setCurrentView('home')} onAddMessage={(m) => setMessages(prev => [...prev, m])} />}
                {currentView === 'browser' && <BrowserOverlay isOpen={true} onClose={() => setCurrentView('home')} initialUrl="" />}
                {currentView === 'scanner' && <LiveScanner isOpen={true} onClose={() => setCurrentView('home')} currentPersona={currentPersona} />}
            </div>

            {/* DOCK NAVIGATION */}
            <div className="h-24 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex justify-center items-center gap-10 shrink-0 pb-safe z-50">
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl ring-1 ring-white/5">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setCurrentView(item.id as any)}
                            className={`flex flex-col items-center gap-1 px-6 py-3 rounded-3xl transition-all relative group ${
                                currentView === item.id 
                                ? 'bg-white/10 text-blue-400 scale-110' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="text-2xl transition-transform group-hover:-translate-y-1">{item.icon}</span>
                            {currentView === item.id && (
                                <span className="text-[8px] font-black uppercase tracking-tighter">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* MODALS */}
        {showDiagnostics && <SystemDiagnostics onClose={() => setShowDiagnostics(false)} />}
        {showCustomization && (
            <CustomizationModal 
                isOpen={true} onClose={() => setShowCustomization(false)} currentPersona={currentPersona} 
                availablePersonas={DEFAULT_PERSONAS} onSelectPersona={setCurrentPersona} onUpdateLook={() => {}} 
                onAnimateAvatar={() => {}} onDownloadAvatar={() => {}} onDownloadHistory={() => {}} 
                voiceSettings={{speed: 1, pitch: 0}} onUpdateVoiceSettings={() => {}} isLoading={false} 
                onUploadUserPhoto={() => {}} onGenerateCollab={() => {}} personalitySettings={{playfulness: 50, empathy: 50, directness: 50}} 
                onUpdatePersonalitySettings={() => {}} hasImage={false} hasVideo={false} 
            />
        )}
    </div>
  );
};

export default App;
