
// Fix: Cleaned up unused and non-existent imports from geminiService to resolve build errors.
import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { generateCreativeContent } from '../services/geminiService';

interface AuraNewsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

const CATEGORIES = [
    { id: 'local', label: '📍 Local', prompt: 'Detect Location' },
    { id: 'headlines', label: '🌍 Global', prompt: 'Global Top Headlines and breaking news' },
    { id: 'tech', label: '🚀 Tech', prompt: 'AI, Space, and Startups' },
    { id: 'business', label: '💰 Business', prompt: 'Stock Market and Economy' },
];

export const AuraNews: React.FC<AuraNewsProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeCategory, setActiveCategory] = useState('headlines');
    const [newsContent, setNewsContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [tickerText, setTickerText] = useState("Aura Global News • Verified Data Streams Active...");
    
    // Audio States
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (isOpen && !newsContent) fetchNews('headlines');
        return () => { if (audioElement) audioElement.pause(); };
    }, [isOpen]);

    const fetchNews = async (catId: string) => {
        setActiveCategory(catId);
        setIsLoading(true);
        try {
            const category = CATEGORIES.find(c => c.id === catId);
            const result = await generateCreativeContent('news_reporter', category?.prompt || "Latest News", currentPersona);
            setNewsContent(result.code || result.text);
        } catch (e) {
            setNewsContent("<div class='p-4 text-red-400 font-bold'>OFFLINE: Signal Lost.</div>");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-[#fdfbf7] flex flex-col font-serif text-black animate-in slide-in-from-right duration-500">
            
            {/* IN-APP HEADER */}
            <div className="bg-[#1a1a1a] text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-black text-xs">AG</div>
                    <h1 className="text-lg font-black tracking-widest uppercase font-sans">Aura News</h1>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white px-3 py-1 bg-white/5 rounded-full text-xs font-bold font-sans uppercase">Close App</button>
            </div>

            {/* CATEGORY NAV */}
            <div className="bg-[#1a1a1a] border-t border-white/5 flex overflow-x-auto no-scrollbar px-2 shrink-0">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => fetchNews(cat.id)}
                        className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeCategory === cat.id ? 'border-red-600 text-white' : 'border-transparent text-white/30 hover:text-white'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* TICKER */}
            <div className="h-6 bg-red-600 flex items-center overflow-hidden relative z-20 shrink-0 shadow-lg">
                <div className="absolute left-0 top-0 bottom-0 bg-red-800 px-2 flex items-center z-10 font-bold text-[8px] uppercase text-white">Live</div>
                <div className="whitespace-nowrap animate-marquee pl-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider mx-4">{tickerText}</span>
                </div>
            </div>

            {/* MAIN NEWSPAPER CONTENT */}
            <div className="flex-1 overflow-y-auto relative bg-[#fdfbf7]">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-10">
                        <div className="w-12 h-12 border-4 border-black border-t-red-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">Syncing Satellite Feeds...</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-full">
                        <div className="hidden md:block mb-8 border-b-4 border-black pb-4 text-center">
                            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-1">AURA GLOBAL</h2>
                            <p className="text-xs font-bold uppercase tracking-[0.5em]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div 
                            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:font-serif"
                            dangerouslySetInnerHTML={{ __html: newsContent }}
                        />
                    </div>
                )}
            </div>

            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 30s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
