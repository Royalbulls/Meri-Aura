
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
    { id: 'student', label: 'Student Tool', icon: '🎓', desc: 'Academic & career' },
    { id: 'webapp', label: 'Web App', icon: '🌐', desc: 'Full-stack responsive' },
    { id: 'saas', label: 'Dashboard', icon: '📊', desc: 'Business metrics' },
    { id: 'ecom', label: 'Storefront', icon: '🛍️', desc: 'E-commerce' }
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
        businessProfile: "Aura Genesis Protocol",
        brandVoice: "Futuristic",
        antiPatterns: "No generic advice."
    });

    useEffect(() => {
        if (!isExecuting || currentStepIndex === -1 || currentStepIndex >= steps.length) return;

        const runStep = async () => {
            const step = steps[currentStepIndex];
            setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'processing' } : s));

            const priorContext = steps
                .slice(0, currentStepIndex)
                .filter(s => s.status === 'completed')
                .map(s => `[Step: ${s.label} Output]: ${s.result?.substring(0, 500)}...`)
                .join("\n\n");

            try {
                const completedStep = await executeGenesisStep(step, vision, priorContext, neuralContext);
                setSteps(prev => prev.map((s, i) => i === currentStepIndex ? completedStep : s));
                
                if (completedStep.type === 'code') {
                   setPreviewContent({ type: completedStep.type, result: completedStep.result || "", label: completedStep.label });
                }

                if (currentStepIndex < steps.length - 1) {
                    setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1000);
                } else {
                    setIsExecuting(false);
                    onAddMessage({ id: Date.now().toString(), text: `✅ Materialization Done!`, sender: 'bot', timestamp: new Date() });
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
            const plannedSteps = await planGenesis(`BUILD: ${selectedBuildType}. VISION: ${vision}`, neuralContext);
            setSteps(plannedSteps.map(s => ({ ...s, status: 'pending' })));
            setIsWishing(false);
            setCurrentStepIndex(0);
            setIsExecuting(true);
        } catch (e) {
            setIsWishing(false);
            alert("Planning failed.");
        }
    };

    const handleDeploy = async () => {
        if (!previewContent?.result) return;
        setDeployingStatus("Syncing...");
        try {
            await storageService.saveProject({
                id: Date.now().toString(),
                name: previewContent.label || "Genesis App",
                description: vision.substring(0, 100),
                code: previewContent.result,
                author: "Chief Admin",
                timestamp: Date.now(),
                category: selectedBuildType
            });
            setDeployingStatus("✅ DEPLOYED");
            setTimeout(() => { setDeployingStatus(null); onOpenLaunchpad?.(); }, 1000);
        } catch (e) { setDeployingStatus("❌ ERROR"); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-[#020205] flex flex-col font-mono text-white animate-in fade-in duration-500 overflow-hidden">
            <div className="h-14 px-6 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs">🛠️</div>
                    <h2 className="text-xs font-black tracking-widest uppercase">Genesis Engine</h2>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-red-500/20 text-xs">✕</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-12 custom-scrollbar">
                    {!steps.length && !isWishing ? (
                        <div className="max-w-4xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {BUILD_TYPES.map(type => (
                                    <button 
                                        key={type.id} onClick={() => setSelectedBuildType(type.id)}
                                        className={`p-6 rounded-2xl border text-left transition-all ${selectedBuildType === type.id ? 'bg-blue-600 border-blue-400 scale-105 shadow-xl' : 'bg-white/5 border-white/10 opacity-60'}`}
                                    >
                                        <div className="text-3xl mb-3">{type.icon}</div>
                                        <div className="text-[10px] font-black uppercase tracking-tight mb-1">{type.label}</div>
                                        <div className="text-[8px] opacity-40 font-bold leading-relaxed">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                value={vision} onChange={(e) => setVision(e.target.value)}
                                placeholder="Describe your vision (e.g. A stock tracker for kids)..."
                                className="w-full h-60 bg-white/5 border border-white/10 rounded-3xl p-8 text-xl font-light focus:outline-none focus:border-blue-500 transition-all placeholder-white/5 resize-none shadow-inner"
                            />
                            <button onClick={handleStartGenesis} className="w-full h-16 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">MATERIALIZE ⚡</button>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
                            {(isWishing || (isExecuting && !previewContent)) ? (
                                <div className="h-[60vh] flex flex-col items-center justify-center gap-10">
                                    <div className="w-20 h-20 border-8 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.6em] animate-pulse">Architecting Neural Code</p>
                                </div>
                            ) : previewContent && (
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                                    <div className="h-12 border-b border-white/5 flex justify-between items-center px-6 bg-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">App Materialized: {previewContent.label}</span>
                                        <button onClick={handleDeploy} className="px-6 py-1.5 bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            {deployingStatus || 'Deploy to Launchpad'}
                                        </button>
                                    </div>
                                    <div className="flex-1 bg-white">
                                        <iframe srcDoc={previewContent.result} className="w-full h-full border-none" title="Genesis Preview" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }`}</style>
        </div>
    );
};
