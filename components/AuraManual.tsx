
import React, { useState } from 'react';

interface AuraManualProps {
    isOpen: boolean;
    onClose: () => void;
}

const MODULES = [
    { id: 'vision', title: 'Vision', icon: '👁️', desc: 'Real-time spatial awareness using Gemini 2.5 Flash.', color: 'from-blue-500 to-cyan-500' },
    { id: 'studio', title: 'Studio', icon: '🎨', desc: 'Media production hub for news, music, and art.', color: 'from-pink-500 to-rose-500' },
    { id: 'genesis', title: 'Genesis', icon: '🛠️', desc: 'Zero-code software architecting engine.', color: 'from-indigo-500 to-purple-500' },
    { id: 'connect', title: 'Connect', icon: '🤝', desc: 'Neural CRM for lead tracking and heat mapping.', color: 'from-emerald-500 to-teal-500' },
];

export const AuraManual: React.FC<AuraManualProps> = ({ isOpen, onClose }) => {
    const [selectedModule, setSelectedModule] = useState(MODULES[0]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-2xl h-[65vh] bg-[#0a0a0f] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
                
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2">Aura OS Kernel Handbook</span>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all text-xs">✕</button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-14 md:w-40 border-r border-white/5 bg-black/40 p-2 space-y-1 overflow-y-auto neural-scroll shrink-0">
                        {MODULES.map((mod) => (
                            <button 
                                key={mod.id}
                                onClick={() => setSelectedModule(mod)}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all ${
                                    selectedModule.id === mod.id 
                                    ? `bg-gradient-to-br ${mod.color} text-white` 
                                    : 'hover:bg-white/5 text-white/20'
                                }`}
                            >
                                <span className="text-lg shrink-0">{mod.icon}</span>
                                <span className="hidden md:block text-[9px] font-black uppercase tracking-wider truncate">{mod.title}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 neural-scroll">
                        <div className="max-w-md animate-in slide-in-from-right-4 duration-500">
                            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">{selectedModule.title}</h3>
                            <div className={`h-1 w-10 bg-gradient-to-r ${selectedModule.color} mb-6 rounded-full`}></div>
                            <p className="text-lg font-light leading-relaxed text-white/70 mb-8">
                                {selectedModule.desc}
                            </p>
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <h4 className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Technical Note</h4>
                                <p className="text-[10px] text-white/40 leading-relaxed">System integration verified for Apex v5.0 kernel. Latency optimized.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`.neural-scroll::-webkit-scrollbar { width: 3px; } .neural-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>
        </div>
    );
};
