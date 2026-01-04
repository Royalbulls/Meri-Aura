
import React, { useState } from 'react';
import { StudioTool } from '../types';
import { CREATIVE_TOOLS } from '../constants';

interface CreativeStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTool: StudioTool | null;
    onSelectTool: (tool: StudioTool | null) => void;
    onExecute: (tool: StudioTool, input: string, image?: string) => void;
}

const CATEGORIES = [
    { id: 'campus', label: '🎓 Campus' },
    { id: 'creative', label: '🎨 Creative' },
    { id: 'utility', label: '🛠️ Utility' },
    { id: 'business', label: '💼 Business' },
    { id: 'coding', label: '💻 Coding' }
];

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({ isOpen, onClose, selectedTool, onSelectTool, onExecute }) => {
    const [input, setInput] = useState("");
    const [activeCat, setActiveCat] = useState('campus');

    if (!isOpen) return null;

    const handleExecute = () => {
        if (selectedTool) {
            onExecute(selectedTool, input);
            setInput("");
            onClose();
        }
    };

    const filteredTools = CREATIVE_TOOLS.filter(t => t.category === activeCat);

    return (
        <div className="fixed inset-0 z-[1600] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
             <div className="bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl relative">
                
                {/* Micro Sidebar */}
                <div className="w-14 md:w-48 border-r border-white/5 bg-black/40 flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="hidden md:block text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Studio Nodes</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto neural-scroll p-2 space-y-1">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => { setActiveCat(cat.id); onSelectTool(null); }}
                                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                                    activeCat === cat.id 
                                    ? `bg-white/10 text-white border border-white/10` 
                                    : 'hover:bg-white/5 text-white/30 hover:text-white'
                                }`}
                            >
                                <span className="text-xl md:text-sm">{cat.label.split(' ')[0]}</span>
                                <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">{cat.label.split(' ')[1]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dense Tool List */}
                <div className={`flex-col border-r border-white/5 bg-[#121214] ${selectedTool ? 'hidden lg:flex lg:w-64' : 'flex-1 md:w-72'}`}>
                     <div className="p-4 border-b border-white/5">
                        <h3 className="text-white/20 font-black uppercase text-[8px] tracking-widest">Select Intelligence</h3>
                     </div>
                     <div className="flex-1 overflow-y-auto neural-scroll p-2 space-y-1">
                        {filteredTools.map(tool => (
                            <button 
                                key={tool.id}
                                onClick={() => onSelectTool(tool)}
                                className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all group ${
                                    selectedTool?.id === tool.id 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/60'
                                }`}
                            >
                                <span className="text-lg">{tool.icon}</span>
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black truncate uppercase tracking-tight">{tool.label}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Workspace */}
                <div className={`flex-col bg-[#08080a] relative p-8 ${selectedTool ? 'flex-1' : 'hidden md:flex md:flex-1'}`}>
                    <button onClick={onClose} className="absolute top-6 right-8 text-white/20 hover:text-white transition-colors text-xs">✕</button>

                    {selectedTool ? (
                        <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{selectedTool.icon}</span>
                                <div>
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">{selectedTool.label}</h2>
                                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{selectedTool.description}</p>
                                </div>
                            </div>
                            
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-none placeholder-white/5"
                                placeholder={`Specify parameters for ${selectedTool.label}...`}
                            />

                            <button onClick={handleExecute} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">
                                MATERIALIZE DATA
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10">
                            <div className="text-6xl mb-4 italic font-black">AURA</div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">Studio Idle</h3>
                        </div>
                    )}
                </div>
             </div>
             <style>{`.neural-scroll::-webkit-scrollbar { width: 3px; } .neural-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>
        </div>
    );
};
