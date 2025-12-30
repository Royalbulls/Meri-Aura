
import React, { useState, useEffect, useRef } from 'react';
import { AvatarState, AvatarLayout } from '../types';

interface AvatarDisplayProps {
  avatarState: AvatarState;
  audioLevel: number;
  isThinking: boolean;
  isListening?: boolean; 
  layout?: AvatarLayout;
  onInteraction?: (type: 'head' | 'belly' | 'feet') => void;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
    avatarState, 
    audioLevel, 
    isThinking, 
    isListening,
    layout = { scale: 1.0, x: 0, y: 0 },
    onInteraction
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Audio level normalized for Talking Tom style jitters
  const normalizedLevel = audioLevel > 5 ? (audioLevel / 100) : 0;
  const jitter = normalizedLevel > 0.5 ? Math.random() * 2 - 1 : 0;
  const bounce = avatarState.isTalking ? Math.sin(Date.now() / 100) * 2 : 0;

  useEffect(() => {
    if (avatarState.videoUrl && videoRef.current) {
        videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
    }
  }, [avatarState.videoUrl]);

  const getAuraStyle = () => {
    if (isListening) {
        return {
            background: `radial-gradient(circle at center, rgba(37, 99, 235, 0.4) 0%, rgba(2, 2, 5, 1) 70%)`,
            opacity: 1,
            animation: 'memoryRipple 2s infinite ease-out'
        };
    } else if (avatarState.isLoading) {
        return {
            background: `radial-gradient(circle at center, rgba(219, 39, 119, 0.4) 0%, rgba(2, 2, 5, 1) 70%)`,
            opacity: 1,
            animation: 'pulseFast 0.8s infinite ease-in-out'
        };
    } else if (avatarState.isTalking || audioLevel > 5) {
        return {
            background: `radial-gradient(circle at center, rgba(236, 72, 153, 0.3) 0%, rgba(2, 2, 5, 1) 75%)`,
            opacity: 0.7 + (normalizedLevel * 0.3)
        };
    } else if (isThinking) {
        return {
            background: `radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, rgba(2, 2, 5, 1) 70%)`,
            opacity: 0.9,
            animation: 'pulseFast 1.2s infinite ease-in-out'
        };
    } else {
        return {
            background: `radial-gradient(circle at center, rgba(79, 70, 229, 0.1) 0%, rgba(2, 2, 5, 1) 70%)`,
            opacity: 0.4
        };
    }
  };

  return (
    <div className="relative w-full h-full flex items-end justify-center bg-transparent overflow-hidden">
        {/* Glow Layer */}
        <div className="absolute inset-0 z-0 transition-all duration-700 ease-out" style={getAuraStyle()}></div>

        {/* Character Layer */}
        <div 
            className="relative z-10 w-full h-full flex items-end justify-center transition-all duration-300 ease-out"
            style={{ 
                transform: `translate(${layout.x + jitter}%, ${layout.y + bounce}%) scale(${layout.scale + (normalizedLevel * 0.05)})`,
                filter: normalizedLevel > 1 ? 'brightness(1.2)' : 'none'
            }}
        >
            <div className={`w-full h-full flex items-end justify-center ${avatarState.isLoading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'} transition-all duration-700`}>
                {avatarState.videoUrl ? (
                    <video ref={videoRef} src={avatarState.videoUrl} loop muted playsInline autoPlay className="w-full h-full object-contain object-bottom filter drop-shadow-[0_0_50px_rgba(236,72,153,0.3)]" />
                ) : avatarState.imageUrl ? (
                    <img src={avatarState.imageUrl} alt="AI Persona" className={`w-full h-full object-contain object-bottom filter drop-shadow-[0_0_50px_rgba(59,130,246,0.3)] ${avatarState.isTalking ? 'animate-talking-wiggle' : ''}`} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-32 h-32 bg-white/5 rounded-full animate-pulse border border-white/10"></div>
                    </div>
                )}
            </div>

            {/* Hidden Interaction Zones (Talking Tom Style) */}
            <div className="absolute inset-0 z-20 grid grid-rows-3 pointer-events-auto">
                <div onClick={() => onInteraction?.('head')} className="cursor-pointer active:bg-white/5 transition-colors"></div>
                <div onClick={() => onInteraction?.('belly')} className="cursor-pointer active:bg-white/5 transition-colors"></div>
                <div onClick={() => onInteraction?.('feet')} className="cursor-pointer active:bg-white/5 transition-colors"></div>
            </div>
        </div>
      
        <style>{`
            @keyframes memoryRipple {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 0.4; }
                100% { transform: scale(1); opacity: 0.8; }
            }
            @keyframes pulseFast {
                0% { opacity: 0.6; transform: scale(0.98); }
                50% { opacity: 1; transform: scale(1); }
                100% { opacity: 0.6; transform: scale(0.98); }
            }
            @keyframes talking-wiggle {
                0% { transform: rotate(0deg); }
                25% { transform: rotate(0.5deg) scale(1.005); }
                50% { transform: rotate(-0.5deg); }
                75% { transform: rotate(0.5deg); }
                100% { transform: rotate(0deg); }
            }
            .animate-talking-wiggle {
                animation: talking-wiggle 0.2s infinite ease-in-out;
            }
        `}</style>
    </div>
  );
};
