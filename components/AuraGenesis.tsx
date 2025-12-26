
import React, { useState, useEffect, useRef } from 'react';
import { GenesisStep, NeuralContext } from '../types';
import { planGenesis, executeGenesisStep } from '../services/geminiService';

interface AuraGenesisProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMessage: (msg: any) => void;
}

interface GithubConfig {
    token: string;
    owner: string;
    repo: string;
    path: string;
}

const AGENTS = [
    { id: 'strategy', label: 'Strategy AI', icon: '🧠', color: 'text-blue-400' },
    { id: 'dev', label: 'Developer AI', icon: '💻', color: 'text-emerald-400' },
    { id: 'design', label: 'Design AI', icon: '🎨', color: 'text-pink-400' },
    { id: 'marketing', label: 'Growth AI', icon: '🚀', color: 'text-orange-400' },
    { id: 'legal', label: 'Legal AI', icon: '⚖️', color: 'text-purple-400' }
];

const GENESIS_IDEAS = [
    { 
        label: "🚀 Full Startup Launch", 
        prompt: "ACT AS THE FOUNDER. I want to launch a tech startup that solves [Problem]. Deploy agents for: 1. Strategic Roadmap. 2. UI/UX Prototypes (HTML). 3. Go-to-market viral strategy. 4. Privacy & Term documents. 5. Scaling infrastructure plan." 
    },
    {
        label: "🏢 Enterprise Architecture",
        prompt: "ACT AS THE CTO. Architect a modern hybrid-cloud environment for a global retail chain. Focus on: 1. Data Lake Modernization. 2. Real-time Inventory API. 3. Zero-trust security framework. 4. Multi-region deployment script. 5. ROI dashboard concept."
    },
    { 
        label: "🎬 Content Empire", 
        prompt: "ACT AS THE PRODUCER. Build a viral content brand around [Niche]. Tasks: 1. Brand Identity & Voice. 2. 30-day viral hook calendar. 3. Video production workflow. 4. Sponsorship pitch deck. 5. Cross-platform automation script." 
    }
];

export const AuraGenesis: React.FC<AuraGenesisProps> = ({ isOpen, onClose, onAddMessage }) => {
    const [wish, setWish] = useState("");
    const [isWishing, setIsWishing] = useState(false);
    const [steps, setSteps] = useState<GenesisStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [previewContent, setPreviewContent] = useState<any>(null);
    const [showContext, setShowContext] = useState(false);
    const [neuralLoad, setNeuralLoad] = useState(0);
    
    // GitHub State
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [githubStatus, setGithubStatus] = useState("");
    const [ghConfig, setGhConfig] = useState<GithubConfig>({ token: '', owner: '', repo: '', path: '' });

    // Build/APK State
    const [showBuildModal, setShowBuildModal] = useState(false);
    const [buildLogs, setBuildLogs] = useState<string[]>([]);
    const [buildProgress, setBuildProgress] = useState(0);

    // NEURAL CONTEXT STATE
    const [neuralContext, setNeuralContext] = useState<NeuralContext>({
        userIdentity: "",
        businessProfile: "",
        brandVoice: "Futuristic, Highly Technical, Executive",
        antiPatterns: "Avoid corporate fluff. Prioritize raw utility and scalable logic."
    });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const logsRef = useRef<HTMLDivElement>(null);

    // --- PERSISTENCE ---
    useEffect(() => {
        const savedContext = localStorage.getItem('genesis_neural_context');
        if (savedContext) setNeuralContext(JSON.parse(savedContext));
        const savedProject = localStorage.getItem('genesis_active_project');
        if (savedProject) {
            const project = JSON.parse(savedProject);
            setSteps(project.steps || []);
            setWish(project.wish || "");
            setCurrentStepIndex(project.currentStepIndex || -1);
        }
    }, []);

    // Neural Load Simulation
    useEffect(() => {
        let interval: any;
        if (isExecuting) {
            interval = setInterval(() => {
                setNeuralLoad(prev => Math.floor(Math.random() * 40) + 50); // 50-90% load during execution
            }, 1000);
        } else {
            setNeuralLoad(prev => Math.max(5, prev - 5)); // Cool down
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
                        text: "✅ Genesis Operation Concluded. All Neural Units synchronized.",
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
                .map(s => `[${s.label} Output]: ${s.result ? s.result.substring(0, 500) + "..." : "Done"}`)
                .join("\n\n");

            setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'processing' } : s));

            try {
                const resultStep = await executeGenesisStep(step, wish, priorContext, neuralContext);
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? resultStep : s));
                setPreviewContent({ type: resultStep.type, result: resultStep.result, label: resultStep.label });
                setCurrentStepIndex(prev => prev + 1);
            } catch (e) {
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'failed' } : s));
                setIsExecuting(false);
            }
        };

        if (isExecuting) runNext();
    }, [isExecuting, currentStepIndex]);

    const handleRubLamp = async (customWish?: string) => {
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
            alert("Neural Link Interrupted.");
        } finally {
            setIsWishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col font-mono text-white animate-in fade-in duration-500 overflow-hidden">
            
            {/* TOP SYSTEM HUD */}
            <div className="h-16 px-6 border-b border-white/10 flex justify-between items-center bg-black/60 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black tracking-[0.2em] text-blue-400 uppercase">Genesis OS v4.2</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 uppercase font-bold">Core Brain Active</span>
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-ping"></div>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    
                    {/* NEURAL LOAD MONITOR */}
                    <div className="hidden md:flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                        <span className="text-[9px] font-black text-white/40 uppercase">Neural Load</span>
                        <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${neuralLoad > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${neuralLoad}%` }}
                            ></div>
                        </div>
                        <span className={`text-[9px] font-bold tabular-nums ${neuralLoad > 80 ? 'text-red-400' : 'text-blue-400'}`}>{neuralLoad}%</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowContext(!showContext)} className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all ${showContext ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>🧠 Memory</button>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 transition-all">✕</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* WORKFORCE SIDEBAR (Left) */}
                <div className="w-20 lg:w-80 border-r border-white/10 bg-[#050505] flex flex-col p-4 gap-6 shrink-0 z-40 overflow-y-auto no-scrollbar">
                    
                    {/* Active Agents Visualization */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">Workforce Dispatch</label>
                        <div className="grid gap-2">
                            {AGENTS.map(agent => (
                                <div key={agent.id} className={`p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden group ${isExecuting ? 'bg-white/5 border-white/10 shadow-lg' : 'opacity-30 border-transparent'}`}>
                                    {isExecuting && (
                                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                                    )}
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className="text-2xl">{agent.icon}</span>
                                        <div className="hidden lg:block">
                                            <div className={`text-[10px] font-black uppercase tracking-tighter ${agent.color}`}>{agent.label}</div>
                                            <div className="text-[9px] text-white/40 font-bold uppercase truncate">Status: Active</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Timeline */}
                    {steps.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">Deployment Queue</label>
                            <div className="space-y-3 px-2">
                                {steps.map((s, i) => (
                                    <div key={s.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-3 h-3 rounded-full border-2 transition-all ${s.status === 'completed' ? 'bg-green-500 border-green-500 shadow-[0_0_10px_#22c55e]' : s.status === 'processing' ? 'bg-blue-500 border-blue-500 animate-pulse' : 'border-white/10'}`}></div>
                                            {i < steps.length - 1 && <div className="w-[2px] h-6 bg-white/5"></div>}
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase tracking-tight truncate ${s.status === 'processing' ? 'text-blue-400' : 'text-white/40 group-hover:text-white'}`}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* MAIN CONTENT WORKSPACE */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    
                    {/* Context Overlay (Memory Panel) */}
                    <div className={`absolute inset-y-0 left-0 bg-gray-900/95 border-r border-white/10 z-50 transition-all duration-500 ease-in-out flex flex-col shadow-2xl ${showContext ? 'w-full md:w-96 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}`}>
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest">Neural Context Memory</h3>
                            <p className="text-[10px] text-white/40 mt-2 leading-relaxed">Modify these shards to influence how all AI Agents approach your project.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase mb-2 block">System Goal</label>
                                <textarea 
                                    value={neuralContext.businessProfile}
                                    onChange={e => setNeuralContext({...neuralContext, businessProfile: e.target.value})}
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Agent Persona Base</label>
                                <input 
                                    type="text"
                                    value={neuralContext.brandVoice}
                                    onChange={e => setNeuralContext({...neuralContext, brandVoice: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Display Area */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar">
                        {!steps.length ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">BUILD YOUR <br/> VISION</h1>
                                    <p className="text-xs text-blue-500 font-bold uppercase tracking-[1em]">Universal AI Architect Active</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full px-6">
                                    {GENESIS_IDEAS.map((idea, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleRubLamp(idea.prompt)}
                                            className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left hover:bg-blue-600 hover:text-white transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                                            <div className="text-2xl mb-4 group-hover:scale-110 transition-transform">{idea.label.split(' ')[0]}</div>
                                            <div className="font-black text-xs uppercase tracking-widest leading-relaxed">{idea.label.split(' ').slice(1).join(' ')}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
                                {previewContent ? (
                                    <div className="bg-black/60 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-3xl min-h-[600px] flex flex-col">
                                        <div className="h-14 border-b border-white/5 flex justify-between items-center px-8 bg-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{previewContent.type} Output: {previewContent.label}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button className="text-[9px] font-black text-white/40 hover:text-white uppercase transition-all">📋 Copy Source</button>
                                                <button className="text-[9px] font-black text-white/40 hover:text-white uppercase transition-all">💾 Export</button>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-10 overflow-y-auto no-scrollbar relative">
                                            {previewContent.type === 'code' ? (
                                                <iframe 
                                                    ref={iframeRef}
                                                    srcDoc={previewContent.result}
                                                    className="w-full h-full border-none bg-white rounded-2xl shadow-inner min-h-[500px]"
                                                    title="Execution Preview"
                                                />
                                            ) : (
                                                <div className="prose prose-invert prose-blue max-w-none prose-p:text-lg prose-p:leading-relaxed prose-headings:tracking-tighter">
                                                    <div dangerouslySetInnerHTML={{ __html: previewContent.result }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-96 flex flex-col items-center justify-center gap-6 opacity-30">
                                        <div className="w-16 h-16 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initializing Execution Unit...</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* INPUT TERMINAL (Bottom) */}
                    <div className="h-28 px-10 border-t border-white/10 bg-black/80 backdrop-blur-3xl flex items-center gap-6 shrink-0 z-50">
                        <div className="flex-1 relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 text-xl group-focus-within:animate-pulse">⚡</div>
                            <input 
                                type="text"
                                value={wish}
                                onChange={(e) => setWish(e.target.value)}
                                placeholder="Command the Genesis AI... Describe your enterprise wish."
                                className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 text-white text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-blue-600/5 transition-all shadow-inner"
                                onKeyDown={(e) => e.key === 'Enter' && handleRubLamp()}
                            />
                        </div>
                        <button 
                            onClick={() => handleRubLamp()}
                            disabled={!wish.trim() || isWishing || isExecuting}
                            className="h-16 px-10 bg-white text-black hover:bg-blue-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95"
                        >
                            {isWishing || isExecuting ? <div className="w-4 h-4 border-4 border-t-black border-white/20 rounded-full animate-spin"></div> : <span>GENERATE</span>}
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
