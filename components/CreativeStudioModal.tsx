
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
    { id: 'campus', label: '🎓 Campus', color: 'blue' },
    { id: 'creative', label: '🎨 Creative', color: 'pink' },
    { id: 'utility', label: '🛠️ Utility', color: 'blue' },
    { id: 'business', label: '💼 Business', color: 'emerald' },
    { id: 'coding', label: '💻 Coding', color: 'cyan' },
    { id: 'astrology', label: '🔮 Astrology', color: 'purple' }
];

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({ isOpen, onClose, selectedTool, onSelectTool, onExecute }) => {
    const [input, setInput] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState('campus');

    if (!isOpen) return null;

    const handleExecute = () => {
        if (selectedTool) {
            onExecute(selectedTool, input, image || undefined);
            setInput("");
            setImage(null);
            onClose();
        }
    };

    const filteredTools = CREATIVE_TOOLS.filter(t => t.category === activeCat);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
             <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl relative">
                
                {/* Sidebar */}
                <div className="w-16 md:w-64 border-r border-white/5 bg-black/40 flex flex-col shrink-0">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="hidden md:block text-lg font-black text-white uppercase tracking-widest">Aura Studio</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => { setActiveCat(cat.id); onSelectTool(null); }}
                                className={`w-full text-left p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all ${
                                    activeCat === cat.id 
                                    ? `bg-white/10 text-white border border-white/20` 
                                    : 'hover:bg-white/5 text-white/40 hover:text-white'
                                }`}
                            >
                                <span className="text-xl md:text-lg">{cat.label.split(' ')[0]}</span>
                                <span className="hidden md:block text-xs font-bold uppercase tracking-wider">{cat.label.split(' ')[1]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tool Selection */}
                <div className={`flex-col border-r border-white/5 bg-[#161616] ${selectedTool ? 'hidden md:flex md:w-1/3' : 'flex-1 md:w-1/3'}`}>
                     <div className="p-6 border-b border-white/5 bg-[#1a1a1a]">
                        <h3 className="text-white/60 font-bold uppercase text-xs tracking-widest">Select Expert</h3>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredTools.map(tool => (
                            <button 
                                key={tool.id}
                                onClick={() => onSelectTool(tool)}
                                className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all group ${
                                    selectedTool?.id === tool.id 
                                    ? 'bg-blue-600 shadow-lg text-white' 
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                                }`}
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold truncate">{tool.label}</div>
                                    <div className="text-[10px] opacity-50 truncate">{tool.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Execution Area */}
                <div className={`flex-col bg-[#0a0a0a] relative p-10 ${selectedTool ? 'flex-1' : 'hidden md:flex md:flex-1'}`}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">✕ ESC</button>

                    {selectedTool ? (
                        <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-4xl">{selectedTool.icon}</span>
                                    <h2 className="text-3xl font-black text-white uppercase">{selectedTool.label}</h2>
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed">{selectedTool.description}</p>
                            </div>
                            
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-white/20"
                                placeholder={`Enter context for ${selectedTool.label}...`}
                            />

                            <button 
                                onClick={handleExecute}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                ⚡ Materialize Protocol
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <div className="text-6xl mb-6">🛠️</div>
                            <h3 className="text-2xl font-bold uppercase tracking-widest">Studio Ready</h3>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};
