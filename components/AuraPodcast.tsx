
import React, { useState, useRef, useEffect } from 'react';
import { generatePodcastScript, generateMultiSpeakerAudio, generateAudiobookScript, generateSpeechDownloadUrl } from '../services/geminiService';

interface AuraPodcastProps {
    isOpen: boolean;
    onClose: () => void;
}

const TOPICS = [
    "Artificial Intelligence",
    "Business & Markets",
    "Politics & Democracy",
    "Public Education",
    "Healthcare Future",
    "World News",
    "Sports Analytics"
];

const LANGUAGES = [
    { id: 'English', label: '🇺🇸 English' },
    { id: 'Hindi', label: '🇮🇳 Hindi' },
    { id: 'Hinglish', label: '🇮🇳 Hinglish (Mix)' },
    { id: 'Bengali', label: '🇮🇳 Bengali' },
    { id: 'Marathi', label: '🇮🇳 Marathi' },
    { id: 'Tamil', label: '🇮🇳 Tamil' },
    { id: 'Telugu', label: '🇮🇳 Telugu' },
    { id: 'Gujarati', label: '🇮🇳 Gujarati' },
    { id: 'Spanish', label: '🇪🇸 Spanish' },
    { id: 'French', label: '🇫🇷 French' },
    { id: 'German', label: '🇩🇪 German' },
    { id: 'Japanese', label: '🇯🇵 Japanese' }
];

const MODES = [
    { id: 'podcast', label: '🎙️ Podcast (Debate)' },
    { id: 'audiobook', label: '📖 Audiobook (Story)' }
];

export const AuraPodcast: React.FC<AuraPodcastProps> = ({ isOpen, onClose }) => {
    const [topic, setTopic] = useState("Artificial Intelligence");
    const [customTopic, setCustomTopic] = useState("");
    const [language, setLanguage] = useState("English");
    const [mode, setMode] = useState<'podcast' | 'audiobook'>('podcast');
    const [status, setStatus] = useState<'idle' | 'scripting' | 'recording' | 'playing'>('idle');
    const [script, setScript] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Audio Visualization fake bars
    const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

    useEffect(() => {
        let interval: any;
        if (status === 'playing') {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 80 + 10));
            }, 100);
        } else {
            setBars(new Array(20).fill(10));
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleGenerate = async () => {
        const finalTopic = customTopic || topic;
        setStatus('scripting');
        setScript("");
        setAudioUrl(null);

        try {
            let scriptText = "";
            let url = "";

            if (mode === 'podcast') {
                // 1. Generate Podcast Script (Dialogue)
                scriptText = await generatePodcastScript(finalTopic, language);
                setScript(scriptText);
                setStatus('recording');

                // 2. Generate Multi-Speaker Audio
                url = await generateMultiSpeakerAudio(scriptText);
            } else {
                // 1. Generate Audiobook Script (Narration)
                scriptText = await generateAudiobookScript(finalTopic, language);
                setScript(scriptText);
                setStatus('recording');

                // 2. Generate Single-Speaker Audio (Aura Voice)
                url = await generateSpeechDownloadUrl(scriptText, 'Kore');
            }

            setAudioUrl(url);
            setStatus('idle');
            
            // Auto play
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play();
                    setStatus('playing');
                }
            }, 500);

        } catch (e) {
            console.error(e);
            alert("Failed to generate audio.");
            setStatus('idle');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 font-sans text-white">
            
            {/* Main Player Container */}
            <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/40 to-black">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg animate-pulse">
                            {mode === 'podcast' ? '🎙️' : '📖'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-wide">Aura Audio Studio</h2>
                            <p className="text-xs text-purple-300 uppercase tracking-widest">
                                {mode === 'podcast' ? 'Aura vs Mr. Kilvish' : 'Immersive Storytelling'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">✕</button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    
                    {/* Controls */}
                    {status === 'idle' && !audioUrl && (
                        <div className="space-y-4 animate-fade-in-up">
                            
                            {/* Mode Selector */}
                            <div className="flex bg-white/5 p-1 rounded-xl">
                                {MODES.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id as any)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-purple-600 text-white shadow' : 'text-white/50 hover:text-white'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Language Selector */}
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase block mb-2">Language</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.id}
                                            onClick={() => setLanguage(lang.id)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${language === lang.id ? 'bg-white/20 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase block mb-2">Select Topic</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {TOPICS.map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => { setTopic(t); setCustomTopic(""); }}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${topic === t && !customTopic ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <input 
                                    type="text" 
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    placeholder="Or type custom topic (e.g. History of Bitcoin)"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 focus:border-purple-500 outline-none text-white transition-all text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleGenerate}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-sm shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>✨</span> Generate {mode === 'podcast' ? 'Podcast' : 'Audiobook'}
                            </button>
                        </div>
                    )}

                    {/* Status / Loading */}
                    {(status === 'scripting' || status === 'recording') && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-lg font-bold animate-pulse">
                                {status === 'scripting' ? "Writing Script..." : "Recording Voice..."}
                            </h3>
                            <p className="text-xs text-white/40">
                                {mode === 'podcast' ? 'Aura & Kilvish are preparing...' : 'Narrator is clearing throat...'}
                            </p>
                        </div>
                    )}

                    {/* Player UI */}
                    {audioUrl && (
                        <div className="flex flex-col gap-6 animate-fade-in-up">
                            {/* Visualizer */}
                            <div className="h-32 bg-black/40 rounded-2xl border border-white/5 flex items-end justify-center gap-1 p-4 overflow-hidden">
                                {bars.map((height, i) => (
                                    <div 
                                        key={i} 
                                        className="w-2 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-full transition-all duration-100 ease-in-out"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                ))}
                            </div>

                            {/* Audio Element (Hidden mostly, customized controls) */}
                            <audio 
                                ref={audioRef} 
                                src={audioUrl} 
                                onPlay={() => setStatus('playing')} 
                                onPause={() => setStatus('idle')}
                                onEnded={() => setStatus('idle')}
                                controls
                                className="w-full invert opacity-80"
                            />

                            {/* Script Display */}
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                                <h4 className="text-xs font-bold text-white/50 uppercase mb-2 sticky top-0 bg-[#1a1a1a] pb-2">Transcript ({language})</h4>
                                <pre className="whitespace-pre-wrap font-sans text-sm text-white/80 leading-relaxed">
                                    {script}
                                </pre>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => { setAudioUrl(null); setStatus('idle'); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs">
                                    New Topic
                                </button>
                                <a href={audioUrl} download={`aura-audio-${new Date().toISOString()}.wav`} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    Download Audio
                                </a>
                            </div>
                        </div>
                    )}

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
