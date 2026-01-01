
import React, { useState, useRef, useEffect } from 'react';
import { generatePodcastScript, generateMultiSpeakerAudio, generateAudiobookScript, generateSpeechDownloadUrl, blobToBase64 } from '../services/geminiService';
import { storageService } from '../services/storageService';

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
    const [sources, setSources] = useState<any>(null); 
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

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
        if (!finalTopic) return;

        setStatus('scripting');
        setScript("");
        setSources(null);
        setAudioUrl(null);
        setAudioBlob(null);

        try {
            let scriptText = "";
            let url = "";
            if (mode === 'podcast') {
                const result = await generatePodcastScript(finalTopic, language);
                scriptText = result.text;
                setSources(result.groundingMetadata); 
                setScript(scriptText);
                setStatus('recording');
                url = await generateMultiSpeakerAudio(scriptText);
            } else {
                scriptText = await generateAudiobookScript(finalTopic, language);
                setScript(scriptText);
                setStatus('recording');
                url = await generateSpeechDownloadUrl(scriptText, 'Kore');
            }

            // Fetch blob for saving
            const res = await fetch(url);
            const blob = await res.blob();
            setAudioBlob(blob);
            setAudioUrl(url);

            setStatus('idle');
            setTimeout(() => { if (audioRef.current) audioRef.current.play(); setStatus('playing'); }, 500);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `Aura_${mode}_${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSaveToVault = async () => {
        if (!audioBlob) return;
        setIsSaving(true);
        try {
            const base64Data = await blobToBase64(audioBlob);
            await storageService.saveFile({
                id: `pod_${Date.now()}`,
                name: `Aura ${mode.toUpperCase()} - ${customTopic || topic}`,
                type: 'audio/wav',
                data: base64Data,
                timestamp: Date.now()
            });
            alert("Episode saved to your Neural Vault! 🛡️🎙️");
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 font-sans text-white animate-in zoom-in duration-300">
            <div className="w-full max-w-4xl bg-[#0f0f12] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative h-[85vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/30 to-black shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20 border-2 border-white/10">
                            {mode === 'podcast' ? '🎙️' : '📖'}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Aura Audio Studio</h2>
                            <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mt-1">
                                {mode === 'podcast' ? 'Deep Analysis • Debate Protocol' : 'Immersive Narrative Engine'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    {!script ? (
                        <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                            <div className="grid grid-cols-2 gap-4">
                                {MODES.map(m => (
                                    <button key={m.id} onClick={() => setMode(m.id as any)} className={`p-4 rounded-2xl border-2 text-left transition-all ${mode === m.id ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                                        <div className="font-bold text-sm mb-1 text-white">{m.label}</div>
                                        <div className="text-[10px] text-white/50 font-medium">{m.desc}</div>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Topic Selection</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {PREDEFINED_TOPICS.map(t => (
                                        <button key={t.id} onClick={() => { setTopic(t.prompt); setCustomTopic(""); }} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${topic === t.prompt ? 'bg-purple-600 border-purple-400' : 'bg-white/5 border-transparent'}`}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <input 
                                    type="text" 
                                    value={customTopic} 
                                    onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }} 
                                    placeholder="Or type a custom topic..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-3">Language</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {LANGUAGES.map(lang => (
                                        <button key={lang.id} onClick={() => setLanguage(lang.id)} className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${language === lang.id ? 'bg-white text-black border-white' : 'bg-black border-white/20 text-white/60 hover:text-white'}`}>
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleGenerate} disabled={status === 'scripting' || (!topic && !customTopic)} className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">
                                {status === 'scripting' ? "Analyzing..." : "Generate Audio"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="h-40 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center gap-1.5 p-8 mb-6 relative overflow-hidden">
                                {bars.map((height, i) => (
                                    <div key={i} className="w-2 bg-gradient-to-t from-purple-500 via-pink-500 to-white rounded-full transition-all duration-100 ease-linear" style={{ height: `${height}%` }}></div>
                                ))}
                                {audioUrl && <audio ref={audioRef} src={audioUrl} onPlay={() => setStatus('playing')} onPause={() => setStatus('idle')} controls className="absolute bottom-4 w-[90%] opacity-80" />}
                            </div>

                            <div className="flex gap-4 mb-6 shrink-0">
                                <button onClick={handleDownload} className="flex-1 py-4 bg-purple-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                    💾 SAVE TO DEVICE
                                </button>
                                <button onClick={handleSaveToVault} disabled={isSaving} className="flex-1 py-4 bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2">
                                    {isSaving ? '...' : '🛡️ NEURAL VAULT'}
                                </button>
                            </div>

                            <div className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-6 overflow-y-auto no-scrollbar">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-white/80 leading-loose">{script}</pre>
                            </div>
                            <button onClick={() => { setScript(""); setAudioUrl(null); }} className="mt-4 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10">Start New Project</button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            `}</style>
        </div>
    );
};
