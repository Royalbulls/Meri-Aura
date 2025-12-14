
import React, { useState, useEffect, useRef } from 'react';

interface SystemDiagnosticsProps {
    onClose: () => void;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ onClose }) => {
    const [progress, setProgress] = useState(0);
    const [activeModule, setActiveModule] = useState<string>("INITIALIZING");
    const [logs, setLogs] = useState<string[]>([]);
    
    // Modules to scan
    const modules = [
        { id: 'NEURAL_ENGINE', label: 'Neural Engine', status: 'WAITING' },
        { id: 'VISUAL_CORTEX', label: 'Visual Cortex', status: 'WAITING' },
        { id: 'AUDIO_RECEPTORS', label: 'Audio Receptors', status: 'WAITING' },
        { id: 'MEMORY_BANKS', label: 'Memory Banks', status: 'WAITING' },
        { id: 'NETWORK_UPLINK', label: 'Network Uplink', status: 'WAITING' },
    ];

    const [moduleStates, setModuleStates] = useState(modules);

    useEffect(() => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 1;
            setProgress(Math.min(currentProgress, 100));

            // Simulation Logic
            if (currentProgress < 20) {
                setActiveModule("LOADING CORE KERNEL...");
                if (currentProgress % 5 === 0) setLogs(p => [...p, `> Loading kernel module ${currentProgress}...`]);
            } else if (currentProgress === 20) {
                updateModuleStatus('NEURAL_ENGINE', 'ACTIVE');
                setLogs(p => [...p, "✓ Neural Engine Online"]);
            } else if (currentProgress < 40) {
                setActiveModule("CALIBRATING SENSORS...");
            } else if (currentProgress === 40) {
                updateModuleStatus('VISUAL_CORTEX', 'ACTIVE');
                updateModuleStatus('AUDIO_RECEPTORS', 'ACTIVE');
                setLogs(p => [...p, "✓ Sensors Calibrated"]);
            } else if (currentProgress < 70) {
                setActiveModule("DECRYPTING MEMORY SHARDS...");
            } else if (currentProgress === 70) {
                updateModuleStatus('MEMORY_BANKS', 'ACTIVE');
                setLogs(p => [...p, "✓ Memory Integrity 100%"]);
            } else if (currentProgress < 90) {
                setActiveModule("ESTABLISHING SECURE UPLINK...");
            } else if (currentProgress === 90) {
                updateModuleStatus('NETWORK_UPLINK', 'ACTIVE');
                setLogs(p => [...p, "✓ Uplink Established (Low Latency)"]);
            } else if (currentProgress === 100) {
                setActiveModule("SYSTEM READY");
                clearInterval(interval);
            }

        }, 40); // Speed of boot

        return () => clearInterval(interval);
    }, []);

    const updateModuleStatus = (id: string, status: string) => {
        setModuleStates(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center font-mono overflow-hidden">
            {/* --- BACKGROUND GRID EFFECT --- */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 animate-spin-slow" 
                     style={{
                         backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.1) 1px, transparent 1px)',
                         backgroundSize: '30px 30px'
                     }}>
                </div>
            </div>

            {/* --- MAIN HUD CONTAINER --- */}
            <div className="relative w-full max-w-4xl h-full md:h-[80vh] flex flex-col md:flex-row gap-8 p-8">
                
                {/* LEFT: CORE VISUALIZER */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Rotating Rings */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-spin-slow-reverse border-t-cyan-400 border-l-transparent"></div>
                        <div className="absolute inset-4 border border-cyan-500/20 rounded-full animate-spin-slow border-b-cyan-400 border-r-transparent"></div>
                        <div className="absolute inset-10 border-4 border-cyan-900/40 rounded-full animate-pulse"></div>
                        
                        {/* Center Core */}
                        <div className="w-32 h-32 bg-cyan-500/10 rounded-full backdrop-blur-md border border-cyan-400/50 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] relative">
                            <span className="text-4xl font-bold text-cyan-100">{progress}%</span>
                            <div className="absolute bottom-6 text-[10px] text-cyan-400 uppercase tracking-widest">LOAD</div>
                        </div>
                    </div>

                    <h2 className="mt-8 text-2xl font-black text-white tracking-[0.2em] uppercase animate-pulse text-center">
                        Aura Systems
                    </h2>
                    <p className="text-cyan-500/60 text-xs mt-2 uppercase tracking-widest bg-cyan-900/10 px-4 py-1 rounded border border-cyan-500/20">
                        {activeModule}
                    </p>
                </div>

                {/* RIGHT: DATA MODULES */}
                <div className="flex-1 flex flex-col gap-4 justify-center">
                    {/* Modules List */}
                    <div className="space-y-3">
                        {moduleStates.map((mod) => (
                            <div key={mod.id} className="flex items-center gap-4 group">
                                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500 ${
                                    mod.status === 'ACTIVE' ? 'bg-cyan-400 text-cyan-400' : 'bg-gray-700 text-gray-700'
                                }`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                                            mod.status === 'ACTIVE' ? 'text-white' : 'text-white/30'
                                        }`}>{mod.label}</span>
                                        <span className="text-[10px] font-mono text-cyan-500">{mod.status}</span>
                                    </div>
                                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ease-out ${
                                            mod.status === 'ACTIVE' ? 'w-full bg-cyan-500' : 'w-0'
                                        }`}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Console Log Window */}
                    <div className="mt-8 h-40 bg-black/50 border border-cyan-900/50 rounded-lg p-4 font-mono text-[10px] text-cyan-400/80 overflow-y-auto relative shadow-inner custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col-reverse">
                            {logs.slice().reverse().map((log, i) => (
                                <div key={i} className="mb-1 opacity-80">> {log}</div>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    {progress === 100 && (
                        <button 
                            onClick={onClose}
                            className="mt-4 w-full py-4 bg-cyan-600/20 hover:bg-cyan-500/30 border border-cyan-500 text-cyan-100 font-bold uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] clip-path-polygon"
                        >
                            Initialize Interface
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes spinSlowReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .animate-spin-slow { animation: spinSlow 10s linear infinite; }
                .animate-spin-slow-reverse { animation: spinSlowReverse 15s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 2px; }
            `}</style>
        </div>
    );
};
