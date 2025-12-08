
import React, { useState, useEffect, useRef } from 'react';
import { AvatarState, AvatarLayout } from '../types';

interface AvatarDisplayProps {
  avatarState: AvatarState;
  audioLevel: number; // 0 to 255, drives the animation
  isThinking: boolean; // Processing state for "Thinking" aura
  onAnimateRequest?: () => void; // Direct trigger to animate
  isUserTyping?: boolean; // New: React to user typing
  layout?: AvatarLayout; // New: User controlled position/scale
  onDownloadVideo?: () => void; // New: Direct download trigger
  onDownloadImage?: () => void; // New: Direct image download trigger
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
    avatarState, 
    audioLevel, 
    isThinking, 
    onAnimateRequest, 
    isUserTyping,
    layout = { scale: 1.0, x: 0, y: 0 },
    onDownloadVideo,
    onDownloadImage
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showIntro, setShowIntro] = useState(false);
  
  // Trigger Intro Animation when loading finishes
  useEffect(() => {
      if (!avatarState.isLoading && (avatarState.imageUrl || avatarState.videoUrl)) {
          setShowIntro(true);
          const timer = setTimeout(() => setShowIntro(false), 1000);
          return () => clearTimeout(timer);
      }
  }, [avatarState.isLoading, avatarState.imageUrl, avatarState.videoUrl]);
  
  // Normalize audio level for CSS scaling (0 to 1) - Used only for Aura now
  const normalizedLevel = audioLevel > 5 ? (audioLevel / 255) : 0;
  const isTalking = normalizedLevel > 0;

  // Ensure video plays
  useEffect(() => {
    if (avatarState.videoUrl && videoRef.current) {
        videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
    }
  }, [avatarState.videoUrl]);

  // --- AURA STYLES (Simpler & Faster) ---
  const getAuraStyle = () => {
    if (avatarState.isTalking || isTalking) {
        return {
            background: `radial-gradient(circle at center, rgba(236, 72, 153, 0.5) 0%, rgba(17, 24, 39, 1) 70%)`,
            opacity: 0.8
        };
    } else if (isThinking) {
        return {
            background: `radial-gradient(circle at center, rgba(168, 85, 247, 0.4) 0%, rgba(17, 24, 39, 1) 70%)`,
            opacity: 0.9,
            animation: 'pulseFast 1.5s infinite ease-in-out'
        };
    } else if (isUserTyping) {
        // NEON FOCUS MODE: Cyan/Pink Glow when user types
        return {
            background: `radial-gradient(circle at center, rgba(6, 182, 212, 0.4) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(17, 24, 39, 1) 80%)`,
            opacity: 0.85,
            animation: 'neonPulse 2s infinite ease-in-out'
        };
    } else {
        return {
            background: `radial-gradient(circle at center, rgba(79, 70, 229, 0.15) 0%, rgba(17, 24, 39, 1) 70%)`,
            opacity: 0.5
        };
    }
  };

  const auraStyle = getAuraStyle();

  return (
    <div className="relative w-full h-full flex items-end justify-center bg-gray-900 overflow-hidden">
        
        {/* Background Aura (Static/Simple Pulse) */}
        <div 
          className="absolute inset-0 z-0 transition-opacity duration-500 ease-out"
          style={auraStyle}
        ></div>

      {/* The Character Wrapper (Handles Layout Position) */}
      <div 
        className="relative z-10 w-full h-full flex items-end justify-center transition-transform duration-100 ease-linear"
        style={{
            transform: `translate(${layout.x}%, ${layout.y}%) scale(${layout.scale})`
        }}
      >
          {/* SKELETON LOADER (Shimmering Silhouette) */}
          {avatarState.isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-0 pointer-events-none z-20">
                   {/* Text Loading Indicator */}
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-30">
                        <div className="w-12 h-12 border-4 border-t-pink-500 border-white/10 rounded-full animate-spin"></div>
                        <span className="text-pink-400 text-xs font-bold tracking-[0.2em] animate-pulse bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                            MANIFESTING AURA...
                        </span>
                   </div>

                   {/* Humanoid Shape Skeleton */}
                   <div className="w-[300px] h-[85%] relative opacity-60 flex flex-col items-center animate-pulse-slow">
                        {/* Head */}
                        <div className="w-40 h-48 bg-white/5 rounded-[40%] mb-2 relative overflow-hidden backdrop-blur-sm border border-white/5">
                            <div className="absolute inset-0 -translate-x-full shimmer-gradient"></div>
                        </div>
                        {/* Body */}
                        <div className="w-full h-full bg-white/5 rounded-t-[120px] relative overflow-hidden backdrop-blur-sm border border-white/5">
                             <div className="absolute inset-0 -translate-x-full shimmer-gradient"></div>
                        </div>
                   </div>
              </div>
          )}

          {/* Intro Animation Wrapper */}
          <div className={`w-full h-full flex items-end justify-center ${showIntro ? 'animate-intro' : ''} ${avatarState.isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
              {avatarState.videoUrl ? (
                 <video
                    ref={videoRef}
                    src={avatarState.videoUrl}
                    loop
                    muted
                    playsInline
                    autoPlay
                    className={`
                        w-full h-full object-cover md:object-contain object-bottom filter drop-shadow-2xl transition-transform duration-500
                        ${isUserTyping ? 'scale-105 brightness-110' : 'scale-100'} 
                    `}
                 />
              ) : avatarState.imageUrl ? (
                 <img 
                    src={avatarState.imageUrl} 
                    alt="AI Persona" 
                    className={`
                        w-full h-full object-cover md:object-contain object-bottom
                        filter drop-shadow-2xl
                        transition-transform duration-300
                    `}
                    style={{
                        transformOrigin: 'bottom center',
                        filter: isUserTyping ? 'brightness(1.15) drop-shadow(0 0 15px rgba(6,182,212,0.3))' : 'none'
                    }}
                />
              ) : null}
          </div>
      </div>

      {/* DOWNLOAD VIDEO BUTTON */}
      {avatarState.videoUrl && onDownloadVideo && !avatarState.isLoading && (
          <button 
            onClick={onDownloadVideo}
            className="absolute top-20 left-4 z-40 bg-black/60 backdrop-blur-md text-white p-3 rounded-full border border-white/20 hover:bg-pink-600 transition-colors shadow-xl group"
            title="Save Avatar Video"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
      )}

      {/* DOWNLOAD IMAGE BUTTON (New) */}
      {!avatarState.videoUrl && avatarState.imageUrl && onDownloadImage && !avatarState.isLoading && (
          <button 
            onClick={onDownloadImage}
            className="absolute top-20 left-4 z-40 bg-black/60 backdrop-blur-md text-white p-3 rounded-full border border-white/20 hover:bg-pink-600 transition-colors shadow-xl group"
            title="Save Aura Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
      )}

      {/* MAKE ALIVE BUTTON */}
      {!avatarState.videoUrl && !avatarState.isLoading && avatarState.imageUrl && onAnimateRequest && (
          <button 
            onClick={onAnimateRequest}
            className="absolute bottom-24 right-4 z-40 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/20 hover:bg-pink-600 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
               <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-3.763 0-6.16 2.895-6 6.06.167 3.29 2.7 5.276 3.64 6.643.546.79 1.154 1.529 1.815 2.203.273.28.69.28.963 0 1.25-1.276 2.37-2.675 3.325-4.162.775-1.207 1.255-2.584 1.392-4.008a6.38 6.38 0 00-1.054-4.524 6.38 6.38 0 00-4.523-1.054.75.75 0 01-.19-.19z" />
            </svg>
            ✨ Animate Me
          </button>
      )}
      
      <style>{`
        .shimmer-gradient {
            width: 150%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        @keyframes introPop {
             0% { opacity: 0; transform: scale(0.9) translateY(40px); }
             60% { opacity: 1; transform: scale(1.02) translateY(-10px); }
             100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-intro {
            animation: introPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes pulseFast {
             0% { opacity: 0.7; transform: scale(1); }
             50% { opacity: 1; transform: scale(1.02); }
             100% { opacity: 0.7; transform: scale(1); }
        }
        @keyframes neonPulse {
            0% { opacity: 0.8; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.2); }
            100% { opacity: 0.8; filter: brightness(1); }
        }
      `}</style>
    </div>
  );
};
