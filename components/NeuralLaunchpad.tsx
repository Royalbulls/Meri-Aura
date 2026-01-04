
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { storageService } from '../services/storageService';

interface NeuralLaunchpadProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NeuralLaunchpad: React.FC<NeuralLaunchpadProps> = ({ isOpen, onClose }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const loadProjects = async () => {
        const p = await storageService.getAllProjects();
        setProjects(p.sort((a, b) => b.timestamp - a.timestamp));
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Bhai, delete kar du?")) {
            await storageService.deleteProject(id);
            loadProjects();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] bg-[#020205]/95 backdrop-blur-2xl flex flex-col font-sans text-white animate-in slide-in-from-bottom-12 duration-500 overflow-hidden">
            <div className="h-16 border-b border-white/5 flex justify-between items-center px-6 bg-black/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">🚀</div>
                    <div>
                        <h2 className="text-xs font-black tracking-widest uppercase">Neural Launchpad</h2>
                        <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.3em]">Materialized Assets</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-all text-sm">✕</button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeProject ? (
                    <div className="h-full flex flex-col bg-white">
                        <div className="h-12 bg-[#0a0a0f] border-b border-white/10 flex items-center px-6 justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase text-white/70">Executing: {activeProject.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        const blob = new Blob([activeProject.code], { type: 'text/html' });
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                    }}
                                    className="text-[9px] font-black uppercase px-3 py-1.5 bg-blue-600 rounded-md"
                                >
                                    Full Screen ↗
                                </button>
                                <button onClick={() => setActiveProject(null)} className="text-[10px] text-white/50 hover:text-white uppercase font-black bg-white/5 px-3 py-1.5 rounded-md transition-all">Close Sandbox</button>
                            </div>
                        </div>
                        <iframe 
                            srcDoc={activeProject.code} 
                            className="flex-1 w-full border-none bg-white" 
                            title="Sandbox" 
                            sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                        />
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto h-full neural-scroll">
                        {projects.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <div className="text-8xl mb-6">🏝️</div>
                                <h3 className="text-xl font-black uppercase tracking-widest">No materializations</h3>
                                <p className="text-xs mt-2 font-bold uppercase">Use the Genesis Engine to build your first app.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map(project => (
                                    <div 
                                        key={project.id}
                                        onClick={() => setActiveProject(project)}
                                        className="group bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => handleDelete(project.id, e)} 
                                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📦</div>
                                        <h4 className="text-sm font-black uppercase mb-1">{project.name}</h4>
                                        <p className="text-[10px] text-white/40 mb-6 line-clamp-2 italic">{project.description}</p>
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Execute Node</span>
                                            <span className="text-[8px] text-white/20 uppercase font-bold">{new Date(project.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`.neural-scroll::-webkit-scrollbar { width: 3px; } .neural-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>
        </div>
    );
};
