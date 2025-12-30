
import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { generateCreativeContent } from '../services/geminiService';

interface AuraNewsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

const CATEGORIES = [
    { id: 'rba_updates', label: { English: '🏢 Company Updates', Hindi: '🏢 कंपनी अपडेट' }, prompt: 'RBA Advisor / Royal Bulls Advisory internal news, service launches, membership updates, and platform developments. Focus on building trust for PayU/Bank audits.' },
    { id: 'finance', label: { English: '💰 Finance & Banking', Hindi: '💰 बैंकिंग और फाइनेंस' }, prompt: 'Loan rules, bank interest rates, NBFC policy changes, EMI/Credit updates. Focus on mass audience pull.' },
    { id: 'govt_schemes', label: { English: '🇮🇳 Govt Schemes', Hindi: '🇮🇳 सरकारी योजनाएं' }, prompt: 'Central and State government schemes, subsidies, MSME/Startup benefits, and Digital India updates.' },
    { id: 'legal', label: { English: '⚖️ Legal & Compliance', Hindi: '⚖️ कानूनी और अनुपालन' }, prompt: 'New business laws, compliance deadlines, GST/Tax updates, and registration changes for professionals.' },
    { id: 'startup', label: { English: '🚀 Business & Startup', Hindi: '🚀 व्यापार और स्टार्टअप' }, prompt: 'Startup ecosystem news, funding updates, market trends, and growth insights for entrepreneurs.' },
    { id: 'tech', label: { English: '🤖 Tech & Digital', Hindi: '🤖 टेक और डिजिटल' }, prompt: 'AI in finance, digital tools, cyber safety awareness, and online fraud prevention for a modern image.' },
    { id: 'awareness', label: { English: '🛡️ Consumer Awareness', Hindi: '🛡️ उपभोक्ता जागरूकता' }, prompt: 'Fraud alerts, fake loan app warnings, scam awareness, and customer rights. High viral potential.' },
    { id: 'csr', label: { English: '🤝 CSR & Social', Hindi: '🤝 सामाजिक प्रभाव' }, prompt: 'Social initiatives, free guidance drives, and community work by RBA to show brand responsibility.' },
    { id: 'media', label: { English: '📰 Media & Press', Hindi: '📰 मीडिया और प्रेस' }, prompt: 'Official press releases, media mentions, interviews, and public announcements to build authority.' },
];

export const AuraNews: React.FC<AuraNewsProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeCategory, setActiveCategory] = useState('rba_updates');
    const [newsContent, setNewsContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [authorName, setAuthorName] = useState("Chief Admin");
    const [audience, setAudience] = useState("Priority Members");
    const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
    const [copyStatus, setCopyStatus] = useState("📋 Copy Full E-Paper");
    const [tickerText, setTickerText] = useState("RBA Advisor Hub • Intelligence Grid Active • Monitoring Markets...");

    useEffect(() => {
        if (isOpen && !newsContent) fetchNews('rba_updates', language);
    }, [isOpen]);

    const fetchNews = async (catId: string, lang: 'English' | 'Hindi') => {
        setActiveCategory(catId);
        setIsLoading(true);
        setCopyStatus("📋 Copy Full E-Paper");
        try {
            const category = CATEGORIES.find(c => c.id === catId);
            const result = await generateCreativeContent(
                'news_reporter', 
                `${category?.prompt || "Latest News"} for ${audience}. Include professional headlines and investigative tone.`, 
                currentPersona, 
                undefined, 
                { userName: authorName, language: lang, targetAudience: audience }
            );
            setNewsContent(result.code || result.text);
            setTickerText(lang === 'Hindi' ? `RBA अलर्ट: ${category?.label.Hindi} रिपोर्ट जारी...` : `RBA Alert: ${category?.label.English} Intelligence Released...`);
        } catch (e) {
            setNewsContent("<div class='p-8 text-red-600 font-bold text-center'>Connection Fail. Refresh karo bhai!</div>");
        } finally {
            setIsLoading(false);
        }
    };

    const getFullEpaperHtml = () => {
        const dateStr = new Date().toLocaleDateString(language === 'Hindi' ? 'hi-IN' : 'en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
        const catLabel = CATEGORIES.find(c => c.id === activeCategory)?.label[language];
        const titleText = language === 'Hindi' ? 'RBA एडवाइजर' : 'RBA ADVISOR';
        
        return `
<!DOCTYPE html>
<html lang="${language === 'Hindi' ? 'hi' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Nunito', sans-serif; background-color: #f5f2eb; color: #1a1a1a; margin: 0; padding: 0; }
        .paper { 
            background-color: #fdfbf7; 
            width: 100%; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: clamp(1rem, 5vw, 4rem); 
            box-shadow: 0 0 50px rgba(0,0,0,0.1); 
            min-height: 100vh;
            border: 1px solid rgba(0,0,0,0.1);
        }
        .masthead h1 { font-family: 'Playfair Display', serif; font-weight: 900; font-size: clamp(2.5rem, 10vw, 8rem); line-height: 0.85; margin: 0; }
        .article-columns { 
            column-count: 1; 
            column-gap: 3rem; 
            text-align: justify;
            orphans: 3;
            widows: 3;
        }
        @media (min-width: 768px) { .article-columns { column-count: 2; } }
        @media (min-width: 1024px) { .article-columns { column-count: 3; } }
        .article-columns p { margin-bottom: 1.5rem; break-inside: avoid-column; }
        .drop-cap::first-letter { font-size: 5rem; font-weight: 900; float: left; margin-right: 10px; line-height: 0.75; font-family: 'Playfair Display', serif; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="paper">
        <div class="masthead text-center border-b-4 border-black pb-8 mb-12">
            <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">
                <span>VOL. ${new Date().getFullYear()}</span>
                <span>GLOBAL INTELLIGENCE NETWORK</span>
                <span>RBA-GAZETTE</span>
            </div>
            <h1>${titleText}</h1>
            <div class="text-[clamp(10px,2vw,14px)] font-black uppercase tracking-[0.5em] mt-6">${catLabel} SPECIAL GAZETTE</div>
            <div class="mt-8 pt-4 border-t-2 border-black flex flex-wrap justify-between items-center gap-4 text-xs font-black uppercase">
                <span class="bg-black text-white px-3 py-1">${dateStr}</span>
                <span>CHIEF EDITOR: ${authorName}</span>
                <span class="text-blue-700">FOR: ${audience}</span>
            </div>
        </div>
        <div class="article-columns drop-cap text-lg leading-relaxed font-serif">
            ${newsContent}
        </div>
        <div class="mt-20 pt-8 border-t border-black/20 flex flex-wrap justify-between items-end gap-10">
            <div>
                <div class="w-16 h-1 bg-black mb-4"></div>
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-black rotate-12">RBA</div>
                    <div class="text-[10px] font-bold opacity-40 uppercase max-w-[140px]">This gazette is a neural materialization for exclusive members.</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Editor-in-Chief</div>
                <div class="text-4xl font-serif italic font-bold">${authorName}</div>
                <div class="text-[10px] font-black uppercase opacity-40 mt-1">Royal Bulls Advisory Pvt. Ltd.</div>
            </div>
        </div>
    </div>
</body>
</html>`;
    };

    const handleCopyHtml = () => {
        if (!newsContent) return;
        const fullSource = getFullEpaperHtml();
        navigator.clipboard.writeText(fullSource);
        setCopyStatus("✅ Source Copied!");
        setTimeout(() => setCopyStatus("📋 Copy Full E-Paper"), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-[#fdfbf7] flex flex-col font-serif text-[#1a1a1a] overflow-hidden animate-in slide-in-from-right duration-500">
            {/* NOISE OVERLAY */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[10] bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>

            {/* TOP BAR CONTROLS (RESPONSIVE) */}
            <div className="bg-[#0a192f] text-white px-4 py-3 md:px-8 md:py-5 flex flex-col gap-4 shrink-0 shadow-2xl relative z-[100] border-b border-white/10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-8 h-8 md:w-11 md:h-11 bg-[#daa520] text-black rounded-lg flex items-center justify-center font-black text-lg md:text-2xl shadow-lg rotate-3">R</div>
                        <div className="hidden sm:block">
                            <h1 className="text-sm md:text-xl font-black tracking-tighter uppercase font-sans leading-none">RBA ADVISOR</h1>
                            <span className="text-[8px] md:text-[10px] text-white/40 uppercase font-sans font-bold tracking-[0.2em] mt-1">E-PAPER STUDIO</span>
                        </div>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 scale-90 md:scale-100">
                        <button onClick={() => { setLanguage('English'); fetchNews(activeCategory, 'English'); }} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${language === 'English' ? 'bg-[#daa520] text-black shadow-lg' : 'text-white/40'}`}>EN</button>
                        <button onClick={() => { setLanguage('Hindi'); fetchNews(activeCategory, 'Hindi'); }} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${language === 'Hindi' ? 'bg-[#daa520] text-black shadow-lg' : 'text-white/40'}`}>HI</button>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            onClick={handleCopyHtml} 
                            disabled={isLoading || !newsContent}
                            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all items-center gap-2"
                        >
                            <span>{copyStatus}</span>
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500 text-white rounded-full transition-all text-sm">✕</button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center bg-white/5 p-2 rounded-2xl border border-white/5">
                    <div className="flex-1 min-w-[120px] relative">
                        <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Editor Name" className="w-full bg-black/20 border border-white/10 rounded-xl outline-none text-[10px] font-bold text-yellow-500 px-4 py-2.5 uppercase focus:border-yellow-500 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-[120px] relative">
                        <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Target Audience" className="w-full bg-black/20 border border-white/10 rounded-xl outline-none text-[10px] font-bold text-blue-400 px-4 py-2.5 uppercase focus:border-blue-400 transition-colors" />
                    </div>
                    <button onClick={() => fetchNews(activeCategory, language)} className="flex-1 md:flex-none bg-[#daa520] text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-yellow-400 active:scale-95 shadow-lg">REFRESH GAZETTE</button>
                </div>
            </div>

            {/* CATEGORY NAV (MOBILE FRIENDLY SCROLL) */}
            <div className="bg-[#0a192f] border-b border-white/5 flex overflow-x-auto scroll-smooth snap-x no-scrollbar px-4 shrink-0 relative z-[90]">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => fetchNews(cat.id, language)}
                        className={`px-5 py-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 snap-start ${activeCategory === cat.id ? 'border-[#daa520] text-white bg-white/5' : 'border-transparent text-white/30 hover:text-white'}`}
                    >
                        {cat.label[language]}
                    </button>
                ))}
            </div>

            {/* LIVE TICKER */}
            <div className="h-10 bg-black text-[#daa520] flex items-center overflow-hidden shrink-0 border-y border-white/10">
                <div className="bg-[#daa520] text-black px-4 h-full flex items-center font-black text-[9px] uppercase tracking-widest z-10 shadow-2xl">FLASH</div>
                <div className="whitespace-nowrap animate-marquee flex items-center h-full">
                    {[1, 2, 3].map(i => (
                        <span key={i} className="text-[11px] font-black uppercase tracking-[0.2em] mx-10">{tickerText}</span>
                    ))}
                </div>
            </div>

            {/* MAIN E-PAPER CONTAINER (AUTO-ADJUSTING) */}
            <div className="flex-1 overflow-y-auto bg-[#f5f2eb] p-2 sm:p-4 md:p-10 lg:p-16 custom-scrollbar relative">
                
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfbf7]/90 backdrop-blur-sm z-[110]">
                        <div className="w-16 h-16 border-4 border-black/10 border-t-[#daa520] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-8 text-black/60 animate-pulse">Printing Gazette Shards...</p>
                    </div>
                )}

                <div className="w-full max-w-[1200px] mx-auto bg-[#fdfbf7] p-6 sm:p-10 md:p-20 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-black/5 min-h-full transition-all duration-700">
                    
                    {/* MASTHEAD */}
                    <header className="masthead text-center border-b-4 border-black pb-10 mb-16 relative">
                        <div className="flex flex-wrap justify-between items-center text-[clamp(8px,1vw,10px)] font-black uppercase tracking-widest opacity-40 mb-6 border-b border-black/5 pb-2">
                            <span>EDITION v${new Date().getFullYear()}</span>
                            <span>RBA-INTEL-GRID</span>
                            <span className="hidden sm:inline">EXCLUSIVE BROADCAST</span>
                        </div>
                        
                        <h2 className="text-[clamp(2.5rem,12vw,8.5rem)] font-black uppercase tracking-tighter leading-[0.85] font-serif text-black m-0 drop-shadow-sm">
                            {language === 'Hindi' ? 'RBA एडवाइजर' : 'RBA ADVISOR'}
                        </h2>

                        <div className="text-[clamp(10px,2.5vw,16px)] font-black uppercase tracking-[0.6em] text-black/70 mt-8">
                            {CATEGORIES.find(c => c.id === activeCategory)?.label[language]} Special Gazette
                        </div>
                        
                        <div className="mt-10 pt-4 border-t-2 border-black flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-black uppercase tracking-widest">
                            <span className="bg-black text-white px-4 py-1 rounded shadow-lg">{new Date().toLocaleDateString(language === 'Hindi' ? 'hi-IN' : 'en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="border-x-0 md:border-x-2 border-black px-0 md:px-8">EDITOR: <span className="text-yellow-700">{authorName}</span></span>
                            <span className="text-blue-700">FOR: <span className="border-b border-blue-700/30 pb-0.5">{audience}</span></span>
                        </div>
                    </header>

                    {/* DYNAMIC ARTICLE CONTENT (COLUMNS AUTO-ADJUST) */}
                    <div className="relative">
                        <div className={`columns-1 md:columns-2 lg:columns-3 gap-12 font-serif text-[clamp(1.1rem,1.5vw,1.3rem)] leading-relaxed text-justify text-black break-words
                            prose-p:mb-8 prose-p:break-inside-avoid
                            prose-headings:font-black prose-headings:tracking-tighter prose-headings:font-serif prose-headings:mt-8 prose-headings:mb-4
                            first-letter:text-[clamp(4.5rem,10vw,8rem)] first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:leading-[0.75] first-letter:text-black
                            ${language === 'Hindi' ? 'leading-[2.2] text-[1.25rem]' : ''}`}
                            dangerouslySetInnerHTML={{ __html: newsContent }}
                        />
                    </div>

                    {/* NEWSPAPER FOOTER */}
                    <footer className="mt-24 pt-10 border-t-4 border-double border-black/20 flex flex-wrap justify-between items-end gap-12">
                        <div className="flex-1 min-w-[200px]">
                            <div className="w-12 h-1 bg-black mb-5"></div>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center font-black text-xl rotate-12 bg-white shadow-xl">RBA</div>
                                <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest leading-relaxed max-w-[180px]">
                                    {language === 'Hindi' 
                                        ? 'यह राजपत्र डिजिटल रूप से आरबीए न्यूरल इंजन द्वारा सत्यापित है।' 
                                        : 'THIS GAZETTE IS DIGITALLY VERIFIED BY THE RBA NEURAL ENGINE.'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">Authenticated Signature</p>
                            <div className="font-serif italic font-bold text-5xl text-black/80">{authorName}</div>
                            <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mt-2">Royal Bulls Advisory Pvt. Ltd.</p>
                        </div>
                    </footer>
                </div>
            </div>

            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 40s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
