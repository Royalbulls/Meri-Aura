
import React, { useRef, useState, useEffect } from 'react';
import { generateCreativeContent, generateSpeech } from '../services/geminiService';
import { Persona } from '../types';

interface LiveScannerProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

export const LiveScanner: React.FC<LiveScannerProps> = ({ isOpen, onClose, currentPersona }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // States
    const [isThinking, setIsThinking] = useState(false); // Passive thinking
    const [isAnswering, setIsAnswering] = useState(false); // Active Q&A processing
    const [passiveLabel, setPassiveLabel] = useState<string>("Initializing Vision...");
    const [activeResult, setActiveResult] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false); // Freeze frame state

    // Audio Context for TTS
    const audioContextRef = useRef<AudioContext | null>(null);

    // --- 1. CAMERA SETUP ---
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isOpen) {
            startCamera().then(s => stream = s);
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            window.speechSynthesis.cancel();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraError(false);
            return stream;
        } catch (e) {
            console.error("Camera failed", e);
            setCameraError(true);
            return null;
        }
    };

    // --- 2. PASSIVE LOOP (The "Awareness" Layer) ---
    useEffect(() => {
        let intervalId: any;
        if (isOpen && !cameraError && !isFrozen && !isAnswering) {
            intervalId = setInterval(() => {
                if (!isThinking) runPassiveScan();
            }, 3500); // Check every 3.5s
        }
        return () => clearInterval(intervalId);
    }, [isOpen, cameraError, isFrozen, isThinking, isAnswering]);

    const runPassiveScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsThinking(true);
        
        try {
            const base64 = captureFrame(0.5); // Low res for speed
            // Very short prompt for speed
            const result = await generateCreativeContent(
                'vision_scan', 
                'Identify the main subject in 3-5 words. No filler.', 
                currentPersona, 
                base64
            );
            // Clean up html tags if any
            const text = result.text.replace(/<[^>]*>?/gm, '').trim();
            if(text) setPassiveLabel(text);
        } catch (e) {
            // Ignore passive errors
        } finally {
            setIsThinking(false);
        }
    };

    // --- 3. ACTIVE INTERACTION (The "Ask" Layer) ---
    const handleAsk = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        // 1. Freeze & Capture
        setIsFrozen(true);
        videoRef.current.pause();
        const base64 = captureFrame(1.0); // High res for details

        // 2. Resume Audio Context (Browser Policy)
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        setIsAnswering(true);
        setActiveResult(null);

        try {
            // 3. Get Location Context
            let location = undefined;
            try {
                await new Promise<void>(resolve => {
                    navigator.geolocation.getCurrentPosition(
                        pos => { location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; resolve(); }, 
                        () => resolve(), 
                        { timeout: 1000 }
                    );
                });
            } catch(e) {}

            // 4. AI Analysis
            const response = await generateCreativeContent(
                'smart_measure', 
                `What am I looking at? Explain in detail. Be conversational.`,
                currentPersona,
                base64,
                undefined,
                location
            );

            setActiveResult(response.text);

            // 5. TTS Response (Concise version)
            const cleanText = response.text.replace(/<[^>]*>?/gm, ' ').substring(0, 300); 
            speakResponse(cleanText);

        } catch (e) {
            setActiveResult("<span style='color:red'>Analysis failed. Connection error.</span>");
        } finally {
            setIsAnswering(false);
        }
    };

    const handleReset = () => {
        setIsFrozen(false);
        setActiveResult(null);
        if (videoRef.current) videoRef.current.play();
        window.speechSynthesis.cancel();
    };

    const captureFrame = (quality: number) => {
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', quality);
    };

    const speakResponse = async (text: string) => {
        if (!audioContextRef.current) return;
        try {
            const buffer = await generateSpeech(text, currentPersona.voiceName, audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
        } catch (e) {
            console.error("TTS failed", e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black font-sans text-white">
            {/* FULL SCREEN CAMERA */}
            <div className="absolute inset-0 bg-gray-900">
                {!cameraError ? (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isFrozen ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-white/50">Camera Access Denied</div>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* --- UI LAYER --- */}
            
            {/* Top Bar: Passive Status */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent h-32 pointer-events-none">
                 <div className="flex flex-col gap-1 pointer-events-auto">
                     <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 border border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                 </div>
                 
                 {/* Passive Indicator Pill */}
                 <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg transition-all duration-500">
                     <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-pink-500 animate-ping' : 'bg-green-500'}`}></div>
                     <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                         {passiveLabel}
                     </span>
                 </div>
            </div>

            {/* Center Focus Reticle (Hidden when answering) */}
            {!activeResult && !isAnswering && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border border-white/30 rounded-[30px] relative opacity-50">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-xl"></div>
                        
                        {/* Scanning Line */}
                        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-scan"></div>
                    </div>
                </div>
            )}

            {/* Bottom Interaction Area */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent min-h-[150px] flex flex-col items-center justify-end">
                
                {/* 1. ANSWER CARD (Active Mode) */}
                {activeResult && (
                    <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 mb-4 animate-slide-up shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                             <h3 className="text-green-400 font-bold text-xs uppercase tracking-widest">Analysis Complete</h3>
                             <button onClick={handleReset} className="p-1 bg-white/10 rounded-full hover:bg-white/20">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                        </div>
                        <div 
                            className="text-sm leading-relaxed text-white/90 max-h-[50vh] overflow-y-auto custom-scrollbar"
                            dangerouslySetInnerHTML={{ __html: activeResult }}
                        />
                    </div>
                )}

                {/* 2. CONTROLS */}
                {!activeResult && (
                    <div className="flex items-center gap-6">
                        {isAnswering ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full border-4 border-t-pink-500 border-white/10 animate-spin"></div>
                                <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing...</span>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={handleAsk}
                                    className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    {/* Mic Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 group-hover:scale-110 transition-transform">
                                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                                    </svg>
                                </button>
                                
                                <div className="absolute -bottom-2 text-[10px] uppercase font-bold text-white/40 tracking-widest">
                                    Tap to Ask
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
                .animate-slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
            `}</style>
        </div>
    );
};
