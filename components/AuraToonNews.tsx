
import React, { useState, useEffect, useRef } from 'react';
import { Persona, ToonStory, ToonPanel } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface AuraToonNewsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CATEGORIES = [
    { id: 'tech', label: '🚀 Tech Toons', prompt: 'Latest technology and AI news' },
    { id: 'stock', label: '📈 Bullish Comics', prompt: 'Stock market and financial news' },
    { id: 'crime', label: '🕵️ Mystery News', prompt: 'True crime or mystery news' },
    { id: 'spirit', label: '☸️ Mystic Toons', prompt: 'Spiritual and wellness news' },
    { id: 'bollywood', label: '🎭 B-Town Gossip', prompt: 'Latest Bollywood and celebrity news' },
    { id: 'sports', label: '🏏 Sports Action', prompt: 'Cricket and global sports headlines' }
];

const TOON_STYLES = [
    { id: 'caricature', label: '🤡 Funny Caricature', prompt: 'Exaggerated funny features, long cartoonish nose, silly bulging eyes, wide toothy grin' },
    { id: 'superhero', label: '🦸 Clumsy Hero', prompt: 'Wearing a too-tight superhero suit, funny cape, heroically awkward poses' },
    { id: 'desi', label: '👳 Desi Funny', prompt: 'Classic Indian funny comic style, big mustache, colorful turban, energetic desi vibes' },
    { id: 'chibi', label: '👶 Grumpy Chibi', prompt: 'Very small body, huge angry cute head, funny baby-like proportions' },
    { id: 'cyberpunk', label: '🤖 Cyber-Toon', prompt: 'Neon glowing parts, robotic eyes, futuristic tech armor, vibrant cyber colors' },
    { id: 'manga', label: '🍥 Shonen Style', prompt: 'Classic manga action lines, spiked hair, intense determined eyes, energy aura' },
    { id: 'noir', label: '🕵️ Noir Detective', prompt: 'Black and white with one accent color, fedora, dramatic shadows, mysterious vibe' },
    { id: 'watercolor', label: '🎨 Soft Sketch', prompt: 'Hand-drawn watercolor aesthetic, soft pastels, artistic and messy lines' },
    { id: 'pixel', label: '👾 8-Bit Retro', prompt: 'Pixel art style, chunky blocks, limited color palette, classic game vibe' },
    { id: 'paper', label: '✂️ Paper Cutout', prompt: 'Flat paper cutout style, visible scissors lines, shadow-box depth' }
];

export const AuraToonNews: React.FC<AuraToonNewsProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeCategory, setActiveCategory] = useState('tech');
    const [language, setLanguage] = useState('Hinglish');
    const [activeStyle, setActiveStyle] = useState(TOON_STYLES[0]);
    const [story, setStory] = useState<ToonStory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [userToonDesc, setUserToonDesc] = useState<string | null>(null);
    const [isToonLabOpen, setIsToonLabOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedDesc = localStorage.getItem('user_toon_description');
        const savedStyle = localStorage.getItem('user_toon_style');
        if (savedDesc) setUserToonDesc(savedDesc);
        if (savedStyle) {
            const found = TOON_STYLES.find(s => s.id === savedStyle);
            if (found) setActiveStyle(found);
        }
    }, []);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsLoading(true);
        setStatusText("Mapping your funny face...");
        
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            { inlineData: { mimeType: file.type, data: base64 } },
                            { text: `Analyze this person's face. Describe them for a funny comic artist. ${activeStyle.prompt}. Focus on distinct features (hair, glasses, chin) and make them hilariously exaggerated. OUTPUT 20 WORDS.` }
                        ]
                    }
                });
                const desc = response.text || "Funny guy with big hair and a huge smile";
                setUserToonDesc(desc);
                localStorage.setItem('user_toon_description', desc);
                localStorage.setItem('user_toon_style', activeStyle.id);
                setStatusText("Aura has saved your toon DNA! 🧬");
                setTimeout(() => {
                    setIsLoading(false);
                    setIsToonLabOpen(false);
                }, 1500);
            };
            reader.readAsDataURL(file);
        } catch (e) {
            alert("Toonification failed!");
            setIsLoading(false);
        }
    };

    const fetchToonNews = async (catId: string) => {
        setIsLoading(true);
        setStory(null);
        setStatusText("Fetching Hilarious Headlines...");
        setActiveCategory(catId);

        try {
            const cat = CATEGORIES.find(c => c.id === catId);
            const userRef = userToonDesc ? `USER CHARACTER BASE: ${userToonDesc}. STYLE: ${activeStyle.label}.` : `USER CHARACTER: A person matching ${activeStyle.label} style.`;
            const auraRef = `Aura Character: ${currentPersona.visualPrompt}. Aura is a goofy futuristic bestie.`;

            setStatusText("Scripting your 4-panel adventure...");
            const scriptResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `
                TOPIC: ${cat?.prompt}. LANGUAGE: ${language}.
                
                STORY CORE:
                Aura (${auraRef}) and User (${userRef}) are reacting to real news in a goofy, "Talking Tom" slapstick style.
                
                CRITICAL INSTRUCTION: Make the comic HILARIOUS and PHYSICAL. Use visual gags (slipping on banana peel, steam from ears, eyes popping out).
                The story must be based on REAL news headlines found from Google Search.
                
                PANELS:
                Panel 1: News Discovery. Shocking reaction.
                Panel 2: Mishap/Confusion. User tries to handle the situation.
                Panel 3: Fact Drop. Aura explains the real news while chaos happens.
                Panel 4: Result/Moral. Epic fail or win.
                
                OUTPUT ONLY JSON.`,
                config: {
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            panels: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        userPose: { type: Type.STRING },
                                        auraPose: { type: Type.STRING },
                                        sceneDescription: { type: Type.STRING },
                                        narration: { type: Type.STRING },
                                        speechBubble: { type: Type.STRING },
                                        actionEffect: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        required: ['title', 'summary', 'panels']
                    }
                }
            });

            const script = JSON.parse(scriptResponse.text || "{}");
            
            const panels: ToonPanel[] = [];
            for (let i = 0; i < script.panels.length; i++) {
                setStatusText(`Drawing Panel ${i + 1}: ${script.panels[i].actionEffect || 'ZAP'}!`);
                const p = script.panels[i];
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: `
                    ART STYLE: ${activeStyle.prompt}. High-Quality 3D Character Design. Vibrant, very funny.
                    USER CHARACTER: ${userToonDesc || 'Funny person'}. POSE: ${p.userPose}.
                    AURA CHARACTER: ${currentPersona.visualPrompt}. POSE: ${p.auraPose}.
                    SCENE: ${p.sceneDescription}.
                    CARICATURE: Exaggerate everything hilariously. 8k, cinematic lighting.`,
                    config: { imageConfig: { aspectRatio: "1:1" } }
                });

                let panelImageUrl = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop";
                for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        panelImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                        break;
                    }
                }

                panels.push({
                    id: `p${i}`,
                    imageUrl: panelImageUrl,
                    narration: p.narration,
                    speechBubble: p.speechBubble,
                    actionEffect: p.actionEffect
                });
            }

            setStory({
                id: Date.now().toString(),
                title: script.title,
                summary: script.summary,
                category: catId,
                panels
            });
            
        } catch (e) {
            console.error(e);
            setStatusText("Comic book jam! Re-starting...");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] bg-[#fffbf0] flex flex-col font-sans text-black overflow-hidden animate-in zoom-in duration-300 print-root">
            {/* HEADER */}
            <div className="h-20 bg-pink-600 border-b-4 border-black px-4 md:px-8 flex justify-between items-center shrink-0 z-50 shadow-[0_4px_0_black] print-hide">
                <div className="flex items-center gap-4">
                    <div className="bg-yellow-400 text-black px-4 py-2 rotate-[-2deg] font-black text-lg md:text-2xl shadow-[4px_4px_0_black] border-4 border-black uppercase italic">Toon Chronicle</div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsToonLabOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black border-2 border-black rounded-full font-black text-[10px] shadow-[3px_3px_0_black] hover:translate-y-[-1px] transition-all">
                        🎭 TOON LAB
                    </button>
                    <button onClick={onClose} className="w-10 h-10 bg-black text-white border-2 border-white rounded-xl flex items-center justify-center font-black hover:bg-red-500 transition-all">✕</button>
                </div>
            </div>

            {/* TOON LAB MODAL */}
            {isToonLabOpen && (
                <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 print-hide">
                    <div className="bg-white border-8 border-black p-6 md:p-10 rounded-[40px] max-w-2xl w-full shadow-[15px_15px_0_#facc15] animate-in slide-in-from-bottom-12 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-pink-600 italic">Toon DNA Lab</h2>
                                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-1">Select your 10+ visual style</p>
                            </div>
                            <button onClick={() => setIsToonLabOpen(false)} className="text-4xl font-black">×</button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {TOON_STYLES.map(style => (
                                <button 
                                    key={style.id} 
                                    onClick={() => setActiveStyle(style)} 
                                    className={`p-3 border-4 border-black rounded-2xl text-[9px] font-black uppercase transition-all flex flex-col items-center gap-1 ${activeStyle.id === style.id ? 'bg-pink-500 text-white shadow-[4px_4px_0_black] scale-105' : 'bg-gray-100 hover:bg-white'}`}
                                >
                                    <span className="text-xl">{style.label.split(' ')[0]}</span>
                                    <span>{style.label.split(' ').slice(1).join(' ')}</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-black text-white border-4 border-black font-black uppercase text-xs tracking-[0.2em] shadow-[6px_6px_0_pink] hover:translate-y-[-2px] transition-all active:translate-y-1">
                                📸 SNAP YOUR FACE
                            </button>
                            <p className="text-[9px] text-center text-black/40 font-bold uppercase italic">Aura will caricaturize your face into the selected style!</p>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                    </div>
                </div>
            )}

            {/* MAIN CANVAS */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#fcf8e8] print-container">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-10 print-hide">
                        <div className="w-32 h-32 md:w-48 md:h-48 border-[12px] md:border-[16px] border-black border-t-pink-500 rounded-full animate-spin"></div>
                        <p className="text-3xl md:text-5xl font-black uppercase italic animate-pulse px-4">{statusText}</p>
                    </div>
                ) : !story ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto text-center space-y-8 animate-in fade-in duration-700 h-full">
                        <div className="text-8xl animate-bounce">💥</div>
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">World News Comicified</h2>
                            <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-2">Turning boring news into Slapstick gold!</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => setActiveCategory(cat.id)} 
                                    className={`px-4 py-4 rounded-[1.5rem] text-[10px] font-black uppercase border-4 transition-all ${activeCategory === cat.id ? 'bg-black text-white border-black scale-105 shadow-[6px_6px_0_pink]' : 'bg-white border-black/10 text-black/40 hover:border-black'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => fetchToonNews(activeCategory)} 
                            className="w-full h-20 md:h-24 bg-pink-500 border-8 border-black rounded-[2.5rem] text-white font-black uppercase tracking-[0.4em] text-lg shadow-[12px_12px_0_black] hover:translate-y-[-5px] active:translate-y-2 transition-all"
                        >
                            MATERIALIZE COMIC ⚡
                        </button>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-12 pb-24 print-story">
                        <div className="text-center relative py-6 print-title">
                            <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter text-black border-b-8 border-black pb-6 italic break-words">
                                {story.title}
                            </h1>
                            <div className="absolute -top-4 -right-4 bg-yellow-400 border-4 border-black px-4 py-2 rotate-12 font-black text-xs uppercase shadow-[4px_4px_0_black] print-hide">
                                {story.category.toUpperCase()} EDITION
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 print-grid">
                            {story.panels.map((panel, idx) => (
                                <div key={panel.id} className="bg-white border-8 border-black p-4 md:p-6 shadow-[15px_15px_0_black] flex flex-col relative print-panel group">
                                    <div className="relative aspect-square mb-6 overflow-hidden border-4 border-black bg-gray-50">
                                        <img src={panel.imageUrl} alt={`Panel ${idx+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        
                                        {/* Action Bubble */}
                                        <div className="absolute top-4 left-4 bg-yellow-400 border-4 border-black px-4 md:px-6 py-2 md:py-3 font-black text-xl md:text-3xl uppercase -rotate-6 shadow-[4px_4px_0_black]">
                                            {panel.actionEffect || 'ZAP'}!
                                        </div>
                                        
                                        {/* Speech Bubble */}
                                        <div className="absolute bottom-4 right-4 max-w-[85%] bg-white border-4 border-black p-4 md:p-5 rounded-[30px] rounded-br-none shadow-xl transform transition-transform group-hover:scale-105">
                                            <p className="text-[10px] md:text-xs font-black italic leading-tight">"{panel.speechBubble}"</p>
                                        </div>
                                        
                                        {/* Panel Number */}
                                        <div className="absolute bottom-4 left-4 w-10 h-10 md:w-14 md:h-14 bg-black text-white rounded-full flex items-center justify-center font-black text-xl md:text-2xl border-4 border-white shadow-lg">
                                            {idx + 1}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-black/5 p-4 border-4 border-black rounded-2xl">
                                        <p className="text-[10px] md:text-xs font-bold italic leading-relaxed">
                                            <span className="font-black uppercase text-pink-600 mr-2">Narration:</span> {panel.narration}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comic Footer / Summary */}
                        <div className="bg-white border-[8px] border-black p-8 md:p-12 rounded-[50px] shadow-[20px_20px_0_#ec4899] print-footer relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none">
                                <span className="text-9xl font-black">AURA</span>
                            </div>
                            
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-600 mb-6 border-l-8 border-pink-500 pl-4">Neural Chronicle Summary</h3>
                            <p className="text-xl md:text-4xl font-black italic leading-tight text-black">"{story.summary}"</p>
                            
                            <div className="mt-12 flex flex-wrap gap-4 print-hide">
                                <button onClick={() => setStory(null)} className="flex-1 md:flex-none px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0_pink] hover:translate-y-[-2px] transition-all">NEW CHRONICLE</button>
                                <button onClick={handlePrint} className="flex-1 md:flex-none px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0_black] hover:translate-y-[-2px] transition-all">PRINT COMIC</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: black; border-radius: 0; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                @media print {
                    .print-hide { display: none !important; }
                    .print-root { position: static !important; overflow: visible !important; background: white !important; }
                    .print-container { padding: 0 !important; width: 100% !important; overflow: visible !important; }
                    .print-panel { break-inside: avoid !important; box-shadow: none !important; margin-bottom: 2rem !important; }
                    .print-grid { display: block !important; }
                    .print-footer { border-radius: 20px !important; box-shadow: none !important; border-width: 4px !important; }
                }
            `}</style>
        </div>
    );
};
