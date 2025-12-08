
import React, { useState, useRef } from 'react';
import { StudioTool, ComicLayout, ComicGenre, ComicLanguage } from '../types';
import { CREATIVE_TOOLS } from '../constants';

interface CreativeStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onToolSelect: (tool: StudioTool, input: string, imageInput?: string, option?: any) => void;
    isProcessing: boolean;
    onOpenLiveScanner?: () => void; // New prop for Live Scanner
}

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({ isOpen, onClose, onToolSelect, isProcessing, onOpenLiveScanner }) => {
    const [selectedTool, setSelectedTool] = useState<StudioTool | null>(null);
    const [input, setInput] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Comic Options
    const [comicLayout, setComicLayout] = useState<ComicLayout>('1-panel');
    const [comicGenre, setComicGenre] = useState<ComicGenre>('superhero');
    const [comicLanguage, setComicLanguage] = useState<ComicLanguage>('english');

    if (!isOpen) return null;

    const categories = ['all', ...Array.from(new Set(CREATIVE_TOOLS.map(t => t.category)))];
    const filteredTools = activeCategory === 'all' ? CREATIVE_TOOLS : CREATIVE_TOOLS.filter(t => t.category === activeCategory);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
        }
    };

    const handleSubmit = () => {
        if (!selectedTool) return;
        
        let options: any = undefined;
        if (selectedTool.action === 'comic') {
            options = {
                layout: comicLayout,
                genre: comicGenre,
                language: comicLanguage,
                sourcePages: 1,
                targetPages: 1
            };
        }

        onToolSelect(selectedTool, input, selectedImage || undefined, options);
        onClose();
        setInput('');
        setSelectedImage(null);
        setSelectedTool(null);
    };

    const needsImage = ['vastu_scan', 'vision_scan', 'ai_chef', 'edit_image', 'smart_measure'].includes(selectedTool?.action || '');
    const isLiveCapable = selectedTool?.action === 'smart_measure';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white">Creative Studio</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Categories */}
                    <div className="w-48 border-r border-white/10 p-4 bg-black/20 overflow-y-auto hidden md:block">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase mb-2 ${activeCategory === cat ? 'bg-pink-600 text-white' : 'text-white/50 hover:bg-white/5'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {!selectedTool ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredTools.map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => setSelectedTool(tool)}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-pink-500/50 transition-all text-left group"
                                    >
                                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{tool.icon}</div>
                                        <div className="font-bold text-sm text-white">{tool.label}</div>
                                        <div className="text-xs text-white/40 mt-1">{tool.description}</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-xl mx-auto space-y-6">
                                <button onClick={() => { setSelectedTool(null); setSelectedImage(null); }} className="text-xs text-pink-400 hover:text-pink-300 font-bold mb-4">← Back to Tools</button>
                                
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="text-4xl">{selectedTool.icon}</div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{selectedTool.label}</h3>
                                        <p className="text-white/50">{selectedTool.description}</p>
                                    </div>
                                </div>

                                {/* SPECIAL LIVE BUTTON FOR MEASUREMENT */}
                                {isLiveCapable && onOpenLiveScanner && (
                                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl mb-4 text-center">
                                        <p className="text-xs text-green-300 mb-3">⚡ For instant results, use Live Camera Mode.</p>
                                        <button 
                                            onClick={() => {
                                                onOpenLiveScanner();
                                                onClose();
                                            }}
                                            className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" /><path fillRule="evenodd" d="M9.375 3a1.875 1.875 0 00-1.875 1.875c0 1.035-.84 1.875-1.875 1.875h-3a1.875 1.875 0 00-1.875 1.875v9.75c0 1.036.84 1.875 1.875 1.875h14.25c1.035 0 1.875-.84 1.875-1.875v-9.75a1.875 1.875 0 00-1.875-1.875h-3c-1.035 0-1.875-.84-1.875-1.875A1.875 1.875 0 0014.625 3h-5.25z" clipRule="evenodd" /></svg>
                                            OPEN LIVE CAMERA SCANNER
                                        </button>
                                        <div className="my-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1"></div>
                                            <span className="text-[10px] text-white/30 uppercase">OR Upload Image</span>
                                            <div className="h-px bg-white/10 flex-1"></div>
                                        </div>
                                    </div>
                                )}

                                {/* INPUT AREA */}
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-2 uppercase">
                                        {selectedTool.action === 'live_vastu' ? 'Notes about your spot (Optional)' : 'Input / Prompt'}
                                    </label>
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
                                        placeholder={
                                            selectedTool.action === 'live_vastu' 
                                            ? "E.g., I am facing North, the entrance is behind me..." 
                                            : needsImage ? `Describe what you want to analyze...` : `Enter details for ${selectedTool.label}...`
                                        }
                                    />
                                </div>

                                {/* IMAGE UPLOAD FOR SUPPORTED TOOLS */}
                                {needsImage && (
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Upload Image (Required)</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${selectedImage ? 'border-green-500 bg-green-900/10' : 'border-white/10 hover:border-white/30 bg-black/20'}`}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleImageUpload} 
                                                accept="image/*"
                                                className="hidden" 
                                            />
                                            {selectedImage ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={selectedImage} alt="Preview" className="h-20 object-contain mb-2 rounded" />
                                                    <span className="text-xs text-green-400 font-bold">Image Selected</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-white/40">
                                                    <span className="text-2xl mb-2">📸</span>
                                                    <span className="text-xs">Click to Upload Photo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* COMIC OPTIONS */}
                                {selectedTool.action === 'comic' && (
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl">
                                         {/* Layout Selection */}
                                         <div>
                                             <label className="text-[10px] font-bold text-yellow-500/80 mb-2 block uppercase tracking-wider">Comic Layout</label>
                                             <select
                                                value={comicLayout}
                                                onChange={(e) => setComicLayout(e.target.value as ComicLayout)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                                             >
                                                 <option value="1-panel">Single Splash</option>
                                                 <option value="3-panel-strip">3-Panel Strip</option>
                                                 <option value="4-panel-grid">4-Panel Grid</option>
                                                 <option value="manga-page">Manga Page</option>
                                             </select>
                                         </div>

                                         {/* Genre Selection */}
                                         <div>
                                             <label className="text-[10px] font-bold text-cyan-500/80 mb-2 block uppercase tracking-wider">Genre</label>
                                             <select
                                                value={comicGenre}
                                                onChange={(e) => setComicGenre(e.target.value as ComicGenre)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                                             >
                                                 <option value="superhero">Superhero</option>
                                                 <option value="manga">Manga</option>
                                                 <option value="noir">Noir</option>
                                                 <option value="retro">Retro</option>
                                                 <option value="cyberpunk">Cyberpunk</option>
                                                 <option value="fantasy">Fantasy</option>
                                                 <option value="comedy">Comedy</option>
                                             </select>
                                         </div>

                                         {/* Language Selection */}
                                         <div>
                                             <label className="text-[10px] font-bold text-green-500/80 mb-2 block uppercase tracking-wider">Language</label>
                                             <select
                                                value={comicLanguage}
                                                onChange={(e) => setComicLanguage(e.target.value as ComicLanguage)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                                             >
                                                 <option value="english">English</option>
                                                 <option value="hindi">Hindi</option>
                                                 <option value="hinglish">Hinglish</option>
                                                 <option value="japanese">Japanese</option>
                                                 <option value="spanish">Spanish</option>
                                             </select>
                                         </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={(needsImage && !selectedImage) || isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-pink-500/20 transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? 'Generating...' : `Run ${selectedTool.label}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
