
import React, { useState, useEffect, useRef } from 'react';
import { GenesisStep, NeuralContext, Project } from '../types';
import { planGenesis, executeGenesisStep } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface AuraGenesisProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMessage: (msg: any) => void;
    onOpenLaunchpad?: () => void;
}

const BUILD_TYPES = [
    { id: 'student', label: 'Student Project', icon: '🎓', desc: 'Academic tools & career portfolios' },
    { id: 'webapp', label: 'Web Application', icon: '🌐', desc: 'Full-stack responsive web tools' },
    { id: 'saas', label: 'SaaS Dashboard', icon: '📊', desc: 'Business intelligence & management' },
    { id: 'ecom', label: 'E-commerce', icon: '🛍️', desc: 'Shopping & payment experiences' }
];

const AGENTS = [
    { id: 'strategy', label: 'Architect AI', icon: '📐', color: 'text-blue-400' },
    { id: 'dev', label: 'Engineer AI', icon: '🛠️', color: 'text-emerald-400' },
    { id: 'design', label: 'Creative AI', icon: '🎨', color: 'text-pink-400' },
    { id: 'marketing', label: 'Viral AI', icon: '🔥', color: 'text-orange-400' }
];

export const AuraGenesis: React.FC<AuraGenesisProps> = ({ isOpen, onClose, onAddMessage, onOpenLaunchpad }) => {
    const [vision, setVision] = useState("");
    const [selectedBuildType, setSelectedBuildType] = useState('student');
    const [isWishing, setIsWishing] = useState(false);
    const [steps, setSteps] = useState<GenesisStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isExecuting, setIsExecuting] = useState(false);
    const [previewContent, setPreviewContent] = useState<{type: string, result: string, label: string} | null>(null);
    const [deployingStatus, setDeployingStatus] = useState<string | null>(null);
    
    const [neuralContext] = useState<NeuralContext>({
        userIdentity: "Chief Admin",
        businessProfile: "Aura Genesis Protocol - Rapid Innovation Suite",
        brandVoice: "Futuristic, Highly-Efficient, Direct",
        antiPatterns: "No generic advice. Full executable code and deep strategy required."
    });

    useEffect(() => {
        if (!isExecuting || currentStepIndex === -1 || currentStepIndex >= steps.length) return;

        const runStep = async () => {
            const step = steps[currentStepIndex];
            setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'processing' } : s));

            const priorContext = steps
                .slice(0, currentStepIndex)
                .filter(s => s.status === 'completed')
                .map(s => `[Step: ${s.label} Output]: ${s.result?.substring(0, 1000)}...`)
                .join("\n\n");

            try {
                const completedStep = await executeGenesisStep(step, vision, priorContext, neuralContext);
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? completedStep : s));
                
                if (completedStep.type === 'code' || !previewContent) {
                   setPreviewContent({ type: completedStep.type, result: completedStep.result || "", label: completedStep.label });
                }

                if (currentStepIndex < steps.length - 1) {
                    setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1000);
                } else {
                    setIsExecuting(false);
                    onAddMessage({
                        id: Date.now().toString(),
                        text: `✅ Vision Materialized! Check the ${selectedBuildType} artifact! 🚀`,
                        sender: 'bot',
                        timestamp: new Date()
                    });
                }
            } catch (err) {
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'failed' } : s));
                setIsExecuting(false);
            }
        };

        runStep();
    }, [currentStepIndex, isExecuting]);

    const handleStartGenesis = async () => {
        if (!vision.trim() || isWishing || isExecuting) return;

        setIsWishing(true);
        setSteps([]);
        setPreviewContent(null);
        setCurrentStepIndex(-1);

        try {
            const finalPrompt = `BUILD CATEGORY: ${selectedBuildType}. USER VISION: ${vision}`;
            const plannedSteps = await planGenesis(finalPrompt, neuralContext);
            setSteps(plannedSteps.map(s => ({ ...s, status: 'pending' })));
            setIsWishing(false);
            setCurrentStepIndex(0);
            setIsExecuting(true);
        } catch (e) {
            setIsWishing(false);
            alert("Neural planning failed.");
        }
    };

    const handleDeployToLaunchpad = async () => {
        let codeToDeploy = previewContent?.type === 'code' ? previewContent.result : '';
        if (!codeToDeploy) {
            const codeStep = steps.find(s => s.type === 'code' && s.result);
            if (codeStep) codeToDeploy = codeStep.result!;
        }

        if (!codeToDeploy) return;

        setDeployingStatus("Syncing...");
        try {
            const newProject: Project = {
                id: Date.now().toString(),
                name: previewContent?.label || steps[0].label,
                description: vision.substring(0, 100) + "...",
                code: codeToDeploy,
                author: "Chief Admin",
                timestamp: Date.now(),
                category: selectedBuildType
            };
            await storageService.saveProject(newProject);
            setDeployingStatus("✅ DONE");
            setTimeout(() => {
                setDeployingStatus(null);
                if (onOpenLaunchpad) onOpenLaunchpad();
            }, 1000);
        } catch (e) {
            setDeployingStatus("❌ ERROR");
            setTimeout(() => setDeployingStatus(null), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-[#020205] flex flex-col font-mono text-white animate-in fade-in duration-500 overflow-hidden">
            <div className="h-20 px-8 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10">🛠️</div>
                    <h2 className="text-xl font-black tracking-tighter uppercase">Genesis Engine</h2>
                </div>
                <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-red-500/20 transition-all border border-white/10">✕</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="hidden lg:flex w-80 border-r border-white/5 bg-[#050505] flex-col p-8 gap-10 shrink-0">
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">Workforce Nodes</label>
                        {AGENTS.map(agent => (
                            <div key={agent.id} className={`p-5 rounded-3xl border transition-all ${isExecuting ? 'bg-white/5 border-white/10 opacity-100' : 'opacity-20 grayscale border-transparent'}`}>
                                <div className="flex items-center gap-5">
                                    <span className="text-3xl">{agent.icon}</span>
                                    <div className="text-[11px] font-black uppercase tracking-tight text-white/60">{agent.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.06)_0%,_transparent_50%)] overflow-y-auto p-8 md:p-16 custom-scrollbar">
                    {!steps.length && !isWishing ? (
                        <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-700">
                            <h3 className="text-6xl font-black tracking-tighter uppercase">Neural Vision Board</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {BUILD_TYPES.map(type => (
                                    <button 
                                        key={type.id} onClick={() => setSelectedBuildType(type.id)}
                                        className={`p-8 rounded-[2.5rem] border text-left transition-all ${selectedBuildType === type.id ? 'bg-blue-600 border-blue-400 shadow-2xl scale-105' : 'bg-white/5 border-white/10 opacity-60'}`}
                                    >
                                        <div className="text-4xl mb-4">{type.icon}</div>
                                        <div className="text-[11px] font-black uppercase tracking-tight mb-2">{type.label}</div>
                                        <div className="text-[9px] opacity-50 font-bold leading-relaxed">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                value={vision} onChange={(e) => setVision(e.target.value)}
                                placeholder="Describe your life-changing idea..."
                                className="w-full h-80 bg-white/5 border border-white/10 rounded-[3rem] p-12 text-2xl font-light focus:outline-none focus:border-blue-500 transition-all placeholder-white/5 resize-none shadow-inner"
                            />
                            <button onClick={handleStartGenesis} className="w-full h-20 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Materialize Vision ⚡</button>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
                            {isWishing || (isExecuting && !previewContent) ? (
                                <div className="h-[60vh] flex flex-col items-center justify-center gap-10">
                                    <div className="w-24 h-24 border-8 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                                    <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.6em] animate-pulse">Architecting Neural Blueprints</p>
                                </div>
                            ) : previewContent ? (
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-[4.5rem] overflow-hidden shadow-2xl flex flex-col min-h-[800px]">
                                    <div className="h-20 border-b border-white/5 flex justify-between items-center px-12 bg-white/5">
                                        <div className="flex items-center gap-5">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                                            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60">Materialized: {previewContent.label}</span>
                                        </div>
                                        <button onClick={handleDeployToLaunchpad} className="px-10 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                            {deployingStatus || '🚀 Deploy to Launchpad'}
                                        </button>
                                    </div>
                                    <div className="flex-1 p-12">
                                        {previewContent.type === 'code' ? (
                                            <iframe srcDoc={previewContent.result} className="w-full h-[700px] border-none bg-white rounded-[2.5rem]" title="Preview" />
                                        ) : (
                                            <div className="p-16 bg-white/5 rounded-[3rem] text-xl leading-relaxed text-white/80 whitespace-pre-wrap">{previewContent.result}</div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 10px; }`}</style>
        </div>
    );
};
