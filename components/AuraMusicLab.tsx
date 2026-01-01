
import React, { useState, useRef, useEffect } from 'react';
import { generateCreativeContent, generateSpeechDownloadUrl, blobToBase64 } from '../services/geminiService';
import { Persona, StoredFile } from '../types';
import { storageService } from '../services/storageService';
import { securityService } from '../services/securityService';

interface AuraProductionHouseProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

type StudioTab = 'music' | 'voice' | 'marketing' | 'library';

interface SongStructure {
    title: string;
    lyrics: string;
    musicSpec: string;
}

export const AuraMusicLab: React.FC<AuraProductionHouseProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeTab, setActiveTab] = useState<StudioTab>('music');
    const [topic, setTopic] = useState("");
    const [songData, setSongData] = useState<SongStructure | null>(null);
    const [editMode, setEditMode] = useState<{title?: boolean, lyrics?: boolean, musicSpec?: boolean}>({});
    
    // Process States
    const [isProcessing, setIsProcessing] = useState(false);
    const [isVocalizing, setIsVocalizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [libraryFilter, setLibraryFilter] = useState<'private' | 'public'>('private');
    
    // Audio States
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [savedHits, setSavedHits] = useState<StoredFile[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);
    
    // Security
    const [vaultKey, setVaultKey] = useState("");
    
    const [bars, setBars] = useState<number[]>(new Array(30).fill(10));

    useEffect(() => {
        if (isOpen) loadLibrary();
    }, [isOpen]);

    useEffect(() => {
        let interval: any;
        if (isVocalizing || (audioRef.current && !audioRef.current.paused)) {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 80 + 20));
            }, 100);
        } else {
            setBars(new Array(30).fill(5));
        }
        return () => clearInterval(interval);
    }, [isVocalizing]);

    const loadLibrary = async () => {
        const files = await storageService.getAllFiles();
        setSavedHits(files.filter(f => f.type === 'audio/wav').sort((a, b) => b.timestamp - a.timestamp));
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsProcessing(true);
        setSongData(null);
        setAudioUrl(null);

        let prompt = "";
        if (activeTab === 'music') {
            prompt = `
            TASK: GENERATE STRUCTURED SONG CONTENT FOR ROYAL BULLS ADVISORY PRIVATE LIMITED.
            FORMAT: 
            [TITLE]: Short catchy name.
            [LYRICS]: Full song structure.
            [MUSIC]: Detailed melody, instruments, and rhythm specs.
            
            TOPIC: "${topic}". LANGUAGE: Hinglish.
            NO CONVERSATION. OUTPUT ONLY THE 3 PARTS.
            `;
        } else if (activeTab === 'voice') {
            prompt = `TASK: Generate a high-energy Podcast/Speech script about "${topic}". Language: Hinglish. BRAND: Royal Bulls Advisory Pvt Ltd. OUTPUT ONLY SCRIPT.`;
        } else {
            prompt = `TASK: Generate a complete 30-day Marketing Strategy for "${topic}". BRAND: Royal Bulls Advisory Pvt Ltd. Registered 2020. Language: Hinglish. OUTPUT ONLY STRATEGY.`;
        }

        try {
            const result = await generateCreativeContent('chat', prompt, currentPersona);
            if (activeTab === 'music') {
                const titleMatch = result.text.match(/\[TITLE\]:?([\s\S]*?)(?=\[LYRICS\]|$)/i);
                const lyricsMatch = result.text.match(/\[LYRICS\]:?([\s\S]*?)(?=\[MUSIC\]|$)/i);
                const musicMatch = result.text.match(/\[MUSIC\]:?([\s\S]*?)$/i);
                
                setSongData({
                    title: titleMatch ? titleMatch[1].trim() : "Untitled Aura Hit",
                    lyrics: lyricsMatch ? lyricsMatch[1].trim() : result.text,
                    musicSpec: musicMatch ? musicMatch[1].trim() : "Deep Bass, Energetic Vibe"
                });
            } else {
                setSongData({ title: 'Aura Output', lyrics: result.text, musicSpec: '' });
            }
        } catch (e) {
            alert("Studio link down!");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVocalize = async () => {
        if (!songData) return;
        setIsVocalizing(true);
        try {
            const performanceScript = `(Performing ${songData.title}): ${songData.lyrics.substring(0, 500)}`;
            const url = await generateSpeechDownloadUrl(performanceScript, 'Kore');
            const res = await fetch(url);
            const blob = await res.blob();
            setAudioBlob(blob);
            setAudioUrl(url);
            setTimeout(() => audioRef.current?.play(), 500);
        } catch (e) {
            alert("Mic testing failed!");
        } finally {
            setIsVocalizing(false);
        }
    };

    // Fix: Implemented handleDownload to handle track and library item downloads.
    const handleDownload = (data?: string, filename?: string) => {
        const url = data || audioUrl;
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename ? `${filename}.wav` : `${songData?.title || 'Aura_Track'}_${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSaveProduction = async (isPublic: boolean) => {
        if (!audioBlob || !songData) return;
        
        if (!isPublic && !vaultKey) {
            alert("🔒 Enter a Vault Key to encrypt your private asset.");
            return;
        }

        setIsSaving(true);
        try {
            let dataToSave = await blobToBase64(audioBlob);
            
            if (!isPublic) {
                dataToSave = await securityService.encrypt(dataToSave, vaultKey);
            }

            await storageService.saveFile({
                id: `${isPublic ? 'pub' : 'priv'}_${Date.now()}`,
                name: songData.title,
                type: 'audio/wav',
                data: dataToSave,
                timestamp: Date.now(),
                isPublic: isPublic,
                isEncrypted: !isPublic
            });
            
            alert(isPublic ? "🌐 Published to Public Gallery!" : "🛡️ Secured in Private Vault!");
            loadLibrary();
            setVaultKey("");
        } catch (e) {
            alert("Production save failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReplay = async (hit: StoredFile) => {
        if (hit.isEncrypted) {
            const key = prompt("🔒 This asset is encrypted. Enter Vault Key:");
            if (!key) return;
            try {
                const decryptedData = await securityService.decrypt(hit.data, key);
                setAudioUrl(decryptedData);
                setTimeout(() => audioRef.current?.play(), 300);
            } catch (e) {
                alert("❌ Invalid Vault Key!");
            }
        } else {
            setAudioUrl(hit.data);
            setTimeout(() => audioRef.current?.play(), 300);
        }
    };

    const handleShare = (hit: StoredFile) => {
        const shareData = btoa(JSON.stringify({ n: hit.name, d: hit.data }));
        const url = `${window.location.origin}/?asset=${shareData}`;
        navigator.clipboard.writeText(url);
        alert("🔗 Neural Share Link copied!");
    };

    const toggleEdit = (field: keyof SongStructure) => {
        setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const updateField = (field: keyof SongStructure, val: string) => {
        if (songData) setSongData({ ...songData, [field]: val });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] bg-[#050508] flex flex-col font-sans text-white overflow-hidden animate-in fade-in duration-500">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-600/20 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

            {/* STUDIO HEADER */}
            <div className="h-20 px-4 md:px-8 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-3xl z-50 shrink-0">
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl animate-pulse">🏛️</div>
                        <div>
                            <h2 className="text-sm md:xl font-black tracking-tighter uppercase leading-tight">Royal Bulls Studio</h2>
                            <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Advanced Media Production</p>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                        {(['music', 'voice', 'marketing', 'library'] as StudioTab[]).map(tab => (
                            <button 
                                key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500/20 rounded-2xl flex items-center justify-center transition-all border border-white/10">✕</button>
            </div>

            {/* MOBILE TAB SWITCHER */}
            <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 p-3 bg-black/20 border-b border-white/5 shrink-0">
                {(['music', 'voice', 'marketing', 'library'] as StudioTab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === tab ? 'bg-pink-600 text-white' : 'bg-white/5 text-white/40'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-12 pb-32 md:pb-12">
                    <div className="max-w-5xl mx-auto w-full space-y-8">
                        
                        {activeTab !== 'library' ? (
                            <>
                                <div className="p-6 md:p-10 bg-white/5 border border-white/10 rounded-[2.5rem] md:rounded-[4rem] backdrop-blur-3xl relative overflow-hidden group text-center">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-400 mb-6">Production Brief</h3>
                                    <textarea 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder={`Explain your idea... (e.g. ${activeTab === 'music' ? 'Royal Bulls Rap' : 'Cyber Security Podcast'})`}
                                        className="w-full h-32 bg-transparent outline-none text-xl md:text-3xl font-light placeholder-white/5 resize-none text-center"
                                    />
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isProcessing || !topic.trim()}
                                        className="w-full h-16 md:h-20 mt-6 bg-white text-black hover:bg-pink-600 hover:text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50"
                                    >
                                        {isProcessing ? <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div> : <>⚡ START PRODUCTION</>}
                                    </button>
                                </div>

                                {songData && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 pb-20">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-6 flex flex-col">
                                                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-6 relative group shadow-xl">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Project Title</span>
                                                        <button onClick={() => toggleEdit('title')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">✏️</button>
                                                    </div>
                                                    {editMode.title ? (
                                                        <input value={songData.title} onChange={(e) => updateField('title', e.target.value)} className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-3 text-lg font-black outline-none" />
                                                    ) : (
                                                        <h3 className="text-3xl md:text-4xl font-black tracking-tight">{songData.title}</h3>
                                                    )}
                                                </div>

                                                <div className="bg-white text-black rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
                                                    <div className="flex items-end gap-1 h-12 w-full px-4">
                                                        {bars.map((h, i) => <div key={i} className="flex-1 bg-black rounded-full" style={{ height: `${h}%` }}></div>)}
                                                    </div>
                                                    <button onClick={handleVocalize} disabled={isVocalizing} className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-600 transition-all flex items-center justify-center gap-3">
                                                        {isVocalizing ? 'MATERIALIZING...' : '🎙️ VOCALIZE TRACK'}
                                                    </button>
                                                    
                                                    {audioUrl && (
                                                        <div className="w-full space-y-4">
                                                            <div className="flex gap-2">
                                                                <audio ref={audioRef} src={audioUrl} controls className="flex-1 h-10" />
                                                                <button onClick={() => handleDownload()} className="px-5 bg-blue-100 border border-blue-200 rounded-xl text-lg hover:bg-blue-200">💾</button>
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <input 
                                                                    type="password" 
                                                                    value={vaultKey} 
                                                                    onChange={(e) => setVaultKey(e.target.value)} 
                                                                    placeholder="Set Private Vault Key..."
                                                                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                                                                />
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <button onClick={() => handleSaveProduction(false)} disabled={isSaving} className="py-4 bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                                        🛡️ SAVE PRIVATE
                                                                    </button>
                                                                    <button onClick={() => handleSaveProduction(true)} disabled={isSaving} className="py-4 bg-pink-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                                        🌐 GO PUBLIC
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col min-h-[500px]">
                                                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                                    <span className="text-[10px] font-black uppercase text-pink-400 tracking-[0.3em]">Master Transcript</span>
                                                    <button onClick={() => toggleEdit('lyrics')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5">Edit</button>
                                                </div>
                                                {editMode.lyrics ? (
                                                    <textarea value={songData.lyrics} onChange={(e) => updateField('lyrics', e.target.value)} className="w-full flex-1 bg-black/40 border border-pink-500/30 rounded-2xl p-6 text-sm leading-loose outline-none resize-none font-sans" />
                                                ) : (
                                                    <pre className="whitespace-pre-wrap font-sans text-sm md:text-lg leading-[2.5] text-white/80 flex-1">{songData.lyrics}</pre>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* PRODUCTION LIBRARY */
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="text-center md:text-left">
                                        <h3 className="text-5xl font-black tracking-tighter uppercase text-white">Asset <span className="text-pink-600">Library</span></h3>
                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.5em] mt-2">Royal Bulls Archive Management</p>
                                    </div>
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                        <button onClick={() => setLibraryFilter('private')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${libraryFilter === 'private' ? 'bg-white text-black' : 'text-white/40'}`}>🛡️ Vault</button>
                                        <button onClick={() => setLibraryFilter('public')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${libraryFilter === 'public' ? 'bg-white text-black' : 'text-white/40'}`}>🌐 Gallery</button>
                                    </div>
                                </div>

                                {savedHits.filter(h => libraryFilter === 'private' ? h.isEncrypted : h.isPublic).length === 0 ? (
                                    <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                        <div className="text-7xl mb-4">{libraryFilter === 'private' ? '🔐' : '🌍'}</div>
                                        <p className="font-black uppercase tracking-widest text-xs">No {libraryFilter} assets found.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {savedHits.filter(h => libraryFilter === 'private' ? h.isEncrypted : h.isPublic).map(hit => (
                                            <div key={hit.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${hit.isEncrypted ? 'bg-gray-800' : 'bg-gradient-to-tr from-pink-600 to-purple-600'}`}>
                                                    {hit.isEncrypted ? '🔐' : '🎧'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl text-white uppercase truncate">{hit.name}</h4>
                                                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">{new Date(hit.timestamp).toLocaleDateString()} • {hit.isEncrypted ? 'ENCRYPTED' : 'PUBLIC'}</p>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                                    <button onClick={() => handleReplay(hit)} className="py-4 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all">
                                                        PLAY
                                                    </button>
                                                    {hit.isPublic ? (
                                                        <button onClick={() => handleShare(hit)} className="py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                                            SHARE
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleDownload(hit.data, hit.name)} className="py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                                            SAVE
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-10 bg-black/60 border-t border-white/5 fixed bottom-20 left-0 right-0 z-[600] flex items-center justify-center px-8 hidden md:flex">
                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20">Royal Bulls Advisory Private Limited • Asset Management Core</p>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(236,72,153,0.2); border-radius: 4px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
