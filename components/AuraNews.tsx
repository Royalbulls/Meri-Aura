
import React, { useState, useEffect, useRef } from 'react';
import { Persona } from '../types';
import { generateSpeechDownloadUrl } from '../services/geminiService';
import { GoogleGenAI, Type } from "@google/genai";

interface NewsArticle {
    title: string;
    content: string;
    imageUrl: string;
    summary: string;
}

interface AuraNewsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ALL_CATEGORIES = [
    { id: 'global_headlines', label: '🌍 Global Headlines', prompt: 'Major international news and shifts.' },
    { id: 'indian_national', label: '🇮🇳 Indian National', prompt: 'National news from India.' },
    { id: 'startup_funding', label: '🚀 Startup Funding', prompt: 'Latest in venture capital and funding news.' },
    { id: 'stock_market', label: '📈 Stock Market', prompt: 'NSE/BSE and global market trends.' },
    { id: 'fintech_edge', label: '💳 FinTech & UPI', prompt: 'UPI, digital payments, and neo-banking news in India.' },
    { id: 'cyber_safety', label: '🛡️ Cyber Awareness', prompt: 'Awareness on scams, phishing, and online safety protocols.' },
    { id: 'ai_ethics', label: '🤖 AI & Future', prompt: 'Developments in artificial intelligence and automation.' },
    { id: 'govt_schemes', label: '🏛️ Govt Policies', prompt: 'New government policies, GST, and welfare updates.' },
];

const FAMOUS_ERAS = [
    { topic: "Titanic Sinking", date: "April 15, 1912", label: "🚢 1912 Titanic" },
    { topic: "Apollo 11 Moon Landing", date: "July 20, 1969", label: "🌕 1969 Moon" },
    { topic: "End of WWII", date: "September 2, 1945", label: "🪖 1945 WWII" },
    { topic: "Industrial Revolution", date: "June 1850", label: "🏭 1850 Steam" }
];

export const AuraNews: React.FC<AuraNewsProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeCategory, setActiveCategory] = useState('global_headlines');
    const [searchTopic, setSearchTopic] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
    const [playingArticleIdx, setPlayingArticleIdx] = useState<number | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    const fetchNews = async (catId: string, lang: 'English' | 'Hindi', customTopic?: string, customDate?: string) => {
        setActiveCategory(catId);
        setIsLoading(true);
        setArticles([]);
        setAudioUrl(null);
        setPlayingArticleIdx(null);
        setIsSearchOpen(false);

        try {
            const category = ALL_CATEGORIES.find(c => c.id === catId);
            const topicToFetch = customTopic || category?.prompt;
            const dateToSimulate = customDate || "Today";

            const langInstruction = lang === 'Hindi'
                ? "Generate content in HINDI using DEVANAGARI script."
                : "Generate content in professional British English journalistic style.";

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `
                TASK: Generate news articles for "Royal Bulls Gazette".
                PUBLISHER: Royal Bulls Advisory Private Limited (Estd. 2020).
                DATE: ${dateToSimulate}
                ${langInstruction}
                TOPIC: ${topicToFetch}
                
                REQUIREMENTS:
                1. Generate at least 5 news stories.
                2. Each story must have a title, content (paragraphs), an image description for Unsplash, and a 1-sentence summary.
                3. If a past date is provided (${dateToSimulate}), report AS IF it is that day.
                
                OUTPUT JSON FORMAT:
                { "articles": [{ "title": "...", "content": "...", "imageUrl": "unsplash_keyword_only", "summary": "..." }] }
                `,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            articles: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        content: { type: Type.STRING },
                                        imageUrl: { type: Type.STRING },
                                        summary: { type: Type.STRING }
                                    },
                                    required: ['title', 'content', 'imageUrl', 'summary']
                                }
                            }
                        },
                        required: ['articles']
                    }
                }
            });

            const data = JSON.parse(response.text || '{"articles": []}');
            const processedArticles = data.articles.map((art: any) => ({
                ...art,
                imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80&q=${encodeURIComponent(art.imageUrl)}`
            }));
            setArticles(processedArticles);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const playArticleAudio = async (idx: number) => {
        if (playingArticleIdx === idx) {
            stopAudio();
            return;
        }

        const article = articles[idx];
        if (!article) return;

        stopAudio();
        setPlayingArticleIdx(idx);

        try {
            const textToRead = `${article.title}. ${article.content}`;
            const url = await generateSpeechDownloadUrl(textToRead, currentPersona.voiceName);
            setAudioUrl(url);
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play();
                }
            }, 100);
        } catch (e) {
            console.error("Audio failed", e);
            setPlayingArticleIdx(null);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setAudioUrl(null);
        setPlayingArticleIdx(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-[#e5e1d8] flex flex-col font-serif text-[#1a1a1a] overflow-x-hidden animate-in slide-in-from-right duration-500">

            {/* NEWSPAPER BAR (UTILITY) */}
            <div className="bg-[#121214] text-white px-4 md:px-6 py-3 border-b border-white/10 z-[100] flex justify-between items-center shadow-xl shrink-0 pt-[var(--sat)]">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-black text-lg md:text-xl shrink-0">RB</div>
                    <div className="hidden sm:block text-left">
                        <h1 className="text-[10px] md:text-xs font-black uppercase tracking-tighter">Royal Bulls Gazette</h1>
                        <p className="text-[7px] md:text-[8px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Neural Awareness Network</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-white/5 p-1 rounded-xl flex border border-white/10">
                        <button onClick={() => setLanguage('English')} className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${language === 'English' ? 'bg-white text-black' : 'text-white/40'}`}>EN</button>
                        <button onClick={() => setLanguage('Hindi')} className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${language === 'Hindi' ? 'bg-white text-black' : 'text-white/40'}`}>HI</button>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500 rounded-xl transition-all shrink-0">✕</button>
                </div>
            </div>

            {/* QUICK ACTIONS BAR */}
            {articles.length > 0 && (
                <div className="h-14 bg-black text-white/60 flex items-center justify-start md:justify-center gap-4 md:gap-6 px-4 md:px-8 shrink-0 z-50 border-b border-white/5 overflow-x-auto no-scrollbar touch-pan-x">
                    <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap ${isSearchOpen ? 'text-yellow-500' : 'hover:text-white'}`}>
                        🔍 {isSearchOpen ? 'CLOSE SEARCH' : 'SEARCH ARCHIVES'}
                    </button>
                    <button onClick={() => { setArticles([]); setSearchTopic(''); setSearchDate(''); stopAudio(); }} className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:text-white transition-all shrink-0 whitespace-nowrap">
                        🆕 NEW EDITION
                    </button>
                    {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" onEnded={() => setPlayingArticleIdx(null)} />}
                </div>
            )}

            {/* INLINE SEARCH OVERLAY */}
            {isSearchOpen && (
                <div className="bg-black/95 p-4 md:p-6 border-b border-white/10 animate-in slide-in-from-top duration-300 z-[90]">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            value={searchTopic}
                            onChange={(e) => setSearchTopic(e.target.value)}
                            placeholder="New topic (e.g. Victorian London)..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-yellow-500"
                        />
                        <input
                            type="text"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            placeholder="Era/Date (e.g. June 1888)"
                            className="w-full md:w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-yellow-500"
                        />
                        <button
                            onClick={() => fetchNews(activeCategory, language, searchTopic, searchDate)}
                            className="bg-yellow-500 px-8 py-3 rounded-xl text-black font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 active:scale-95 transition-all"
                        >
                            MATERIALIZE NEW ERA ⚡
                        </button>
                    </div>
                </div>
            )}

            {/* E-PAPER CANVAS */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#e5e1d8] relative custom-scrollbar scroll-smooth flex flex-col items-center">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f1ea]/80 backdrop-blur-sm z-[200]">
                        <div className="w-16 h-16 border-4 border-black/10 border-t-yellow-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-8 text-black/60 animate-pulse">Printing Gazette...</p>
                    </div>
                )}

                {articles.length === 0 && !isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl text-center space-y-10 animate-in fade-in duration-700 w-full">
                        <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center text-5xl shadow-inner border border-black/5">📰</div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Neural News Materializer</h2>
                            <p className="text-xs font-bold text-black/50 leading-relaxed uppercase tracking-widest">Architect your own edition. Search any topic or travel back in time.</p>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    value={searchTopic}
                                    onChange={(e) => setSearchTopic(e.target.value)}
                                    placeholder="Enter topic (e.g. Moon Landing, AI Boom)..."
                                    className="flex-1 px-6 py-4 bg-white border-2 border-black rounded-2xl text-sm font-bold placeholder-black/30 outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all shadow-[4px_4px_0_black]"
                                />
                                <input
                                    type="text"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    placeholder="Date (e.g. July 1969)"
                                    className="w-full md:w-48 px-6 py-4 bg-white border-2 border-black rounded-2xl text-sm font-bold placeholder-black/30 outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all shadow-[4px_4px_0_black]"
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 opacity-40">Or Explore Famous Eras</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                                {FAMOUS_ERAS.map((era, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setSearchTopic(era.topic); setSearchDate(era.date); fetchNews('global_headlines', language, era.topic, era.date); }}
                                        className="px-3 py-3 rounded-xl text-[8px] font-black uppercase border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_black]"
                                    >
                                        {era.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full">
                            <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 opacity-40">Trending Niches</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                                {ALL_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setActiveCategory(cat.id); setSearchTopic(cat.label.split(' ').slice(1).join(' ')); }}
                                        className={`px-3 py-2.5 rounded-xl text-[8px] font-black uppercase border transition-all ${activeCategory === cat.id ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-black/10 text-black/40 hover:border-black'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => fetchNews(activeCategory, language, searchTopic, searchDate)}
                            className="w-full h-20 bg-yellow-500 border-4 border-black rounded-[2rem] text-black font-black uppercase tracking-[0.4em] shadow-[8px_8px_0_black] hover:translate-y-[-2px] hover:shadow-[12px_12px_0_black] active:translate-y-1 active:shadow-none transition-all"
                        >
                            MATERIALIZE GAZETTE ⚡
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-6xl mx-auto bg-[#f4f1ea] px-4 md:px-16 py-8 md:py-16 shadow-2xl border-x-0 md:border-x-[12px] border-y-4 md:border-y-[12px] border-double border-black min-h-full transition-all duration-700 relative box-border mt-8 mb-20 overflow-x-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 mb-6 border-b-2 border-black pb-3 gap-2">
                            <span>Royal Bulls Advisory Pvt Ltd</span>
                            <span>{searchDate || new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="uppercase">{searchTopic || activeCategory.replace('_', ' ')} EDITION</span>
                        </div>

                        <header className="text-center mb-8 md:mb-12 border-b-8 border-black pb-6 md:pb-10">
                            <h2 className="text-[clamp(1.75rem,8vw,5rem)] font-black uppercase tracking-tighter leading-[0.9] text-black break-words">
                                {language === 'Hindi' ? 'रॉयल बुल्स गज़ट' : 'ROYAL BULLS GAZETTE'}
                            </h2>
                        </header>

                        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-12 column-fill-auto font-serif text-justify text-black w-full">
                            {articles.map((art, idx) => (
                                <article key={idx} className="break-inside-avoid-column border-bottom border-black/10 pb-6 mb-6 group">
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <h1 className="text-xl md:text-2xl font-black leading-none uppercase tracking-tighter hover:text-yellow-600 transition-colors cursor-default">
                                            {art.title}
                                        </h1>
                                        <button
                                            onClick={() => playArticleAudio(idx)}
                                            className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 transition-all ${playingArticleIdx === idx ? 'bg-black text-white animate-pulse' : 'bg-white hover:bg-black hover:text-white'}`}
                                            title="Listen to Article"
                                        >
                                            {playingArticleIdx === idx ? '⏹' : '▶'}
                                        </button>
                                    </div>
                                    <img src={art.imageUrl} alt={art.title} className="w-full h-auto border border-black mb-4 aspect-video object-cover" />
                                    <div className={`text-sm md:text-base leading-relaxed ${language === 'Hindi' ? 'leading-loose' : ''}`}>
                                        <span className="text-4xl md:text-6xl font-black float-left mr-2 mt-1 leading-[1]">
                                            {art.content.charAt(0)}
                                        </span>
                                        {art.content.slice(1)}
                                    </div>
                                </article>
                            ))}
                        </div>

                        <footer className="mt-12 md:mt-16 border-t-4 md:border-t-8 border-black pt-8 flex flex-col md:flex-row justify-between items-start gap-8 text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
                            <div className="max-w-md text-left">
                                <p className="mb-2 font-bold">© ROYAL BULLS ADVISORY PRIVATE LIMITED (ESTD. 2020)</p>
                                <p className="text-[6px]">Simulated Neural Materialization. For archival purposes only.</p>
                            </div>
                            <div className="text-left md:text-right">
                                <p>DESIGNED BY AURA NEURAL OS V4.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
