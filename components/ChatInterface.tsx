
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, ContentType } from '../types';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    isProcessing: boolean;
    onMicClick: () => void;
    isListening: boolean;
    onMagicClick?: () => void;
    onOpenStudio: () => void;
    onTypingChange?: (isTyping: boolean) => void;
    onFeedback?: (id: string, rating: 'positive' | 'negative') => void;
    onSpeakMessage: (text: string) => void;
    onDownloadAudio: (text: string) => void;
    onStopAudio: () => void;
    isTalking: boolean;
    onFileUpload: (file: File) => void;
    onBrowserClick: () => void;
    onGenesisClick: () => void;
    onMicActivity?: (active: boolean) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    isProcessing,
    onMicClick,
    isListening,
    onMagicClick,
    onOpenStudio,
    onTypingChange,
    onFeedback,
    onSpeakMessage,
    onDownloadAudio,
    onStopAudio,
    isTalking,
    onFileUpload,
    onBrowserClick,
    onGenesisClick
}) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue("");
        if (onTypingChange) onTypingChange(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (onTypingChange) onTypingChange(e.target.value.length > 0);
    };

    const renderMessageContent = (msg: Message) => {
        const { text, contentType } = msg;

        if (contentType === 'invoice' && msg.codeSnippet) {
            return (
                <div className="w-full">
                    <p className="text-sm mb-4 leading-relaxed">{text}</p>
                    <div className="bg-white text-black rounded-3xl shadow-2xl relative overflow-hidden group border border-white/20 transition-all hover:shadow-indigo-500/20">
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => setPreviewHtml(msg.codeSnippet!)} className="bg-black text-white px-8 py-4 rounded-2xl font-black shadow-2xl transform hover:scale-105 transition-all text-xs uppercase tracking-widest">
                                Open Interactive Editor
                            </button>
                        </div>
                        <div className="h-64 overflow-hidden pointer-events-none p-4">
                            <iframe srcDoc={msg.codeSnippet} className="w-full h-full border-none pointer-events-none" title="Invoice Preview" />
                        </div>
                    </div>
                </div>
            );
        }

        if (msg.codeSnippet && (contentType === 'html' || contentType === 'react_app' || contentType === 'genesis_result')) {
            return (
                <div className="w-full">
                    <p className="mb-4 text-sm leading-relaxed">{text}</p>
                    <div className="bg-black/60 p-5 rounded-2xl border border-white/10 relative group">
                        <button 
                            onClick={() => {
                                const blob = new Blob([msg.codeSnippet!], { type: 'text/html' });
                                window.open(URL.createObjectURL(blob), '_blank');
                            }}
                            className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white transition-all border border-white/5"
                        >
                            Execute App ↗
                        </button>
                        <pre className="text-[10px] text-emerald-400/80 overflow-x-auto p-2 font-mono scrollbar-none">
                            {msg.codeSnippet.substring(0, 150)}...
                        </pre>
                    </div>
                </div>
            );
        }

        const parts = text.split(/(\*\*.*?\*\*)/g);
        const mapsData = msg.groundingMetadata?.groundingChunks?.find((c: any) => c.web?.uri?.includes('google.com/maps') || c.maps);

        return (
            <div className="text-[15px] leading-relaxed font-medium">
                {parts.map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') ? 
                    <strong key={i} className="text-blue-300 font-bold">{part.slice(2, -2)}</strong> : 
                    <span key={i}>{part}</span>
                )}
                
                {mapsData && (
                    <div className="mt-6 p-5 bg-gradient-to-br from-[#1a237e] to-[#0d47a1] rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-xl border border-white/10">🧭</div>
                                <div>
                                    <div className="text-[9px] text-blue-200 uppercase tracking-widest font-black mb-0.5 opacity-60">Location Identity Found</div>
                                    <div className="text-base font-black text-white truncate max-w-[200px]">{mapsData.web?.title || "Coordinates Locked"}</div>
                                </div>
                            </div>
                        </div>
                        <a href={mapsData.web?.uri} target="_blank" rel="noopener noreferrer" className="mt-5 w-full py-3.5 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:bg-blue-50 transition-all active:scale-95">
                            Activate Navigation
                        </a>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full relative z-50 pointer-events-auto overflow-hidden bg-transparent">
            
            {/* MESSAGES VIEWPORT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                    >
                        <div 
                            className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[2rem] backdrop-blur-2xl shadow-2xl relative ${
                                msg.sender === Sender.User 
                                ? 'bg-gradient-to-br from-indigo-600/20 to-blue-600/10 text-white rounded-br-none border border-white/20' 
                                : 'bg-black/60 text-white rounded-bl-none border border-white/5 bot-shimmer'
                            }`}
                        >
                            {msg.attachmentUrl && (
                                <div className="mb-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                                    {msg.contentType === 'video' ? (
                                        <video src={msg.attachmentUrl} controls className="w-full max-h-72 object-cover" />
                                    ) : (
                                        <img src={msg.attachmentUrl} alt="attachment" className="w-full max-h-72 object-cover" />
                                    )}
                                </div>
                            )}

                            {renderMessageContent(msg)}
                            
                            {msg.sender === Sender.Bot && (
                                <div className="mt-5 flex gap-4 opacity-40 hover:opacity-100 transition-opacity justify-end border-t border-white/5 pt-4">
                                    <button onClick={() => onSpeakMessage(msg.text)} className="hover:text-pink-400 transition-colors" title="Speak">🔊</button>
                                    <button onClick={() => onDownloadAudio(msg.text)} className="hover:text-green-400 transition-colors" title="Download Audio">💾</button>
                                    <div className="flex gap-2 ml-2">
                                        <button onClick={() => onFeedback?.(msg.id, 'positive')} className={`hover:text-yellow-400 ${msg.feedback === 'positive' ? 'text-yellow-400' : ''}`}>👍</button>
                                        <button onClick={() => onFeedback?.(msg.id, 'negative')} className={`hover:text-red-400 ${msg.feedback === 'negative' ? 'text-red-400' : ''}`}>👎</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isProcessing && (
                    <div className="flex justify-start animate-pulse">
                         <div className="bg-black/40 px-8 py-4 rounded-full rounded-bl-none text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border border-white/5 backdrop-blur-xl">
                             Aura is thinking...
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* CONTROL CENTER BAR */}
            <div className="p-6 pt-2 shrink-0 w-full pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#020205] via-[#020205]/90 to-transparent">
                <div className="flex gap-4 justify-center mb-5">
                    {[
                        { icon: '🎨', title: 'Studio', onClick: onOpenStudio },
                        { icon: '🌐', title: 'Web', onClick: onBrowserClick },
                        { icon: '🧞‍♂️', title: 'Genesis', onClick: onGenesisClick },
                    ].map((btn, i) => (
                        <button 
                            key={i} onClick={btn.onClick}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 hover:border-blue-500/50 hover:text-blue-400 transition-all shadow-xl backdrop-blur-3xl group"
                        >
                            <span className="group-hover:scale-110 transition-transform">{btn.icon}</span>
                        </button>
                    ))}
                    {onMagicClick && (
                        <button onClick={onMagicClick} className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-xl hover:scale-110 transition-transform shadow-2xl shadow-indigo-500/30">
                            ✨
                        </button>
                    )}
                </div>

                <div className="max-w-4xl mx-auto flex items-end gap-3 bg-white/5 backdrop-blur-[40px] border border-white/10 p-3 rounded-[2.5rem] shadow-2xl relative z-50 ring-1 ring-white/5 group focus-within:ring-blue-500/30 transition-all">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 hover:bg-white/10 rounded-2xl transition-colors text-white/40 hover:text-white shrink-0"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && onFileUpload(e.target.files[0])} />
                     </button>

                     <input 
                        type="text" value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        placeholder="Neural prompt..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20 py-4 font-bold text-[15px] min-w-0"
                     />

                     {inputValue ? (
                         <button onClick={handleSend} className="p-4 bg-white text-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl shrink-0 group">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                         </button>
                     ) : (
                         <button onClick={onMicClick} className={`p-4 rounded-2xl transition-all shadow-xl shrink-0 ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 hover:bg-white/10 text-white/40'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                         </button>
                     )}
                </div>
            </div>

            {previewHtml && (
                <div className="fixed inset-0 z-[200] bg-gray-900/95 backdrop-blur-2xl p-6 md:p-12 flex flex-col pointer-events-auto animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-8 bg-black/40 p-5 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-4 px-4">
                            <h3 className="text-white font-black text-xl">Command Editor</h3>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 uppercase font-black tracking-widest">Active Mode</span>
                        </div>
                        <button onClick={() => setPreviewHtml(null)} className="px-8 py-3 bg-red-500/10 hover:bg-red-500 rounded-2xl text-red-400 hover:text-white font-black text-[10px] transition-all uppercase tracking-widest">Terminate Editor</button>
                    </div>
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20">
                         <iframe srcDoc={previewHtml} className="w-full h-full border-none" title="Full Editor" sandbox="allow-scripts allow-modals allow-same-origin allow-popups" />
                    </div>
                </div>
            )}
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .bot-shimmer { position: relative; overflow: hidden; }
                .bot-shimmer::after {
                    content: ''; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%;
                    background: linear-gradient(45deg, transparent, rgba(59,130,246,0.03), transparent);
                    transform: rotate(-45deg); animation: shimmer 8s infinite linear;
                }
                @keyframes shimmer { 0% { transform: translateX(-50%) rotate(-45deg); } 100% { transform: translateX(50%) rotate(-45deg); } }
                .scrollbar-none::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
