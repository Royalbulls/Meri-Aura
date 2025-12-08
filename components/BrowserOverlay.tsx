
import React, { useState, useEffect, useRef } from 'react';
import { getWebsiteAdvice, performWebSearch } from '../services/geminiService';

interface BrowserOverlayProps {
    isOpen: boolean;
    initialUrl: string;
    onClose: () => void;
}

export const BrowserOverlay: React.FC<BrowserOverlayProps> = ({ isOpen, initialUrl, onClose }) => {
    const [url, setUrl] = useState(initialUrl);
    const [displayUrl, setDisplayUrl] = useState(initialUrl);
    const [advice, setAdvice] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [iframeError, setIframeError] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchResultsHtml, setSearchResultsHtml] = useState<string | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialUrl) {
            handleNavigate(initialUrl);
        }
    }, [isOpen, initialUrl]);

    // Hijack click events on the search result HTML
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link && containerRef.current?.contains(link)) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('http')) {
                    handleNavigate(href);
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('click', handleClick);
        }
        return () => {
            if (container) container.removeEventListener('click', handleClick);
        };
    }, [searchResultsHtml, searchMode]);

    const handleNavigate = async (targetUrl: string) => {
        const isSearchQuery = !targetUrl.includes('.') || targetUrl.includes('google.com/search');
        
        if (isSearchQuery) {
            // SEARCH MODE
            let query = targetUrl;
            if (targetUrl.includes('google.com/search')) {
                const match = targetUrl.match(/q=([^&]+)/);
                if (match) query = decodeURIComponent(match[1]);
            }
            
            setSearchMode(true);
            setDisplayUrl(query);
            setUrl(targetUrl);
            setSearchResultsHtml(null);
            setIsAnalyzing(true);
            setAdvice(null);
            
            try {
                const results = await performWebSearch(query);
                setSearchResultsHtml(results);
            } catch(e) {
                setSearchResultsHtml("<p style='padding:20px; color:white;'>Search failed. Try again.</p>");
            } finally {
                setIsAnalyzing(false);
            }
            
        } else {
            // BROWSE MODE (IFRAME)
            let safeUrl = targetUrl;
            if (!safeUrl.startsWith('http')) {
                safeUrl = `https://${safeUrl}`;
            }
            
            setSearchMode(false);
            setUrl(safeUrl);
            setDisplayUrl(safeUrl);
            setIframeError(false);
            
            // Trigger Co-Pilot Advice
            setIsAnalyzing(true);
            setAdvice(null);
            try {
                const aiAdvice = await getWebsiteAdvice(safeUrl);
                setAdvice(aiAdvice);
            } catch (e) {
                setAdvice("Could not analyze this site right now.");
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNavigate(displayUrl);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-gray-900 flex flex-col font-sans">
            {/* ADDRESS BAR */}
            <div className="h-16 bg-gray-800 border-b border-white/10 flex items-center px-4 gap-3 shadow-xl">
                <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="flex-1 flex items-center bg-black/40 rounded-xl px-4 py-2 border border-white/10 focus-within:border-pink-500 transition-colors">
                    <span className="text-white/40 mr-2">{searchMode ? '🔍' : '🔒'}</span>
                    <input 
                        type="text" 
                        value={displayUrl}
                        onChange={(e) => setDisplayUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-white focus:outline-none text-sm font-mono"
                        placeholder="Search or enter URL..."
                    />
                </div>

                <button 
                    onClick={() => handleNavigate(displayUrl)}
                    className="p-2 bg-pink-600 rounded-lg text-white font-bold text-xs"
                >
                    GO
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* SEARCH MODE VIEW */}
                {searchMode ? (
                    <div className="flex-1 bg-[#202124] overflow-y-auto" ref={containerRef}>
                        {isAnalyzing && !searchResultsHtml ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="w-12 h-12 border-4 border-t-pink-500 border-white/10 rounded-full animate-spin"></div>
                                <span className="text-white/50 text-sm animate-pulse">Searching Google Real-Time...</span>
                            </div>
                        ) : (
                            <div 
                                className="max-w-3xl mx-auto"
                                dangerouslySetInnerHTML={{ __html: searchResultsHtml || "" }} 
                            />
                        )}
                    </div>
                ) : (
                    /* BROWSE MODE (IFRAME) */
                    <div className="flex-1 bg-white relative">
                        {!iframeError ? (
                            <iframe 
                                src={url}
                                className="w-full h-full border-none"
                                sandbox="allow-same-origin allow-scripts allow-forms"
                                title="Aura Browser"
                                onError={() => setIframeError(true)}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white text-center p-6">
                                <span className="text-4xl mb-4">🛡️</span>
                                <h3 className="text-xl font-bold mb-2">Connection Blocked by Site</h3>
                                <p className="text-white/50 mb-6 max-w-md">
                                    {url} does not allow embedding inside apps for security reasons. 
                                    Aura can still analyze it, but you need to open it in a new tab to view.
                                </p>
                                <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-pink-600 rounded-xl font-bold hover:bg-pink-500 transition-colors"
                                >
                                    Open in System Browser ↗
                                </a>
                            </div>
                        )}
                        
                        {/* Fallback Overlay for known blockers */}
                        {['google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com'].some(d => url.includes(d)) && !iframeError && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 text-white text-center p-6 backdrop-blur-sm z-10">
                                 <span className="text-4xl mb-4">🔒</span>
                                 <h3 className="text-xl font-bold mb-2">Security Restriction</h3>
                                 <p className="text-white/50 mb-6 max-w-md">
                                     Major platforms like Google/Social Media block in-app browsing. 
                                     Aura has analyzed the link in the sidebar ->
                                 </p>
                                 <a 
                                     href={url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
                                 >
                                     Open Externally ↗
                                 </a>
                             </div>
                        )}
                    </div>
                )}

                {/* AURA CO-PILOT SIDEBAR */}
                <div className="w-80 bg-gray-900 border-l border-white/10 flex flex-col shadow-2xl z-20 hidden md:flex">
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-pink-900/20 to-purple-900/20">
                        <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-400 animate-bounce' : 'bg-green-500'}`}></span>
                            {searchMode ? 'Search AI' : 'Page Analysis'}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {isAnalyzing && !searchResultsHtml ? (
                            <div className="space-y-3">
                                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
                                <div className="h-20 bg-white/5 rounded w-full animate-pulse"></div>
                                <p className="text-xs text-white/40 text-center mt-4">Aura is reading...</p>
                            </div>
                        ) : (searchMode && !advice) ? (
                            <div className="text-sm text-white/60">
                                <p>I am fetching real-time search results for you. Click any link to browse.</p>
                            </div>
                        ) : advice ? (
                             <div 
                                className="text-sm text-white/80 leading-relaxed prose prose-invert prose-p:text-xs prose-headings:text-pink-300"
                                dangerouslySetInnerHTML={{ __html: advice }}
                             />
                        ) : (
                            <p className="text-xs text-white/40 text-center">Ready to analyze.</p>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <p className="text-[10px] text-white/30 text-center">
                            Aura Browser Shield Active. <br/> Do not enter passwords in unverified sites.
                        </p>
                    </div>
                </div>

            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            `}</style>
        </div>
    );
};
