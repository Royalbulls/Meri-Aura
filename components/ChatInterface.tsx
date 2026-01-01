
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from '../types';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    isProcessing: boolean;
    onSpeakMessage: (text: string, id: string) => void;
    onStopAudio: () => void;
    currentlyPlayingId: string | null;
    isLive?: boolean;
    onToggleLive?: () => void;
    onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    isProcessing,
    onSpeakMessage,
    onStopAudio,
    currentlyPlayingId,
    isLive,
    onToggleLive,
    onFeedback
}) => {
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isProcessing]);

    const handleSend = (text?: string) => {
        const val = text || inputValue;
        if (!val.trim()) return;
        onSendMessage(val);
        setInputValue("");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple visual confirmation could be added here if needed, but per request we keep it functional
    };

    const downloadCode = (code: string) => {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Aura_App_${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 -webkit-overflow-scrolling-touch scroll-smooth custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                        <div className={`max-w-[90%] flex flex-col gap-1.5 ${msg.sender === Sender.User ? 'items-end' : 'items-start'}`}>
                            <div className={`p-4 md:p-5 rounded-[2rem] shadow-2xl border transition-all ${msg.sender === Sender.User ? 'bg-blue-600/60 text-white rounded-br-none border-white/20' : 'bg-white/5 text-white/90 rounded-bl-none border-white/5 backdrop-blur-2xl'}`}>
                                <div className="text-[13px] md:text-[14px] leading-relaxed font-bold selectable whitespace-pre-wrap">{msg.text}</div>
                                
                                {msg.codeSnippet && (
                                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-white shadow-2xl flex flex-col">
                                        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Materialized Preview</span>
                                            <div className="flex gap-3">
                                                <button onClick={() => downloadCode(msg.codeSnippet!)} className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase">Download</button>
                                            </div>
                                        </div>
                                        <div className="h-64 w-full">
                                            <iframe srcDoc={msg.codeSnippet} className="w-full h-full border-none" title="Artifact Preview" />
                                        </div>
                                    </div>
                                )}

                                {/* Utilities Row */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {msg.sender === Sender.Bot && !isLive && (
                                            <button 
                                                onClick={() => onSpeakMessage(msg.text, msg.id)} 
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${currentlyPlayingId === msg.id ? 'bg-pink-600 shadow-lg animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
                                                title="Listen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 20.03c-1.25.687-2.779-.217-2.779-1.643V5.653z" /></svg>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => copyToClipboard(msg.text)} 
                                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/40 hover:text-white"
                                            title="Copy"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                                        </button>
                                    </div>

                                    {msg.sender === Sender.Bot && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => onFeedback?.(msg.id, 'like')}
                                                className={`p-1.5 rounded-lg transition-all ${msg.feedback === 'like' ? 'text-blue-400 bg-blue-400/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.551.5.96a9.491 9.491 0 00-1.539 4.494c0 .355.02.707.058 1.053.05.474.373.9.832 1.053z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => onFeedback?.(msg.id, 'dislike')}
                                                className={`p-1.5 rounded-lg transition-all ${msg.feedback === 'dislike' ? 'text-red-400 bg-red-400/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.021.1.03.15.059.32.046.651-.038.967-.266.956-.894 1.76-1.764 2.128a11.95 11.95 0 01-5.631 1.44c-.71 0-1.411-.059-2.096-.173a4.5 4.5 0 00-1.423.23l-3.114 1.04a4.5 4.5 0 00-1.423.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.551.5.96a9.491 9.491 0 00-1.539 4.494c0 .355.02.707.058 1.053.05.474.373.9.832 1.053z" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start px-2">
                         <div className="flex items-center gap-2 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase">Aura is thinking...</span>
                         </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5 shrink-0">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-[2rem] focus-within:border-blue-500/40 transition-all shadow-inner">
                     <button onClick={onToggleLive} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLive ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>
                     </button>
                     <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Batao Chief, kya plan hai? ✨" className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 font-bold text-[14px] placeholder-white/20" />
                     <button onClick={() => handleSend()} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${inputValue.trim() ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/10'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                     </button>
                </div>
            </div>
        </div>
    );
};
