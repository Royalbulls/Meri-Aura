
import React, { useState, useRef, useEffect } from 'react';
import { generatePodcastScript, generateMultiSpeakerAudio, generateAudiobookScript, generateSpeechDownloadUrl } from '../services/geminiService';

interface AuraPodcastProps {
    isOpen: boolean;
    onClose: () => void;
}

const PREDEFINED_TOPICS = [
    { id: 'geo', label: '🌍 Geopolitics', prompt: 'Current Geopolitical Tensions and Hidden Truths' },
    { id: 'ai', label: '🤖 AI Future', prompt: 'Artificial Intelligence: Savior or Destroyer?' },
    { id: 'spirit', label: '🕉️ Spirituality', prompt: 'Ancient Wisdom vs Modern Science' },
    { id: 'finance', label: '💰 Crypto & Markets', prompt: 'Future of Money, Bitcoin, and Market Crash' },
    { id: 'crime', label: '🕵️ True Crime', prompt: 'Deep analysis of a famous unsolved mystery' },
    { id: 'health', label: '🧬 Bio-Hacking', prompt: 'Future of Human Health and Longevity' },
    { id: 'aliens', label: '👽 UFOs & Space', prompt: 'Are we alone? The dark forest theory.' },
    { id: 'history', label: '📜 Lost History', prompt: 'Civilizations that disappeared without a trace' }
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
    { id: 'podcast', label: '🎙️ Debate (Aura vs Kilvish)', desc: 'Intense, Factual, Argumentative' },
    { id: 'audiobook', label: '📖 Audiobook (Story)', desc: 'Immersive, Cinematic, Deep' }
];

export const AuraPodcast: React.FC<AuraPodcastProps> = ({ isOpen, onClose }) => {
    const [topic, setTopic] = useState("");
    const [customTopic, setCustomTopic] = useState("");
    const [language, setLanguage] = useState("English");
    const [mode, setMode] = useState<'podcast' | 'audiobook'>('podcast');
    const [status, setStatus] = useState<'idle' | 'scripting' | 'recording' | 'playing' | 'error'>('idle');
    const [script, setScript] = useState("");
    const [sources, setSources] = useState<any>(null); // To store grounding metadata
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Audio Visualization fake bars
    const [bars, setBars] = useState<number[]>(new Array(30).fill(10));

    useEffect(() => {
        let interval: any;
        if (status === 'playing') {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 90 + 10));
            }, 80);
        } else {
            setBars(new Array(30).fill(5));
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleGenerate = async () => {
        const finalTopic = customTopic || topic;
        if (!finalTopic) {
            alert("Please select a topic or enter a custom one.");
            return;
        }

        setStatus('scripting');
        setScript("");
        setSources(null);
        setAudioUrl(null);

        try {
            let scriptText = "";
            
            if (mode === 'podcast') {
                // 1. Generate Podcast Script (Dialogue) with Deep Analysis
                const result = await generatePodcastScript(finalTopic, language);
                scriptText = result.text;
                setSources(result.groundingMetadata); // Store Deep Analysis Sources
                setScript(scriptText);
                
                setStatus('recording'); // UI update

                // 2. Generate Multi-Speaker Audio
                const url = await generateMultiSpeakerAudio(scriptText);
                setAudioUrl(url);
            } else {
                // 1. Generate Audiobook Script (Narration)
                scriptText = await generateAudiobookScript(finalTopic, language);
                setScript(scriptText);
                setStatus('recording');

                // 2. Generate Single-Speaker Audio (Aura Voice)
                const url = await generateSpeechDownloadUrl(scriptText, 'Kore');
                setAudioUrl(url);
            }

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
            setStatus('error');
        }
    };

    const handleRetryAudio = async () => {
        if (!script) return;
        setStatus('recording');
        try {
            const url = mode === 'podcast' ? await generateMultiSpeakerAudio(script) : await generateSpeechDownloadUrl(script, 'Kore');
            setAudioUrl(url);
            setStatus('idle');
        } catch(e) {
            alert("Audio retry failed.");
            setStatus('error');
        }
    };

    const renderSources = () => {
        if (!sources || !sources.groundingChunks) return null;
        return (
            <div className="mt-6 border-t border-white/10 pt-4 animate-fade-in-up">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>🌍</span> Deep Analysis • Verified Sources
                </h4>
                <div className="grid gap-2">
                    {sources.groundingChunks.map((chunk: any, i: number) => (
                        chunk.web?.uri && (
                            <a 
                                key={i} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
                            >
                                <div className="text-xl">🔗</div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-white group-hover:text-green-300 truncate">{chunk.web.title}</div>
                                    <div className="text-[10px] text-white/40 truncate">{chunk.web.uri}</div>
                                </div>
                            </a>
                        )
                    ))}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 font-sans text-white">
            
            {/* Main Player Container */}
            <div className="w-full max-w-4xl bg-[#0f0f12] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative h-[85vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/30 to-black shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20 animate-pulse-slow border-2 border-white/10">
                            {mode === 'podcast' ? '🎙️' : '📖'}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Aura Audio Studio</h2>
                            <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mt-1">
                                {mode === 'podcast' ? 'Deep Analysis • Debate Protocol' : 'Immersive Narrative Engine'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    
                    {/* CONFIGURATION PHASE */}
                    {!script && (
                        <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                            
                            {/* Mode Selector */}
                            <div className="grid grid-cols-2 gap-4">
                                {MODES.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id as any)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${mode === m.id ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                    >
                                        <div className="font-bold text-sm mb-1 text-white">{m.label}</div>
                                        <div className="text-[10px] text-white/50 font-medium">{m.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Language Selector */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-3">Select Language</label>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.id}
                                            onClick={() => setLanguage(lang.id)}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${language === lang.id ? 'bg-white text-black border-white' : 'bg-black border-white/20 text-white/60 hover:text-white hover:border-white/50'}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Topic Selection */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-3">Choose Topic</label>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {PREDEFINED_TOPICS.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => { setTopic(t.prompt); setCustomTopic(""); }}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold text-left border transition-all ${topic === t.prompt && !customTopic ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={customTopic}
                                        onChange={(e) => setCustomTopic(e.target.value)}
                                        placeholder="Or type any specific topic for deep analysis..."
                                        className="w-full bg-black/50 border border-white/20 rounded-2xl p-4 pl-12 focus:border-purple-500 outline-none text-white transition-all text-sm shadow-inner"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">🔍</div>
                                </div>
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={status === 'scripting'}
                                className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-white/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {status === 'scripting' ? <span className="animate-spin">⏳</span> : <span>✨</span>}
                                {status === 'scripting' ? "Initializing Studio..." : `Generate ${mode === 'podcast' ? 'Debate' : 'Audiobook'}`}
                            </button>
                        </div>
                    )}

                    {/* LOADING PHASE (Only when no script) */}
                    {(status === 'scripting' && !script) && (
                        <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in-up">
                            <div className="relative">
                                <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full animate-spin-slow"></div>
                                <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">📝</div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Analyzing Data...</h3>
                                <p className="text-sm text-white/50 max-w-md mx-auto">Aura is gathering ground-level facts and performing deep analysis...</p>
                            </div>
                        </div>
                    )}

                    {/* RESULTS PHASE (Script is ready) */}
                    {script && (
                        <div className="flex flex-col h-full animate-fade-in-up">
                            
                            {/* Visualizer (Only if Audio Ready) */}
                            {audioUrl && (
                                <div className="h-40 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center gap-1.5 p-8 mb-6 relative overflow-hidden shadow-inner">
                                    <div className="absolute inset-0 bg-purple-500/10 blur-3xl"></div>
                                    {bars.map((height, i) => (
                                        <div 
                                            key={i} 
                                            className="w-2 bg-gradient-to-t from-purple-500 via-pink-500 to-white rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    ))}
                                    <audio 
                                        ref={audioRef} 
                                        src={audioUrl} 
                                        onPlay={() => setStatus('playing')} 
                                        onPause={() => setStatus('idle')}
                                        onEnded={() => setStatus('idle')}
                                        controls
                                        className="absolute bottom-4 w-[90%] opacity-80"
                                    />
                                </div>
                            )}

                            {/* Status Bar: Recording or Error */}
                            {status === 'recording' && (
                                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-2xl mb-6 flex items-center gap-4 animate-pulse">
                                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-sm font-bold text-purple-300">Synthesizing Voice Actors... This may take 30s.</div>
                                </div>
                            )}
                            
                            {status === 'error' && !audioUrl && (
                                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl mb-6 flex justify-between items-center">
                                    <div className="text-sm font-bold text-red-300">Audio generation failed.</div>
                                    <button onClick={handleRetryAudio} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold text-white uppercase">Retry Audio</button>
                                </div>
                            )}

                            {/* Transcript */}
                            <div className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col relative">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">Transcript • {language}</h4>
                                    <button onClick={() => navigator.clipboard.writeText(script)} className="text-[10px] text-white/40 hover:text-white uppercase font-bold">Copy Text</button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-white/80 leading-loose">
                                        {script}
                                    </pre>
                                </div>
                            </div>

                            {/* DEEP ANALYSIS SOURCES */}
                            {renderSources()}
                            
                            {/* Actions */}
                            <div className="flex gap-4 mt-6">
                                <button onClick={() => { setAudioUrl(null); setScript(""); setStatus('idle'); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
                                    Create New
                                </button>
                                {audioUrl && (
                                    <a href={audioUrl} download={`aura-podcast-${Date.now()}.wav`} className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-lg">
                                        <span>💾</span> Download Audio
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
                .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
};
