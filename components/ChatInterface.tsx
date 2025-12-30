
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
    onOpenNews?: () => void;
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
    onOpenNews
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

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            
            {/* MESSAGES VIEW */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6 -webkit-overflow-scrolling-touch scroll-smooth custom-scrollbar"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                        <div className={`max-w-[90%] flex flex-col gap-1.5 ${msg.sender === Sender.User ? 'items-end' : 'items-start'}`}>
                            <div className={`p-4 md:p-5 rounded-[2rem] shadow-2xl border transition-all ${
                                    msg.sender === Sender.User 
                                    ? 'bg-blue-600/60 text-white rounded-br-none border-white/20' 
                                    : 'bg-white/5 text-white/90 rounded-bl-none border-white/5 backdrop-blur-2xl'
                                }`}>
                                <div className="text-[13px] md:text-[14px] leading-relaxed font-bold selectable">{msg.text}</div>
                                {msg.sender === Sender.Bot && !isLive && (
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => onSpeakMessage(msg.text, msg.id)} 
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${currentlyPlayingId === msg.id ? 'bg-pink-600 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 20.03c-1.25.687-2.779-.217-2.779-1.643V5.653z" /></svg>
                                        </button>
                                        {msg.groundingMetadata && (
                                            <button className="px-3 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/30">Verified info</button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 px-4">
                                {msg.sender === Sender.User ? 'You' : 'Aura'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start px-2">
                         <div className="flex items-center gap-2 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                            <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase">Analyzing Context</span>
                         </div>
                    </div>
                )}
            </div>

            {/* ACTION AREA */}
            <div className="p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5 shrink-0">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-[2rem] focus-within:border-blue-500/40 focus-within:bg-white/10 transition-all shadow-inner">
                     <button onClick={onToggleLive} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLive ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>
                     </button>
                     <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                        placeholder="Bhai, help chahiye?" 
                        className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 font-bold text-[14px] placeholder-white/20" 
                     />
                     <button onClick={() => handleSend()} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${inputValue.trim() ? 'bg-blue-600 text-white shadow-xl' : 'bg-white/5 text-white/10'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                     </button>
                </div>
            </div>
        </div>
    );
};
