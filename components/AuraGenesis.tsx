
import React, { useState, useEffect, useRef } from 'react';
import { GenesisStep, NeuralContext } from '../types';
import { planGenesis, executeGenesisStep } from '../services/geminiService';

interface AuraGenesisProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMessage: (msg: any) => void;
}

const AGENTS = [
    { id: 'strategy', label: 'Architect AI', icon: '📐', color: 'text-blue-400' },
    { id: 'dev', label: 'Engineer AI', icon: '🛠️', color: 'text-emerald-400' },
    { id: 'design', label: 'Creative AI', icon: '🎨', color: 'text-pink-400' },
    { id: 'marketing', label: 'Viral AI', icon: '🔥', color: 'text-orange-400' },
    { id: 'legal', label: 'Compliance AI', icon: '⚖️', color: 'text-purple-400' }
];

const GENESIS_IDEAS = [
    { 
        label: "📱 Build Mobile App Prototype", 
        prompt: "ACT AS THE LEAD ENGINEER. Build a fully functional UI prototype for a [Your Idea] app. Generate code for: 1. Onboarding Screen. 2. Main Dashboard. 3. User Profile. 4. Settings & Logic. 5. Viral Launch Strategy." 
    },
    {
        label: "🏢 Launch Business Empire",
        prompt: "ACT AS THE CEO. Transform the idea of [Niche] into a full business. Create: 1. Executive Vision. 2. Business Model & ROI. 3. Brand Identity Layout. 4. Operational Roadmap. 5. Legal & Funding Strategy."
    },
    { 
        label: "🎬 Create Content Universe", 
        prompt: "ACT AS THE SHOWRUNNER. Build a viral brand for [Niche]. Tasks: 1. Niche Hook Database. 2. Video Scripting Protocol. 3. Visual Aesthetic Guide. 4. Monetization Plan. 5. Automation Workflow." 
    },
    { 
        label: "🎸 Compose Musical Brand", 
        prompt: "ACT AS THE PRODUCER. Build a career for a musical artist in [Style]. Tasks: 1. Artist Persona. 2. Debut Song Concept & Lyrics. 3. Visual Music Video Storyboard. 4. Digital Distribution Plan. 5. Live Tour Strategy." 
    }
];

export const AuraGenesis: React.FC<AuraGenesisProps> = ({ isOpen, onClose, onAddMessage }) => {
    const [wish, setWish] = useState("");
    const [isWishing, setIsWishing] = useState(false);
    const [steps, setSteps] = useState<GenesisStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isExecuting, setIsExecuting] = useState(false);
    const [previewContent, setPreviewContent] = useState<any>(null);
    const [showContext, setShowContext] = useState(false);
    const [neuralLoad, setNeuralLoad] = useState(0);
    
    // NEURAL CONTEXT STATE
    const [neuralContext, setNeuralContext] = useState<NeuralContext>({
        userIdentity: "Chief Admin",
        businessProfile: "Aura OS Enterprise - Global Innovation Hub",
        brandVoice: "Futuristic, Loyal, High-Tech, Friendly Hinglish",
        antiPatterns: "Avoid generic advice. Provide specific, executable artifacts and high-quality code."
    });
    
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Neural Load Simulation
    useEffect(() => {
        let interval: any;
        if (isExecuting) {
            interval = setInterval(() => {
                setNeuralLoad(prev => Math.floor(Math.random() * 30) + 60); 
            }, 800);
        } else {
            setNeuralLoad(prev => Math.max(5, prev - 5)); 
        }
        return () => clearInterval(interval);
    }, [isExecuting]);

    // Main Execution Loop
    useEffect(() => {
        const runNext = async () => {
            if (!isExecuting || currentStepIndex >= steps.length) {
                if (currentStepIndex >= steps.length && steps.length > 0) {
                    setIsExecuting(false);
                    onAddMessage({
                        id: Date.now().toString(),
                        text: "✅ Chief Admin, Operation Genesis is complete! Aapka masterpiece ready hai. 🚀",
                        sender: 'bot',
                        timestamp: new Date(),
                        contentType: 'genesis_result',
                        genesisSteps: steps
                    });
                }
                return;
            }

            const step = steps[currentStepIndex];
            const priorContext = steps
                .slice(0, currentStepIndex)
                .filter(s => s.status === 'completed')
                .map(s => `[Step: ${s.label} Output]: ${s.result ? s.result.substring(0, 300) + "..." : "Completed"}`)
                .join("\n\n");

            setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'processing' } : s));

            try {
                const resultStep = await executeGenesisStep(step, wish, priorContext, neuralContext);
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? resultStep : s));
                setPreviewContent({ type: resultStep.type, result: resultStep.result, label: resultStep.label });
                setCurrentStepIndex(prev => prev + 1);
            } catch (e) {
                console.error("Genesis Engine Error:", e);
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'failed' } : s));
                setIsExecuting(false);
            }
        };

        if (isExecuting) runNext();
    }, [isExecuting, currentStepIndex]);

    const handleStartGenesis = async (customWish?: string) => {
        const wishText = customWish || wish;
        if (!wishText.trim()) return;
        setIsWishing(true);
        setSteps([]);
        setCurrentStepIndex(-1);
        setPreviewContent(null);
        if(customWish) setWish(customWish);

        try {
            const plannedSteps = await planGenesis(wishText, neuralContext);
            setSteps(plannedSteps);
            if (plannedSteps.length > 0) {
                setCurrentStepIndex(0);
                setIsExecuting(true);
            }
        } catch (e) {
            alert("Bhai, Neural Link fail ho gaya. Internet check karo?");
        } finally {
            setIsWishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col font-mono text-white animate-in fade-in duration-500 overflow-hidden">
            
            {/* TOP SYSTEM HUD */}
            <div className="h-16 px-6 border-b border-white/10 flex justify-between items-center bg-black/80 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black tracking-[0.2em] text-blue-400 uppercase">Genesis Builder OS</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/30 uppercase font-bold">Chief Admin Access Validated</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    
                    {/* NEURAL MONITOR */}
                    <div className="hidden md:flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        <span className="text-[8px] font-black text-white/40 uppercase">Processing Power</span>
                        <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${neuralLoad > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`} 
                                style={{ width: `${neuralLoad}%` }}
                            ></div>
                        </div>
                        <span className={`text-[9px] font-bold tabular-nums ${neuralLoad > 80 ? 'text-red-400' : 'text-blue-400'}`}>{neuralLoad}%</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowContext(!showContext)} className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all ${showContext ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>🧠 Context</button>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 transition-all text-white/30 hover:text-white">✕</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* AGENT DISPATCH SIDEBAR */}
                <div className="w-20 lg:w-72 border-r border-white/10 bg-[#050505] flex flex-col p-4 gap-6 shrink-0 z-40 overflow-y-auto no-scrollbar">
                    
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Workforce Units</label>
                        <div className="grid gap-2">
                            {AGENTS.map(agent => (
                                <div key={agent.id} className={`p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden group ${isExecuting ? 'bg-white/5 border-white/10 shadow-lg' : 'opacity-20 border-transparent grayscale'}`}>
                                    {isExecuting && currentStepIndex >= 0 && (
                                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                                    )}
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{agent.icon}</span>
                                        <div className="hidden lg:block">
                                            <div className={`text-[10px] font-black uppercase tracking-tighter ${agent.color}`}>{agent.label}</div>
                                            <div className="text-[8px] text-white/40 font-bold uppercase truncate">Protocol: Active</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    {steps.length > 0 && (
                        <div className="mt-4 space-y-4">
                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Task Flow</label>
                            <div className="space-y-3 px-2">
                                {steps.map((s, i) => (
                                    <div key={s.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-3 h-3 rounded-full border-2 transition-all ${s.status === 'completed' ? 'bg-green-500 border-green-500 shadow-[0_0_10px_#22c55e]' : s.status === 'processing' ? 'bg-blue-500 border-blue-500 animate-pulse' : 'border-white/10'}`}></div>
                                            {i < steps.length - 1 && <div className="w-[1px] h-6 bg-white/5"></div>}
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase tracking-tight truncate ${s.status === 'processing' ? 'text-blue-400' : 'text-white/30 group-hover:text-white'}`}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* WORKSPACE AREA */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.05)_0%,_transparent_50%)]">
                    
                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                        {!steps.length ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-16">
                                <div className="space-y-4">
                                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">BUILD ANY <br/> MASTERPIECE</h1>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[1em] opacity-80">Universal Construction Engine Active</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full px-6">
                                    {GENESIS_IDEAS.map((idea, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleStartGenesis(idea.prompt)}
                                            className="p-8 bg-white/5 border border-white/10 rounded-[2rem] text-left hover:bg-blue-600 hover:text-white transition-all group relative overflow-hidden shadow-2xl active:scale-95"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="text-3xl mb-6 group-hover:rotate-6 transition-transform">{idea.label.split(' ')[0]}</div>
                                            <div className="font-black text-xs uppercase tracking-[0.1em] leading-relaxed opacity-60 group-hover:opacity-100">{idea.label.split(' ').slice(1).join(' ')}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-12 duration-1000 pb-32">
                                {previewContent ? (
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] backdrop-blur-3xl min-h-[600px] flex flex-col">
                                        <div className="h-14 border-b border-white/5 flex justify-between items-center px-8 bg-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{previewContent.type} Artifact: {previewContent.label}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => navigator.clipboard.writeText(previewContent.result)} className="text-[9px] font-black text-white/40 hover:text-white uppercase transition-all">📋 Copy Artifact</button>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar relative">
                                            {previewContent.type === 'code' ? (
                                                <div className="w-full h-full min-h-[500px] rounded-3xl overflow-hidden bg-white border-8 border-white shadow-2xl">
                                                    <iframe 
                                                        ref={iframeRef}
                                                        srcDoc={previewContent.result}
                                                        className="w-full h-full border-none"
                                                        title="Materialization Preview"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert prose-blue max-w-none prose-p:text-lg prose-p:leading-relaxed prose-headings:font-black prose-headings:tracking-tighter">
                                                    <div className="bg-white/5 p-8 rounded-3xl border border-white/5 leading-loose text-white/80" dangerouslySetInnerHTML={{ __html: previewContent.result }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-96 flex flex-col items-center justify-center gap-8 opacity-40">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🧩</div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.8em] animate-pulse text-blue-400">Initializing Build Shards...</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* TERMINAL INPUT */}
                    <div className="h-24 px-6 md:px-12 border-t border-white/10 bg-black/80 backdrop-blur-3xl flex items-center gap-6 shrink-0 z-50">
                        <div className="flex-1 relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 text-2xl group-focus-within:animate-bounce">🔮</div>
                            <input 
                                type="text"
                                value={wish}
                                onChange={(e) => setWish(e.target.value)}
                                placeholder="Bhai, kya banana hai aaj? (e.g. Build an AI travel planner for Chief Admin)"
                                className="w-full h-16 bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-6 text-white text-base font-bold focus:outline-none focus:border-blue-500 transition-all placeholder-white/20"
                                onKeyDown={(e) => e.key === 'Enter' && handleStartGenesis()}
                            />
                        </div>
                        <button 
                            onClick={() => handleStartGenesis()}
                            disabled={!wish.trim() || isWishing || isExecuting}
                            className="h-16 px-10 bg-white text-black hover:bg-blue-600 hover:text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95"
                        >
                            {isWishing || isExecuting ? <div className="w-4 h-4 border-4 border-t-black border-white/20 rounded-full animate-spin"></div> : <span>MATERIALIZE</span>}
                        </button>
                    </div>
                </div>
            </div>
            
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 4px; }
            `}</style>
        </div>
    );
};
