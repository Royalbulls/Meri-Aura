
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { storageService } from '../services/storageService';
import { generateCreativeContent } from '../services/geminiService';

interface NeuralLaunchpadProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NeuralLaunchpad: React.FC<NeuralLaunchpadProps> = ({ isOpen, onClose }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

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
        if (window.confirm("Bhai, delete kar du? Ye project wapas nahi aayega!")) {
            await storageService.deleteProject(id);
            loadProjects();
        }
    };

    const handleShare = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        const shareData = btoa(JSON.stringify({ n: project.name, c: project.code }));
        const url = `${window.location.origin}/?project=${shareData}`;
        navigator.clipboard.writeText(url);
        alert("Bhai, shareable link copy kar liya hai! Bhej do Besties ko! 🔗");
    };

    const handleExplainCode = async () => {
        if (!activeProject) return;
        setIsExplaining(true);
        setExplanation(null);
        try {
            const result = await generateCreativeContent(
                'chat', 
                `Bhai, ye code students ko samjhana hai. Har ek function aur logic ko Hinglish mein simplify karke batao.
                CODE:
                ${activeProject.code.substring(0, 3000)}`,
                { name: 'Aura', visualPrompt: '', voiceName: 'Kore', description: 'AI Bestie' } as any
            );
            setExplanation(result.text);
        } catch (e) {
            setExplanation("Bhai, neural breakdown ho gaya. Try again!");
        } finally {
            setIsExplaining(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] bg-[#020205] flex flex-col font-sans text-white animate-in slide-in-from-bottom-12 duration-500 overflow-hidden">
            
            {/* HEADER */}
            <div className="h-20 border-b border-white/5 flex justify-between items-center px-8 bg-black/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10">🚀</div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase">Neural Launchpad</h2>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Materialized App Store & Sandbox</p>
                    </div>
                </div>
                
                <div className="flex-1 max-w-md mx-10 hidden md:block">
                    <div className="relative">
                        <input 
                            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search your creations..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                    </div>
                </div>

                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10">✕</button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeProject ? (
                    /* SANDBOX VIEW */
                    <div className="h-full flex flex-col md:flex-row animate-in fade-in duration-500">
                        {/* THE APP RUNNER */}
                        <div className="flex-1 bg-white relative">
                            <iframe srcDoc={activeProject.code} className="w-full h-full border-none" title="Project Sandbox" />
                            <button 
                                onClick={() => setActiveProject(null)}
                                className="absolute top-6 left-6 px-6 py-2 bg-black/80 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-black transition-all"
                            >
                                ← Back to Store
                            </button>
                        </div>
                        
                        {/* LEARNING PANEL */}
                        <div className="w-full md:w-96 bg-[#0a0a0c] border-l border-white/5 flex flex-col shrink-0 shadow-2xl">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Project Intelligence</h3>
                                <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">{activeProject.name}</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl">
                                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Learning Mode
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed italic">
                                        "Bhai, ye project students ke liye gold mine hai! Kya main iska code explain karu?"
                                    </p>
                                    <button 
                                        onClick={handleExplainCode}
                                        disabled={isExplaining}
                                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all"
                                    >
                                        {isExplaining ? 'Analyzing...' : '👨‍🏫 Aura Explains Code'}
                                    </button>
                                </div>

                                {explanation && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Neural Breakdown</div>
                                        <div className="text-sm text-white/80 leading-relaxed space-y-4 font-medium">
                                            {explanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/5 bg-black/40">
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={(e) => handleShare(activeProject, e)} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">Share Project</button>
                                    <button onClick={() => window.print()} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">Print Specs</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* GALLERY VIEW */
                    <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar">
                        <div className="max-w-7xl mx-auto w-full">
                            <div className="flex justify-between items-end mb-12">
                                <div>
                                    <h3 className="text-5xl font-black tracking-tighter uppercase">My Materializations</h3>
                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.5em] mt-1">Aura's Creation History</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-white/20">{projects.length}</div>
                                    <div className="text-[9px] font-black text-white/10 uppercase tracking-widest">Saved Apps</div>
                                </div>
                            </div>

                            {projects.length === 0 ? (
                                <div className="h-96 flex flex-col items-center justify-center text-center opacity-20">
                                    <div className="text-8xl mb-6">🏜️</div>
                                    <h4 className="text-xl font-black uppercase tracking-widest">Nothing to Launch</h4>
                                    <p className="text-sm mt-2">Bhai, Genesis mein jaake kuch build karo pehle!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                                    {projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(project => (
                                        <div 
                                            key={project.id}
                                            onClick={() => setActiveProject(project)}
                                            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 group hover:bg-white/10 hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-500 cursor-pointer flex flex-col h-full shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button onClick={(e) => handleShare(project, e)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500 hover:text-white">🔗</button>
                                                <button onClick={(e) => handleDelete(project.id, e)} className="p-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white">🗑️</button>
                                            </div>

                                            <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:rotate-12 transition-transform">🚀</div>
                                            <h4 className="text-2xl font-black tracking-tight mb-2 uppercase">{project.name}</h4>
                                            <p className="text-xs text-white/40 leading-relaxed mb-8 flex-1 italic">"{project.description}"</p>
                                            
                                            <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-auto">
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">{new Date(project.timestamp).toLocaleDateString()}</div>
                                                <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                                    Live Sandbox <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.2); border-radius: 4px; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};
