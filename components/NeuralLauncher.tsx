
import React from 'react';

interface LauncherApp {
    id: string;
    icon: string;
    label: string;
    desc: string;
    color: string;
}

interface NeuralLauncherProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenApp: (id: string) => void;
}

const APPS: LauncherApp[] = [
    { id: 'genesis', icon: '🛠️', label: 'Genesis', desc: 'Software Build', color: 'from-blue-500 to-indigo-600' },
    { id: 'studio', icon: '🎨', label: 'Studio', desc: 'Content Lab', color: 'from-pink-500 to-rose-600' },
    { id: 'news', icon: '📰', label: 'Gazette', desc: 'E-Paper', color: 'from-yellow-400 to-orange-500' },
    { id: 'toon_news', icon: '💥', label: 'Toons', desc: 'Comic News', color: 'from-pink-600 to-purple-600' },
    { id: 'music', icon: '🎹', label: 'Music', desc: 'Audio Lab', color: 'from-cyan-400 to-blue-500' },
    { id: 'connect', icon: '🤝', label: 'Connect', desc: 'CRM Matrix', color: 'from-emerald-400 to-teal-600' },
    { id: 'manual', icon: '📖', label: 'Manual', desc: 'OS Kernel', color: 'from-slate-600 to-slate-800' },
    { id: 'device', icon: '⚙️', label: 'Device', desc: 'Hardware', color: 'from-red-500 to-pink-600' },
    { id: 'launchpad', icon: '🚀', label: 'Vault', desc: 'App Gallery', color: 'from-orange-500 to-red-600' },
];

export const NeuralLauncher: React.FC<NeuralLauncherProps> = ({ isOpen, onClose, onOpenApp }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1500] bg-black/40 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto neural-scroll flex flex-col items-center pt-20 pb-32 px-6">
                
                <div className="max-w-4xl w-full text-center mb-8">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white/90 drop-shadow-xl">Aura OS Shell</h2>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500 mt-1">Apex v5.0 Core Materializer</p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 max-w-3xl w-full">
                    {APPS.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => onOpenApp(app.id)}
                            className="group flex flex-col items-center p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95"
                        >
                            <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${app.color} rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-xl group-hover:scale-105 transition-transform duration-500`}>
                                {app.icon}
                            </div>
                            <div className="mt-2 text-center">
                                <div className="text-[9px] font-black uppercase tracking-widest text-white/70">{app.label}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                <button 
                    onClick={onClose}
                    className="pointer-events-auto w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-red-500/20 border-white/10 transition-all active:scale-90"
                >
                    <span className="text-sm opacity-50">✕</span>
                </button>
            </div>

            <style>{`
                .neural-scroll::-webkit-scrollbar { width: 3px; }
                .neural-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};
