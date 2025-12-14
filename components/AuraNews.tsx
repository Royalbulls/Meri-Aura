
import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { generateCreativeContent, generateNewsVideo, summarizeForVideo, generateSpeechDownloadUrl, generateRadioBrief } from '../services/geminiService';

interface AuraNewsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

const CATEGORIES = [
    { id: 'headlines', label: '🌍 Top Stories', prompt: 'Global Top Headlines, Geopolitics, and Breaking News' },
    { id: 'tech', label: '🚀 Tech & AI', prompt: 'Artificial Intelligence, Space, Startups, and Gadgets' },
    { id: 'business', label: '💰 Markets', prompt: 'Stock Market, Crypto, Economy, and Business' },
    { id: 'science', label: '🧬 Science', prompt: 'Space Discovery, Medical Breakthroughs, Environment' },
    { id: 'sports', label: '🏆 Sports', prompt: 'Cricket, Football, Olympics, Major Tournaments' },
    { id: 'entertainment', label: '🎬 Showbiz', prompt: 'Movies, Celebrity News, Viral Trends' },
    { id: 'fashion', label: '👗 Fashion', prompt: 'Fashion Week, Trends, Luxury Brands' },
    { id: 'gaming', label: '🎮 Gaming', prompt: 'Video Games, Esports, Console Releases' },
];

export const AuraNews: React.FC<AuraNewsProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeCategory, setActiveCategory] = useState('headlines');
    const [newsContent, setNewsContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [tickerText, setTickerText] = useState("Welcome to Aura Global Times • Your AI Powered Intelligence Hub • Select a category to begin analysis •");
    const [customSearch, setCustomSearch] = useState("");

    // Video Generation States
    const [videoReport, setVideoReport] = useState<{ video: string, audio: string, script: string } | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [genStatus, setGenStatus] = useState("");
    const [selectedText, setSelectedText] = useState("");
    
    // Audio State
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [audioDownloadUrl, setAudioDownloadUrl] = useState<string | null>(null);

    // Auto-load headlines on open
    useEffect(() => {
        if (isOpen && !newsContent) {
            fetchNews('headlines');
        }
        return () => {
            if (audioElement) {
                audioElement.pause();
                setAudioElement(null);
            }
        };
    }, [isOpen]);

    // Handle Text Selection
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (text && text.length > 50) { 
                setSelectedText(text);
            } else {
                setSelectedText("");
            }
        };
        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, []);

    const fetchNews = async (catId: string, customTopic?: string) => {
        if (audioElement) {
            audioElement.pause();
            setIsPlayingAudio(false);
        }
        setAudioDownloadUrl(null); // Reset audio
        
        setActiveCategory(catId);
        setIsLoading(true);
        setNewsContent(''); 
        setSelectedText("");
        setVideoReport(null);

        const category = CATEGORIES.find(c => c.id === catId);
        const topicPrompt = customTopic || category?.prompt || "Latest News";
        const categoryLabel = customTopic ? "Custom Search" : category?.label || "News";

        try {
            const result = await generateCreativeContent(
                'news_reporter', 
                topicPrompt, 
                currentPersona, 
                undefined, 
                { category: categoryLabel }
            );
            
            const content = result.code || result.text;
            setNewsContent(content);
            
            // Extract headlines for dynamic ticker
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const headlines = Array.from(tempDiv.querySelectorAll('h1, h2, h3'))
                .map(h => h.textContent?.trim())
                .filter(t => t && t.length > 10)
                .join('  +++  ');
            
            if (headlines) {
                setTickerText(`BREAKING: ${headlines}  +++  Powered by Aura Intelligence`);
            } else {
                setTickerText(`LIVE UPDATES: Analyzing ${categoryLabel} streams... Real-time data...`);
            }
            
        } catch (e) {
            setNewsContent("<div class='p-4 text-red-400'>Signal Lost. Could not fetch news data.</div>");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (customSearch.trim()) {
            fetchNews('custom', customSearch);
        }
    };

    const handleListenToArticle = async () => {
        if (isPlayingAudio && audioElement) {
            audioElement.pause();
            setIsPlayingAudio(false);
            return;
        }

        // If we already generated audio, just play it
        if (audioDownloadUrl && !isPlayingAudio) {
             const audio = new Audio(audioDownloadUrl);
             audio.onended = () => setIsPlayingAudio(false);
             audio.play();
             setAudioElement(audio);
             setIsPlayingAudio(true);
             return;
        }

        if (!newsContent) return;

        setIsGeneratingVideo(true); // Reuse loading UI
        setGenStatus("Drafting Radio Brief...");

        try {
            // Step 1: Generate Script
            const script = await generateRadioBrief(newsContent);
            
            // Step 2: Generate Audio
            setGenStatus("Broadcasting...");
            const url = await generateSpeechDownloadUrl(script, currentPersona.voiceName);
            setAudioDownloadUrl(url); // Save for download
            
            const audio = new Audio(url);
            audio.onended = () => setIsPlayingAudio(false);
            audio.play();
            setAudioElement(audio);
            setIsPlayingAudio(true);
        } catch(e) {
            alert("Audio generation failed");
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleGenerateVideoReport = async (contentToUse?: string) => {
        if (audioElement) audioElement.pause();
        const sourceContent = contentToUse || newsContent;
        if (!sourceContent) return;
        
        setIsGeneratingVideo(true);
        setGenStatus("Analyzing Story Script...");

        try {
            const { script, visualPrompt } = await summarizeForVideo(sourceContent);
            setGenStatus("Dreaming Visuals (Veo) & Voice...");

            const [videoUrl, audioUrl] = await Promise.all([
                generateNewsVideo(visualPrompt),
                generateSpeechDownloadUrl(script, currentPersona.voiceName)
            ]);

            setVideoReport({ video: videoUrl, audio: audioUrl, script });

        } catch (e) {
            console.error(e);
            alert("Failed to generate video report.");
        } finally {
            setIsGeneratingVideo(false);
            setGenStatus("");
            setSelectedText(""); 
        }
    };

    const closeVideoModal = () => setVideoReport(null);

    const handlePrintPdf = () => {
        if (!newsContent) return;
        window.print();
    };

    const getFullHtml = () => {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aura News Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Merriweather', serif; }
        h1, h2, h3, h4 { font-family: 'Playfair Display', serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 p-8 md:p-12 max-w-4xl mx-auto">
    <div class="border-b-4 border-black pb-6 mb-8">
        <div class="text-xs font-bold text-red-600 uppercase tracking-[0.2em] mb-2">Aura Global News</div>
        <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tight">Intelligence Report</h1>
        <div class="mt-2 text-sm text-gray-500 font-sans flex justify-between">
            <span>Generated by Aura AI</span>
            <span>${new Date().toLocaleDateString()}</span>
        </div>
    </div>
    
    <div class="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-red-600 hover:prose-a:text-red-500">
        ${newsContent}
    </div>

    <div class="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400 font-sans uppercase tracking-widest">
        Powered by Google Gemini • Aura OS
    </div>
</body>
</html>`;
    };

    const handleDownloadHtml = () => {
        if (!newsContent) return;
        
        const fullHtml = getFullHtml();
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aura_news_report_${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyHtml = () => {
        if (!newsContent) return;
        const html = getFullHtml();
        navigator.clipboard.writeText(html);
        alert("Full HTML Code Copied to Clipboard! 📋");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-xl flex flex-col font-serif text-white print:bg-white print:text-black">
            
            {/* SELECTION POPUP BUTTON */}
            {selectedText && !isGeneratingVideo && !videoReport && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 print:hidden">
                    <button 
                        onClick={() => handleGenerateVideoReport(selectedText)}
                        className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2 group transition-all hover:scale-105 border border-white/20"
                    >
                        <span className="text-xl group-hover:rotate-12 transition-transform">🎬</span>
                        <span>Create Video from Selection</span>
                    </button>
                </div>
            )}

            {/* LOADING OVERLAY */}
            {isGeneratingVideo && (
                <div className="absolute inset-0 z-[210] bg-black/90 flex flex-col items-center justify-center print:hidden">
                    <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-xl font-bold text-white animate-pulse">{genStatus}</h3>
                    <p className="text-xs text-white/50 mt-2">Powered by Veo & Gemini 2.5</p>
                </div>
            )}

            {/* VIDEO PLAYER MODAL */}
            {videoReport && (
                <div className="fixed inset-0 z-[220] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 print:hidden">
                    <div className="max-w-3xl w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex flex-col">
                        <button onClick={closeVideoModal} className="absolute top-4 right-4 z-20 p-2 bg-black/60 rounded-full text-white hover:bg-white/10 transition-colors">✕</button>

                        <div className="relative aspect-video bg-black group">
                            <video id="news-video" src={videoReport.video} loop playsInline className="w-full h-full object-cover" />
                            <audio src={videoReport.audio} autoPlay onPlay={() => (document.getElementById('news-video') as HTMLVideoElement)?.play()} onEnded={() => (document.getElementById('news-video') as HTMLVideoElement)?.pause()} />
                        </div>
                        <div className="p-6 bg-[#1a1a1a]">
                            <h3 className="text-xl font-bold text-white font-sans uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">AI Video Report</h3>
                            <div className="p-4 bg-black/30 rounded-xl border border-white/5 mt-4">
                                <p className="text-sm text-gray-300 italic leading-relaxed font-serif">"{videoReport.script}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="border-b border-white/10 bg-[#1a1a1a] print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center p-4 max-w-7xl mx-auto w-full gap-4">
                    <div className="flex items-center gap-4 self-start md:self-center">
                        <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center font-black text-xl tracking-tighter shadow-lg shadow-red-600/20">AG</div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-widest font-sans">Aura Global</h1>
                            <div className="text-[10px] text-white/50 flex gap-2 font-sans uppercase tracking-wide">
                                <span className="text-red-500 font-bold animate-pulse">● LIVE</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md w-full relative">
                        <input 
                            type="text" 
                            value={customSearch}
                            onChange={(e) => setCustomSearch(e.target.value)}
                            placeholder="Search Topic (e.g. Bitcoin, Oscars)..."
                            className="w-full bg-black/30 border border-white/10 rounded-full px-5 py-2 text-sm text-white focus:border-red-600 outline-none transition-colors"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">🔍</button>
                    </form>

                    <div className="flex items-center gap-2 self-end md:self-center">
                         <button 
                            onClick={handleListenToArticle}
                            disabled={!newsContent}
                            className={`p-2 rounded-lg transition-all text-xs font-sans font-bold uppercase flex items-center gap-2 ${isPlayingAudio ? 'bg-green-600 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
                         >
                            <span>{isPlayingAudio ? '🔊 Playing' : '🎙️ Listen'}</span>
                         </button>
                         {audioDownloadUrl && (
                             <a 
                                href={audioDownloadUrl}
                                download={`aura-news-brief-${Date.now()}.wav`}
                                className="p-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white rounded-lg transition-all text-xs font-sans font-bold uppercase flex items-center gap-2 border border-green-600/50"
                                title="Download Audio"
                             >
                                 <span>💾 Audio</span>
                             </a>
                         )}
                         <div className="h-6 w-px bg-white/10 mx-1"></div>
                         
                         {/* COPY HTML BUTTON */}
                         <button 
                            onClick={handleCopyHtml}
                            disabled={!newsContent}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all text-xs font-sans font-bold uppercase flex items-center gap-2"
                            title="Copy Full HTML Code"
                         >
                            <span>📋 Copy Code</span>
                         </button>

                         <button 
                            onClick={handleDownloadHtml}
                            disabled={!newsContent}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all text-xs font-sans font-bold uppercase flex items-center gap-2"
                            title="Download HTML File"
                         >
                            <span>⬇️ HTML</span>
                         </button>
                         <button 
                            onClick={handlePrintPdf}
                            disabled={!newsContent}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all text-xs font-sans font-bold uppercase flex items-center gap-2"
                            title="Print / Save as PDF"
                         >
                            <span>🖨️ PDF</span>
                         </button>
                         <div className="h-6 w-px bg-white/10 mx-1"></div>
                         <button 
                            onClick={() => handleGenerateVideoReport()}
                            disabled={!newsContent || isGeneratingVideo}
                            className="p-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg text-white transition-all text-xs font-sans font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                         >
                            <span className="text-lg">🎥</span> <span className="hidden md:inline">Report</span>
                         </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white">✕</button>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex overflow-x-auto no-scrollbar border-t border-white/5 bg-black/40 print:hidden">
                    <div className="flex max-w-7xl mx-auto w-full px-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => fetchNews(cat.id)}
                                className={`px-6 py-3 text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeCategory === cat.id ? 'border-red-600 text-white bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#fdfbf7] text-black relative print:overflow-visible print:h-auto scroll-smooth">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfbf7] z-10 print:hidden">
                        <div className="w-16 h-16 border-4 border-black border-t-red-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Fetching Intelligence...</p>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-full print:p-0 print:w-full print:max-w-none">
                        <div className="hidden print:block border-b-4 border-black mb-4 pb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h1 className="text-6xl font-black uppercase tracking-tighter">Aura Global</h1>
                                <div className="text-right">
                                    <div className="text-xs font-bold uppercase">Intelligence Report</div>
                                    <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="border-t border-b border-black py-1 text-center text-xs font-bold uppercase tracking-[0.3em]">
                                Strategic Analysis • Powered by Gemini • Real-Time Data
                            </div>
                        </div>
                        <div 
                            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:font-serif prose-a:text-red-700 hover:prose-a:text-red-500 print:columns-2 print:gap-8 print:text-sm print:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: newsContent }}
                        />
                        <div className="hidden print:block mt-8 pt-4 border-t-2 border-black text-center text-[10px] text-gray-500 font-sans uppercase tracking-widest">
                            Generated by Aura OS • Confidential Briefing
                        </div>
                    </div>
                )}
            </div>

            {/* Ticker */}
            <div className="h-8 bg-red-600 flex items-center overflow-hidden relative z-20 shrink-0 print:hidden shadow-lg border-t border-red-800">
                <div className="absolute left-0 top-0 bottom-0 bg-red-800 px-3 flex items-center z-10 font-bold text-[10px] uppercase tracking-wider text-white shadow-md">
                    Breaking
                </div>
                <div className="whitespace-nowrap animate-marquee pl-20">
                    <span className="text-xs font-bold text-white uppercase tracking-wide mx-4">
                        {tickerText}
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 30s linear infinite; }
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    body { color: black; background: white; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};
