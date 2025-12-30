
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
    { id: 'creative', label: '🎨 Creative', color: 'pink' },
    { id: 'utility', label: '🛠️ Utility', color: 'blue' },
    { id: 'business', label: '💼 Business', color: 'emerald' },
    { id: 'coding', label: '💻 Coding', color: 'cyan' },
    { id: 'astrology', label: '🔮 Astrology', color: 'purple' },
    { id: 'mode', label: '🕹️ Modes', color: 'yellow' }
];

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({ isOpen, onClose, selectedTool, onSelectTool, onExecute }) => {
    const [input, setInput] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState('creative');

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
                
                {/* Sidebar Navigation */}
                <div className="w-16 md:w-64 border-r border-white/5 bg-black/40 flex flex-col shrink-0">
                    <div className="p-4 md:p-6 border-b border-white/5 flex justify-center md:justify-start">
                        <h2 className="hidden md:block text-lg font-black text-white uppercase tracking-widest">Aura Studio</h2>
                        <div className="md:hidden text-2xl">🎨</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => { setActiveCat(cat.id); if(!selectedTool) onSelectTool(null); }}
                                className={`w-full text-left p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all duration-300 ${
                                    activeCat === cat.id 
                                    ? `bg-white/10 text-white border border-white/20` 
                                    : 'hover:bg-white/5 text-white/40 hover:text-white'
                                }`}
                                title={cat.label}
                            >
                                <span className="text-xl md:text-lg">{cat.label.split(' ')[0]}</span>
                                <span className="hidden md:block text-xs font-bold uppercase tracking-wider">{cat.label.split(' ')[1]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tool Selection Area (Responsive) */}
                <div className={`flex-col border-r border-white/5 bg-[#161616] ${selectedTool ? 'hidden md:flex md:w-1/3' : 'flex-1 md:w-1/3'}`}>
                     <div className="p-6 border-b border-white/5 bg-[#1a1a1a]">
                        <h3 className="text-white/60 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                            <span>{CATEGORIES.find(c => c.id === activeCat)?.label.split(' ')[0]}</span>
                            Experts
                        </h3>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredTools.length > 0 ? filteredTools.map(tool => (
                            <button 
                                key={tool.id}
                                onClick={() => onSelectTool(tool)}
                                className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all group ${
                                    selectedTool?.id === tool.id 
                                    ? 'bg-gradient-to-r from-white/10 to-transparent border-l-4 border-pink-500 text-white shadow-lg' 
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-l-4 border-transparent'
                                }`}
                            >
                                <span className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform">{tool.icon}</span>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold truncate">{tool.label}</div>
                                    <div className="text-[10px] opacity-50 truncate w-full md:w-32">{tool.description}</div>
                                </div>
                            </button>
                        )) : (
                            <div className="text-center p-8 text-white/20 text-xs uppercase tracking-widest">
                                No experts found in this category.
                            </div>
                        )}
                    </div>
                </div>

                {/* Execution / Input Area (Responsive) */}
                <div className={`flex-col bg-[#0a0a0a] relative p-6 md:p-10 ${selectedTool ? 'flex-1' : 'hidden md:flex md:flex-1'}`}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10">✕ ESC</button>

                    {selectedTool ? (
                        <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Mobile Back Button */}
                            <button 
                                onClick={() => onSelectTool(null)} 
                                className="md:hidden self-start mb-2 text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full"
                            >
                                ← Back
                            </button>

                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-4xl">{selectedTool.icon}</span>
                                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">{selectedTool.label}</h2>
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed max-w-lg">{selectedTool.description}</p>
                            </div>
                            
                            {/* DYNAMIC INPUT UI */}
                            <div className="flex-1 flex flex-col gap-4 min-h-0">
                                <label className="block text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">
                                    Your Command for {selectedTool.label}
                                </label>
                                
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 text-white text-base md:text-lg focus:outline-none focus:border-pink-500/50 transition-colors resize-none placeholder-white/20 font-light"
                                    placeholder={`Bhai, what should I do with ${selectedTool.label}? Enter details here...`}
                                />

                                {/* IMAGE UPLOAD */}
                                {['vision_scan', 'image_gen', 'logo_designer', 'invoice_gen'].includes(selectedTool.action) && (
                                    <div className="shrink-0 border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:bg-white/5 transition-colors cursor-pointer relative group h-24 md:h-32 flex flex-col items-center justify-center">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => setImage(ev.target?.result as string);
                                                    reader.readAsDataURL(e.target.files[0]);
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        {image ? (
                                            <div className="relative h-full w-full">
                                                <img src={image} className="h-full w-full object-contain" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Change Image</div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-xl md:text-2xl mb-1 opacity-50">📸</span>
                                                <div className="text-white/40 text-[10px] md:text-xs font-bold uppercase">Upload Source Image (Optional)</div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleExecute}
                                className="w-full py-4 md:py-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-2xl text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-lg shadow-purple-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 shrink-0"
                            >
                                <span>⚡</span> Run {selectedTool.label} Protocol
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <div className="text-6xl mb-6">🛠️</div>
                            <h3 className="text-2xl font-bold uppercase tracking-widest">Studio Idle</h3>
                            <p className="text-sm mt-2">Select an Expert Tool from the categories on the left.</p>
                        </div>
                    )}
                </div>
             </div>
             <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
             `}</style>
        </div>
    );
};
