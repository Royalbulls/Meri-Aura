
import React, { useState, useEffect } from 'react';

interface SystemDiagnosticsProps {
    onClose: () => void;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ onClose }) => {
    const [progress, setProgress] = useState(0);
    const [activeModule, setActiveModule] = useState<string>("INITIALIZING");
    const [logs, setLogs] = useState<string[]>([]);
    const [showEmergencySkip, setShowEmergencySkip] = useState(false);
    
    const modules = [
        { id: 'NEURAL_ENGINE', label: 'Neural Core v3.0', status: 'WAITING' },
        { id: 'VISUAL_CORTEX', label: 'Aura Vision SDK', status: 'WAITING' },
        { id: 'AUDIO_RECEPTORS', label: 'Omni-Voice Array', status: 'WAITING' },
        { id: 'MEMORY_BANKS', label: 'Neural Vault', status: 'WAITING' },
        { id: 'NETWORK_UPLINK', label: 'Gemini Hybrid Link', status: 'WAITING' },
    ];

    const [moduleStates, setModuleStates] = useState(modules);

    useEffect(() => {
        let currentProgress = 0;
        
        // Safety timeout to show skip if stuck
        const safetyTimeout = setTimeout(() => {
            setShowEmergencySkip(true);
        }, 5000);

        const interval = setInterval(() => {
            currentProgress += 1;
            const newProgress = Math.min(currentProgress, 100);
            setProgress(newProgress);

            if (newProgress < 20) {
                setActiveModule("LOADING CORE KERNEL...");
            } else if (newProgress === 20) {
                updateModuleStatus('NEURAL_ENGINE', 'ACTIVE');
                setLogs(prev => ["✓ Neural Core Synchronized", ...prev]);
            } else if (newProgress === 40) {
                updateModuleStatus('VISUAL_CORTEX', 'ACTIVE');
                updateModuleStatus('AUDIO_RECEPTORS', 'ACTIVE');
                setLogs(prev => ["✓ Bio-Sensors Active", ...prev]);
            } else if (newProgress === 70) {
                updateModuleStatus('MEMORY_BANKS', 'ACTIVE');
                setLogs(prev => ["✓ Memory Vault Decrypted", ...prev]);
            } else if (newProgress === 90) {
                updateModuleStatus('NETWORK_UPLINK', 'ACTIVE');
                setLogs(prev => ["✓ Secure Uplink established", ...prev]);
            } else if (newProgress === 100) {
                setActiveModule("SYSTEM OPTIMIZED");
                clearInterval(interval);
                clearTimeout(safetyTimeout);
            }

        }, 20); // Faster boot: ~2 seconds total

        return () => {
            clearInterval(interval);
            clearTimeout(safetyTimeout);
        };
    }, []);

    const updateModuleStatus = (id: string, status: string) => {
        setModuleStates(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    };

    return (
        <div className="min-h-screen w-full bg-[#020205] text-white font-mono flex flex-col overflow-y-auto overflow-x-hidden pt-[var(--sat)] pb-[var(--sab)]">
            
            {/* Background Animation */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
                <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 animate-spin-slow" 
                     style={{
                         backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.15) 1px, transparent 1px)',
                         backgroundSize: '40px 40px'
                     }}>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-5xl flex flex-col md:flex-row gap-10 lg:gap-20 items-center justify-center">
                    
                    {/* Visualizer Section */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="relative w-48 h-48 md:w-80 md:h-80 flex items-center justify-center">
                            <div className="absolute inset-0 border-[4px] border-blue-500/10 rounded-full"></div>
                            <div className="absolute inset-0 border-t-[4px] border-blue-500 rounded-full animate-spin"></div>
                            
                            <div className="w-24 h-24 md:w-36 md:h-36 bg-white/5 rounded-full backdrop-blur-3xl border border-white/10 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.3)]">
                                <span className="text-3xl md:text-5xl font-black text-white">{progress}%</span>
                                <span className="text-[7px] font-black uppercase text-blue-400 mt-1 tracking-widest">BOOT</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase mb-2">
                                Aura <span className="text-blue-500">OS</span>
                            </h2>
                            <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] text-blue-400 font-black uppercase tracking-[0.3em] animate-pulse">
                                {activeModule}
                            </div>
                        </div>
                    </div>

                    {/* Status & Action Section */}
                    <div className="flex-1 w-full max-w-md flex flex-col gap-6">
                        <div className="space-y-4">
                            {moduleStates.map((mod) => (
                                <div key={mod.id} className="w-full">
                                    <div className="flex justify-between items-end mb-1 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${mod.status === 'ACTIVE' ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-gray-800'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${mod.status === 'ACTIVE' ? 'text-white' : 'text-white/20'}`}>{mod.label}</span>
                                        </div>
                                        <span className={`text-[8px] font-mono ${mod.status === 'ACTIVE' ? 'text-blue-400' : 'text-white/10'}`}>{mod.status}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-700 ${mod.status === 'ACTIVE' ? 'w-full bg-blue-500' : 'w-0'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Logs Console */}
                        <div className="h-32 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-white/40 overflow-y-auto no-scrollbar shadow-inner">
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div key={i} className="animate-in slide-in-from-left-2 transition-all">
                                        <span className="text-blue-500/50 mr-2">>></span> {log}
                                    </div>
                                ))}
                                <div className="animate-pulse">_ Sourcing neural patterns...</div>
                            </div>
                        </div>

                        {/* Main Interaction Button */}
                        <div className="pt-2 min-h-[80px]">
                            {progress === 100 ? (
                                <button 
                                    onClick={onClose}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-95 animate-in zoom-in duration-300 rounded-2xl border border-white/20"
                                >
                                    Initialize Interface
                                </button>
                            ) : showEmergencySkip ? (
                                <button 
                                    onClick={onClose}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black uppercase tracking-widest text-[9px] rounded-xl border border-white/5 transition-all underline"
                                >
                                    Skip Diagnostics
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spinSlow 20s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
