
import React, { useState, useEffect, useRef } from 'react';
import { Persona } from '../types';
import { generateCreativeContent, generatePodcastScript, generateMultiSpeakerAudio } from '../services/geminiService';

interface AuraNewsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

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

export const AuraNews: React.FC<AuraNewsProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeCategory, setActiveCategory] = useState('global_headlines');
    const [searchTopic, setSearchTopic] = useState("");
    const [newsContent, setNewsContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
    const [isVocalizing, setIsVocalizing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string>('COPY HTML');
    
    const audioRef = useRef<HTMLAudioElement>(null);
    const categoryMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !newsContent) fetchNews('global_headlines', language);
        
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
                setIsCategoryMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const fetchNews = async (catId: string, lang: 'English' | 'Hindi', custom?: string) => {
        setActiveCategory(catId);
        setIsLoading(true);
        setAudioUrl(null);
        setIsCategoryMenuOpen(false);
        
        try {
            const category = ALL_CATEGORIES.find(c => c.id === catId);
            const topicToFetch = custom || searchTopic || category?.prompt;
            
            const langInstruction = lang === 'Hindi' 
                ? "STRICT COMMAND: Generate content in HINDI using DEVANAGARI script. Layout must feel like a traditional Hindi daily." 
                : "STRICT COMMAND: Generate content in professional British English journalistic style.";

            const finalPrompt = `
            TASK: Generate a high-density broadsheet newspaper layout for "Royal Bulls Gazette".
            PUBLISHER: Royal Bulls Advisory Private Limited (Estd. 2020).
            ${langInstruction}
            TOPIC: ${topicToFetch}
            
            HTML/STYLE REQUIREMENTS:
            1. Wrap each article in an <article> tag with class "news-article mb-10 break-inside-avoid".
            2. Use <h1> for main lead, <h2> for sub-stories.
            3. Use <img> with robust Unsplash patterns:
               - Finance/Market: https://images.unsplash.com/photo-1611974714024-15fec91ba73a?w=800
               - Tech/AI: https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800
               - General: https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800
            4. Include a dedicated editorial column: "Aura's Perspective".
            5. Ensure the structure is responsive using standard Tailwind classes provided in the parent container.
            
            OUTPUT RAW HTML BODY ONLY.
            `;

            const result = await generateCreativeContent('news_reporter', finalPrompt, currentPersona, undefined, { language: lang });
            setNewsContent(result.code || result.text);
        } catch (e) {
            setNewsContent("<div class='p-12 text-center text-red-600 font-bold'>Materialization Failed. Re-syncing with satellite...</div>");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBroadcast = async () => {
        if (!newsContent) return;
        setIsVocalizing(true);
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newsContent;
            const text = tempDiv.innerText.substring(0, 1000);
            const podcast = await generatePodcastScript(`Discuss this news: ${text}`, language);
            const url = await generateMultiSpeakerAudio(podcast.text);
            setAudioUrl(url);
            setTimeout(() => audioRef.current?.play(), 500);
        } catch (e) {
            alert("Broadcast tower busy.");
        } finally {
            setIsVocalizing(false);
        }
    };

    const getFullHTMLTemplate = () => {
        return `
        <!DOCTYPE html>
        <html lang="${language === 'Hindi' ? 'hi' : 'en'}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
            <style>
                body { background: #f4f1ea; font-family: 'Playfair Display', serif; padding: 2rem; color: #1a1a1a; margin: 0; }
                .broadsheet { max-width: 1200px; margin: auto; border: 4px double #1a1a1a; padding: 3rem; background: #f4f1ea; }
                .news-article { break-inside: avoid; border-bottom: 1px solid #ddd; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
                img { width: 100%; height: auto; border: 2px solid #000; margin-bottom: 1rem; filter: grayscale(1); }
                h1 { font-size: 3rem; font-weight: 900; line-height: 1; margin-bottom: 1rem; border-bottom: 4px solid black; }
                h2 { font-size: 1.5rem; font-weight: 900; background: black; color: white; padding: 0.25rem 0.5rem; display: inline-block; margin-bottom: 1rem; }
                p { line-height: 1.7; font-size: 1.125rem; margin-bottom: 1.5rem; text-align: justify; }
                @media (max-width: 768px) { .broadsheet { padding: 1.5rem; } h1 { font-size: 2rem; } }
            </style>
        </head>
        <body>
            <div class="broadsheet">
                <header style="text-align: center; border-bottom: 8px solid black; padding-bottom: 2rem; margin-bottom: 3rem;">
                    <h1 style="border: none; font-size: 5rem; margin-bottom: 0.5rem;">ROYAL BULLS GAZETTE</h1>
                    <div style="display: flex; justify-content: space-between; border-top: 2px solid black; padding-top: 1rem; font-weight: bold; font-size: 0.75rem;">
                        <span>ESTABLISHED 2020</span>
                        <span>${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>NEURAL EDITION</span>
                    </div>
                </header>
                ${newsContent}
                <footer style="margin-top: 4rem; border-top: 4px solid black; padding-top: 2rem; font-size: 0.75rem; opacity: 0.7;">
                    <p>© ROYAL BULLS ADVISORY PRIVATE LIMITED. GENERATED BY AURA NEURAL OS.</p>
                </footer>
            </div>
        </body>
        </html>`;
    };

    const handleDownloadHTML = () => {
        const fullHTML = getFullHTMLTemplate();
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Royal_Bulls_Gazette_${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyHTML = async () => {
        const fullHTML = getFullHTMLTemplate();
        try {
            await navigator.clipboard.writeText(fullHTML);
            setCopyStatus('COPIED! ✅');
            setTimeout(() => setCopyStatus('COPY HTML'), 2000);
        } catch (err) {
            alert("Failed to copy HTML.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-[#e5e1d8] flex flex-col font-serif text-[#1a1a1a] overflow-hidden animate-in slide-in-from-right duration-500 pt-[var(--sat)]">
            
            {/* NEWSPAPER BAR (UTILITY) */}
            <div className="bg-[#121214] text-white px-4 md:px-6 py-3 border-b border-white/10 z-[100] flex justify-between items-center shadow-xl shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-black text-lg md:text-xl">RB</div>
                    <div className="hidden sm:block">
                        <h1 className="text-[10px] md:text-xs font-black uppercase tracking-tighter">Royal Bulls Gazette</h1>
                        <p className="text-[7px] md:text-[8px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Neural Awareness Network</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-white/5 p-1 rounded-xl flex border border-white/10">
                        <button onClick={() => { setLanguage('English'); fetchNews(activeCategory, 'English'); }} className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${language === 'English' ? 'bg-white text-black' : 'text-white/40'}`}>EN</button>
                        <button onClick={() => { setLanguage('Hindi'); fetchNews(activeCategory, 'Hindi'); }} className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${language === 'Hindi' ? 'bg-white text-black' : 'text-white/40'}`}>HI</button>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500 rounded-xl transition-all">✕</button>
                </div>
            </div>

            {/* QUICK ACTIONS BAR - Fixed Overflow & Touch */}
            <div className="h-14 bg-black text-white/60 flex items-center justify-start md:justify-center gap-4 md:gap-6 px-4 md:px-8 shrink-0 z-50 border-b border-white/5 overflow-x-auto no-scrollbar touch-pan-x">
                <button onClick={handleBroadcast} disabled={isVocalizing} className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:text-yellow-500 transition-all shrink-0 whitespace-nowrap">
                    🎙️ {isVocalizing ? 'SYNCING...' : 'PODCAST'}
                </button>
                <div className="h-4 w-[1px] bg-white/10 shrink-0"></div>
                <button onClick={handleCopyHTML} className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:text-pink-400 transition-all shrink-0 whitespace-nowrap">
                    📄 {copyStatus}
                </button>
                <div className="h-4 w-[1px] bg-white/10 shrink-0"></div>
                <button onClick={handleDownloadHTML} className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:text-blue-400 transition-all shrink-0 whitespace-nowrap">
                    💾 DOWNLOAD
                </button>
                <div className="h-4 w-[1px] bg-white/10 shrink-0"></div>
                <button onClick={() => { setSearchTopic(""); fetchNews('global_headlines', language); }} className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:text-emerald-400 transition-all shrink-0 whitespace-nowrap">
                    🔄 REFRESH
                </button>
                {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
            </div>

            {/* SEARCH & CATEGORY NAV - Responsive Padding */}
            <div className="p-3 md:p-4 bg-[#f4f1ea] border-b border-black/10 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 shrink-0 shadow-inner">
                <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-full">
                    {ALL_CATEGORIES.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => fetchNews(cat.id, language)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase transition-all border ${activeCategory === cat.id ? 'bg-black text-white border-black shadow-lg' : 'bg-transparent border-black/10 text-black/60 hover:bg-black/5'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
                <div className="w-full md:w-64 relative group">
                    <input 
                        type="text" 
                        value={searchTopic}
                        onChange={(e) => setSearchTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchNews('custom', language)}
                        placeholder="Search Deep Topic..."
                        className="w-full bg-white border border-black/20 rounded-full px-5 py-2 text-[11px] md:text-xs focus:outline-none focus:border-black transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">🔍</span>
                </div>
            </div>

            {/* E-PAPER CANVAS - Safe Area Aware & Horizontal Scroll Fixed */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#e5e1d8] relative custom-scrollbar scroll-smooth">
                {/* LOADER */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f1ea]/80 backdrop-blur-sm z-[200]">
                        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-black/10 border-t-yellow-600 rounded-full animate-spin"></div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-8 text-black/60 animate-pulse text-center px-4">Neural Materialization...</p>
                    </div>
                )}

                <div className="w-full max-w-6xl mx-auto bg-[#f4f1ea] px-4 md:px-16 py-8 md:py-20 shadow-2xl border-x-0 md:border-x-[16px] border-y-4 md:border-y-[16px] border-double border-black min-h-full transition-all duration-700 relative box-border overflow-hidden">
                    
                    {/* MASTHEAD */}
                    <div className="flex flex-col sm:flex-row justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 mb-6 border-b-2 border-black pb-3 gap-2">
                        <span>Royal Bulls Advisory Pvt Ltd</span>
                        <span>{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="uppercase">{activeCategory.replace('_', ' ')} EDITION</span>
                    </div>

                    <header className="text-center mb-8 md:mb-12 border-b-4 md:border-b-8 border-black pb-6 md:pb-10">
                        <h2 className="text-[clamp(2rem,12vw,6.5rem)] font-black uppercase tracking-tighter leading-[0.8] text-black break-words">
                            {language === 'Hindi' ? 'रॉयल बुल्स गज़ट' : 'ROYAL BULLS GAZETTE'}
                        </h2>
                        <div className="flex flex-col md:flex-row justify-between border-t-2 border-black mt-6 md:mt-8 pt-4 text-[9px] md:text-[11px] font-black uppercase tracking-widest italic opacity-70 gap-2">
                            <span>INDIA'S PREMIER KNOWLEDGE NETWORK</span>
                            <span className="hidden md:inline">PRICE: ₹ NEURAL CREDIT</span>
                            <span>MUMBAI • NEW DELHI • BEYOND</span>
                        </div>
                    </header>

                    {/* DYNAMIC CONTENT GRID */}
                    {!newsContent && !isLoading ? (
                        /* INITIAL PLACEHOLDERS */
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-12 opacity-20">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="mb-10 break-inside-avoid w-full">
                                    <div className="h-4 bg-black mb-4 w-3/4"></div>
                                    <div className="h-3 bg-black mb-2 w-full"></div>
                                    <div className="h-3 bg-black mb-2 w-full"></div>
                                    <div className="h-3 bg-black mb-6 w-1/2"></div>
                                    <div className="aspect-video bg-black/40 w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div 
                            className={`news-content columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-12 column-fill-auto font-serif text-justify text-black w-full overflow-hidden
                                prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:font-black prose-h1:mb-4 md:prose-h1:mb-6 prose-h1:border-b-4 prose-h1:border-black prose-h1:leading-none
                                prose-h2:text-xl md:prose-h2:text-2xl prose-h2:font-black prose-h2:mt-6 md:prose-h2:mt-10 prose-h2:mb-4 prose-h2:bg-black prose-h2:text-white prose-h2:px-2 prose-h2:inline-block
                                prose-h3:text-lg md:prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 md:prose-h3:mt-8 prose-h3:border-b prose-h3:border-black/20 prose-h3:mb-4
                                prose-p:mb-4 md:prose-p:mb-6 prose-p:leading-[1.7] prose-p:text-base md:prose-p:text-lg
                                prose-img:max-w-full prose-img:h-auto prose-img:rounded-none prose-img:border-2 prose-img:border-black prose-img:mb-4 md:prose-img:mb-6 prose-img:grayscale
                                first-letter:text-6xl md:first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2
                                ${language === 'Hindi' ? 'leading-relaxed text-lg md:text-xl' : ''}`}
                            dangerouslySetInnerHTML={{ __html: newsContent }}
                        />
                    )}

                    {/* BROADSHEET FOOTER */}
                    <footer className="mt-16 md:mt-24 border-t-4 md:border-t-8 border-black pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
                        <div className="max-w-md">
                            <p className="mb-2 md:mb-4 font-bold">© ROYAL BULLS ADVISORY PRIVATE LIMITED (ESTD. 2020)</p>
                            <p className="leading-relaxed">
                                A registered entity under the Ministry of Corporate Affairs, Government of India. 
                                Pioneering digital transformation and neural awareness protocols across the Indian subcontinent.
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="mb-1 md:mb-2">PRODUCTION: RB-X-GAZETTE-101</p>
                            <p>DESIGNED BY AURA NEURAL OS V4.0</p>
                        </div>
                    </footer>
                </div>
            </div>

            {/* SAFE AREA BOTTOM PADDING - Optimized for Mobile Browsers */}
            <div className="h-[var(--sab)] bg-[#f4f1ea] shrink-0 border-t border-black/5"></div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                .news-content article { 
                    break-inside: avoid-column; 
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    padding-bottom: 2rem;
                    margin-bottom: 2rem;
                    width: 100%;
                }

                /* Mobile Optimization: Force Single Column & Prevent Horizontal Drift */
                @media (max-width: 767px) { 
                    .news-content { 
                        column-count: 1 !important; 
                        display: block;
                        width: 100%;
                    } 
                    .news-content p {
                        text-align: left; /* Better readability on small screens */
                    }
                    .news-content h1 {
                        font-size: 2.25rem !important;
                    }
                }

                /* Safe Area Side Padding */
                @supports (padding: env(safe-area-inset-left)) {
                    .fixed {
                        padding-left: env(safe-area-inset-left);
                        padding-right: env(safe-area-inset-right);
                    }
                }
            `}</style>
        </div>
    );
};
