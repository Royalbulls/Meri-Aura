
// ... existing imports ...
import React, { useRef, useEffect, useState } from 'react';
import { Message, Sender } from '../types';
import { transcribeAudio, generateAvatarVideo } from '../services/geminiService';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  onMicClick: () => void;
  isListening: boolean;
  isCallActive: boolean;
  onCallToggle: () => void;
  localVideoStream: MediaStream | null;
  onCameraToggle: () => void;
  isCameraActive: boolean;
  onMagicClick: () => void; 
  onOpenStudio: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  onFeedback: (messageId: string, rating: 'positive' | 'negative') => void;
  onSpeakMessage?: (text: string) => void;
  onStopAudio?: () => void;
  isTalking?: boolean;
  onFileUpload?: (file: File) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing,
  isCallActive,
  onCallToggle,
  localVideoStream,
  onCameraToggle,
  isCameraActive,
  onMagicClick,
  onOpenStudio,
  onTypingChange,
  onFeedback,
  onSpeakMessage,
  onStopAudio,
  isTalking,
  onFileUpload
}) => {
  // ... existing state ...
  const [inputText, setInputText] = React.useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vaultInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (!isTalking) {
          setPlayingMessageId(null);
      }
  }, [isTalking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCallActive]);

  useEffect(() => {
    if (selfVideoRef.current && localVideoStream) {
        selfVideoRef.current.srcObject = localVideoStream;
    }
  }, [localVideoStream]);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onSendMessage(inputText);
      setInputText('');
      if (onTypingChange) onTypingChange(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
      if (onTypingChange) {
          onTypingChange(e.target.value.length > 0);
      }
  };
  
  const handleVaultUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && onFileUpload) {
          showToast("Encrypting & Saving to Vault...");
          onFileUpload(e.target.files[0]);
      }
  };
  
  const handleCreateMusicVideo = async (msgId: string, imageUrl: string) => {
      setLoadingVideoId(msgId);
      showToast("Generating Video Loop (Check back in 10s)...");
      try {
          const videoUrl = await generateAvatarVideo(imageUrl, "Cinematic music video loop, slow motion, atmospheric");
          const link = document.createElement('a');
          link.href = videoUrl;
          link.download = `music-video-loop-${Date.now()}.mp4`;
          link.click();
          showToast("Video Loop Downloaded!");
      } catch (e) {
          showToast("Failed to generate video (Quota Exceeded).");
      } finally {
          setLoadingVideoId(null);
      }
  };

  const handleAudioToggle = (text: string, msgId: string) => {
      if (playingMessageId === msgId && isTalking) {
          if (onStopAudio) onStopAudio();
          setPlayingMessageId(null);
      } else {
          if (onSpeakMessage) onSpeakMessage(text.replace(/<[^>]*>?/gm, ''));
          setPlayingMessageId(msgId);
      }
  };

  const handleDictateToggle = async () => {
    if (isRecordingNote) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecordingNote(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    try {
                        setInputText("Transcribing...");
                        const text = await transcribeAudio(base64Audio, mimeType);
                        setInputText(text);
                        if (onTypingChange) onTypingChange(true);
                    } catch (e) {
                        showToast("Transcription failed. Try again.");
                        setInputText("");
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecordingNote(true);
            showToast("Listening...");
        } catch (e) {
            console.error("Mic access denied", e);
            showToast("Microphone access needed.");
        }
    }
  };

  const downloadHtml = (code: string) => {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aura-app-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("App HTML Downloaded!");
  };

  const copyCode = (code: string) => {
      navigator.clipboard.writeText(code);
      showToast("Code copied to clipboard!");
  };

  const handleCopyText = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      showToast("Text copied to clipboard!");
      setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleCopyHtml = (html: string, id: string) => {
      navigator.clipboard.writeText(html);
      setCopiedMessageId(id);
      showToast("HTML Code copied! 📋");
      setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleFeedbackAction = (id: string, rating: 'positive' | 'negative') => {
      onFeedback(id, rating);
      showToast(rating === 'positive' ? "You liked this! I'll remember." : "Noted. I'll improve next time.");
  };

  const renderGroundingMetadata = (metadata: any) => {
    if (!metadata?.groundingChunks || metadata.groundingChunks.length === 0) return null;

    const sources: React.ReactNode[] = [];

    metadata.groundingChunks.forEach((chunk: any, index: number) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push(
          <a 
            key={`web-${index}`}
            href={chunk.web.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors group"
          >
            <span className="text-pink-400">🔗</span>
            <span className="truncate flex-1 group-hover:text-pink-300">{chunk.web.title}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 opacity-50"><path d="M10.5 4.5h9a2.25 2.25 0 012.25 2.25v9m-12 0L21 4.5" /></svg>
          </a>
        );
      } else if (chunk.maps?.sourceConfig?.googleMapsSourceConfig?.placeId) {
        const placeId = chunk.maps.sourceConfig.googleMapsSourceConfig.placeId;
        const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
        const label = "📍 View Location on Google Maps"; 
        sources.push(
          <a
            key={`maps-${index}`}
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 p-2 rounded-lg transition-colors group"
          >
            <span className="text-blue-300">🗺️</span>
            <span className="truncate flex-1 font-bold text-blue-100">{label}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-300"><path d="M10.5 4.5h9a2.25 2.25 0 012.25 2.25v9m-12 0L21 4.5" /></svg>
          </a>
        );
      }
    });
    if (sources.length === 0) return null;
    return (
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase font-bold text-white/40 mb-2 tracking-widest">Sources & Links</p>
        <div className="flex flex-col gap-2">
          {sources}
        </div>
      </div>
    );
  };
  
  const renderMessageContent = (text: string, msg: Message) => {
      const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
      const mapsRegex = /(?:https?:\/\/)?(?:www\.)?google\.com\/maps\/search\/\?api=1&query=([^&\s]+)/;
      
      const navMatch = text.match(mapsRegex);
      const ytMatch = text.match(ytRegex);

      const isRichContent = ['patrika', 'blog', 'horoscope'].includes(msg.contentType || '');

      let content;
      if (isRichContent) {
          content = (
              <div 
                className="text-sm md:text-base font-medium leading-relaxed drop-shadow-md prose prose-invert max-w-none prose-p:my-2 prose-headings:text-yellow-400 prose-strong:text-pink-300"
                dangerouslySetInnerHTML={{ __html: text }}
              />
          );
      } else if (msg.contentType === 'spreadsheet' && msg.codeSnippet) {
          const rows = msg.codeSnippet.split('\n').filter(r => r.trim()).slice(0, 5);
          const headers = rows[0]?.split(',');
          content = (
              <div className="overflow-x-auto">
                  <p className="text-sm mb-2">{text}</p>
                  <table className="w-full text-[10px] text-left border-collapse mb-2">
                      <thead>
                          <tr>{headers?.map((h, i) => <th key={i} className="border-b border-white/20 p-1 font-bold text-white/70">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                          {rows.slice(1).map((row, i) => (
                              <tr key={i}>
                                  {row.split(',').map((cell, j) => (
                                      <td key={j} className="border-b border-white/10 p-1 text-white/50">{cell}</td>
                                  ))}
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <p className="text-[9px] text-white/30 italic">Preview showing first 5 rows.</p>
              </div>
          );
      } else {
          content = <p className="text-sm md:text-base font-medium leading-relaxed drop-shadow-md whitespace-pre-wrap">{text}</p>;
      }

      return (
          <>
            {content}

            {ytMatch && (
                <div className="mt-4 rounded-2xl overflow-hidden shadow-2xl border border-red-600/30 bg-black relative group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-10"></div>
                    <iframe 
                        width="100%" 
                        height="200" 
                        src={`https://www.youtube.com/embed/${ytMatch[1]}`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full aspect-video"
                    ></iframe>
                    <div className="p-2 bg-gray-900 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 text-lg">▶</span>
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">YouTube Player</span>
                        </div>
                        <a 
                            href={`https://www.youtube.com/watch?v=${ytMatch[1]}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-white/40 hover:text-white transition-colors"
                        >
                            Open External ↗
                        </a>
                    </div>
                </div>
            )}

            {(msg.directionsUrl || navMatch) && (
                <div className="mt-3 rounded-xl overflow-hidden shadow-lg border border-blue-500/30 bg-blue-900/20">
                    <div className="w-full h-32 bg-gray-800 relative">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            style={{ border:0, opacity: 0.8 }} 
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(msg.directionsUrl ? msg.directionsUrl.split('destination=')[1] : (navMatch ? navMatch[1] : ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                        ></iframe>
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-600 rounded-full text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white uppercase tracking-wide">Destination</span>
                                <span className="text-[10px] text-blue-200">Tap to start driving</span>
                            </div>
                        </div>
                        <a 
                            href={msg.directionsUrl || (navMatch ? navMatch[0] : '#')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-lg"
                        >
                            Navigate <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                        </a>
                    </div>
                </div>
            )}
          </>
      );
  };

  return (
    <div className="flex flex-col h-full w-full pointer-events-none relative z-20">
      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[300] transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full text-white font-bold text-xs shadow-2xl flex items-center gap-2">
              <span className="text-lg">✨</span>
              {toastMessage}
          </div>
      </div>

      {/* HTML Preview Overlay */}
      {previewHtml && (
          <div className="fixed inset-0 z-[200] bg-black pointer-events-auto flex flex-col">
              <div className="p-4 bg-gray-900 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-white font-bold">App Preview</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            navigator.clipboard.writeText(previewHtml);
                            showToast("HTML copied to clipboard!");
                        }} 
                        className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-all"
                      >
                          Copy Code
                      </button>
                      <button 
                        onClick={() => downloadHtml(previewHtml)} 
                        className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold text-white hover:bg-purple-500 transition-all"
                      >
                          Download App (.html)
                      </button>
                      <button 
                        onClick={() => setPreviewHtml(null)} 
                        className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold text-white"
                      >
                          Close
                      </button>
                  </div>
              </div>
              <iframe 
                srcDoc={previewHtml} 
                className="flex-1 w-full bg-white" 
                title="Preview"
              />
          </div>
      )}

      {/* Messages Area */}
      <div 
        className={`
            flex-1 overflow-y-auto p-4 space-y-4 pointer-events-auto 
            mask-image-linear-gradient transition-all duration-700 ease-in-out
            ${isCallActive ? 'opacity-0 translate-y-10' : 'opacity-100'}
        `}
      >
        <div className="h-[35vh] md:h-[45vh]"></div> 
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[90%] md:max-w-[70%] px-5 py-3 rounded-3xl backdrop-blur-xl shadow-lg border border-white/5 relative group
                ${msg.sender === Sender.User 
                  ? 'bg-gradient-to-br from-pink-600/80 to-purple-600/80 text-white rounded-br-sm' 
                  : 'bg-black/60 text-white rounded-bl-sm'}
                ${msg.contentType === 'blog' ? 'border-l-4 border-yellow-400' : ''}
                ${msg.contentType === 'patrika' ? 'border-l-4 border-indigo-400' : ''}
                ${msg.contentType === 'file_attachment' ? 'border-l-4 border-emerald-400' : ''}
              `}
            >
              {/* ATTACHMENTS */}
              
              {/* Image / Comic */}
              {msg.attachmentUrl && msg.contentType !== 'file_attachment' && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/10 shadow-lg group relative">
                      <img src={msg.attachmentUrl} alt="Attachment" className="w-full h-auto object-cover" />
                      {msg.contentType === 'comic' && (
                          <div className="absolute bottom-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded">COMIC</div>
                      )}
                      
                      {/* Download Button */}
                      <a 
                        href={msg.attachmentUrl}
                        download={`aura-image-${msg.id}.png`}
                        className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-pink-600/80 rounded-full text-white backdrop-blur-sm transition-all md:opacity-0 group-hover:opacity-100 opacity-100"
                        title="Download Image"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </a>
                  </div>
              )}

              {/* VIDEO ATTACHMENT (VEO) */}
              {msg.videoUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/10 shadow-lg group relative bg-black">
                      <video 
                        src={msg.videoUrl} 
                        controls 
                        loop 
                        playsInline
                        className="w-full h-auto" 
                      />
                  </div>
              )}

              {/* STORED FILE ATTACHMENT (VAULT ITEM) */}
              {msg.contentType === 'file_attachment' && msg.attachmentUrl && (
                  <div className="mb-2 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                      <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 text-xl">
                          📄
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{msg.fileName || "Stored Document"}</p>
                          <p className="text-[9px] text-emerald-200 opacity-70">Secured in Digital Vault</p>
                      </div>
                      <a 
                        href={msg.attachmentUrl}
                        download={msg.fileName || `aura-file-${msg.id}`}
                        className="p-2 bg-black/40 hover:bg-emerald-600 rounded-full text-white transition-colors"
                        title="Download Original"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>
                      </a>
                  </div>
              )}

              {/* Special Labels */}
              {msg.contentType === 'blog' && <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1 block">✨ AURA'S THOUGHTS</span>}
              {msg.contentType === 'file_attachment' && <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 block">🔐 VAULT ITEM</span>}

              {renderMessageContent(msg.text, msg)}
              
              {/* CODE BLOCK RENDERER */}
              {msg.codeSnippet && msg.contentType !== 'spreadsheet' && (
                  <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden border border-white/20">
                      <div className="flex justify-between items-center bg-gray-800 px-3 py-1.5 border-b border-white/10">
                          <span className="text-[10px] font-mono text-white/50">
                              {msg.contentType === 'document' ? 'HTML SOURCE' : 'SOURCE CODE'}
                          </span>
                          <div className="flex gap-2">
                                <button 
                                    onClick={() => setPreviewHtml(msg.codeSnippet!)}
                                    className="text-[10px] font-bold text-pink-400 hover:text-pink-300"
                                >
                                    PREVIEW
                                </button>
                                <button 
                                    onClick={() => copyCode(msg.codeSnippet!)}
                                    className="text-[10px] font-bold text-green-400 hover:text-green-300"
                                >
                                    COPY
                                </button>
                          </div>
                      </div>
                      {/* Hide code body for documents to keep UI clean, unless requested */}
                      {msg.contentType !== 'document' && (
                          <pre className="p-3 text-xs md:text-sm font-mono text-green-300 overflow-x-auto max-h-40">
                              {msg.codeSnippet}
                          </pre>
                      )}
                  </div>
              )}
              
              {/* --- ACTION BAR: FEEDBACK, COPY, SPEAK --- */}
              <div className="flex gap-2 mt-2 justify-end items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                   {onSpeakMessage && (
                       <button
                         onClick={() => handleAudioToggle(msg.text, msg.id)} 
                         className={`p-1.5 rounded-full transition-colors ${playingMessageId === msg.id && isTalking ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                         title={playingMessageId === msg.id && isTalking ? "Stop" : "Read Aloud"}
                       >
                           {playingMessageId === msg.id && isTalking ? (
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
                           ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" /><path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" /></svg>
                           )}
                       </button>
                   )}

                   {/* Copy HTML Button */}
                   {['blog', 'patrika', 'html', 'website'].includes(msg.contentType || '') && (
                       <button
                            onClick={() => handleCopyHtml(msg.codeSnippet || msg.text, msg.id)}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            title="Copy HTML Source"
                       >
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                               <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
                           </svg>
                       </button>
                   )}
                   
                   {/* Download HTML Button */}
                   {['blog', 'html', 'website'].includes(msg.contentType || '') && (
                       <button
                            onClick={() => downloadHtml(msg.codeSnippet || msg.text)}
                             className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            title="Download HTML File"
                       >
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                           </svg>
                       </button>
                   )}
                   
                   {/* Feedback Buttons */}
                   {msg.sender === Sender.Bot && (
                        <>
                            <button
                                onClick={() => handleFeedbackAction(msg.id, 'positive')}
                                className={`p-1.5 rounded-full transition-colors ${msg.feedback === 'positive' ? 'text-green-400 bg-green-400/20' : 'text-white/50 hover:text-green-400 hover:bg-white/10'}`}
                                title="Good response"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.233 9.5h2.505c.81 0 1.61.441 2.034 1.12a.75.75 0 001.071.205 6.001 6.001 0 00-1.838-2.659 3.001 3.001 0 00-2.311-.536l-1.461.46z" />
                                    <path fillRule="evenodd" d="M3.75 12a.75.75 0 01.75.75v6.75a.75.75 0 01-.75.75H3a.75.75 0 01-.75-.75v-6.75A.75.75 0 013 12h.75z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleFeedbackAction(msg.id, 'negative')}
                                className={`p-1.5 rounded-full transition-colors ${msg.feedback === 'negative' ? 'text-red-400 bg-red-400/20' : 'text-white/50 hover:text-red-400 hover:bg-white/10'}`}
                                title="Bad response"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M15.73 5.25h1.335c.775 0 1.748.156 2.632.417.48.141.974.297 1.423.23a4.498 4.498 0 001.423-.23l3.114-1.04a4.501 4.501 0 001.423-.23h2.326c.618 0 1.217.247 1.605.729A11.95 11.95 0 0121 12.63c0 .435.023.863.068 1.285.109 1.021 1.028 1.715 2.054 1.715H19.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0019.25 21a2.25 2.25 0 01-2.25 2.25.75.75 0 01-.75-.75v-.633c0-.618.11-1.28.322-1.672.303-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.323-.41.74-.74 1.213-.924.227-.088.449-.205.6-.397A7.48 7.48 0 0115.73 5.25z" transform="scale(1, -1) translate(0, -24)" />
                                    <path fillRule="evenodd" d="M10.5 5.25a.75.75 0 01.75.75v6.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-6.75a.75.75 0 01.75-.75h.75z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </>
                   )}

                   {/* Copy Button */}
                   <button
                        onClick={() => handleCopyText(msg.text.replace(/<[^>]*>?/gm, ''), msg.id)}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        title="Copy Text (No HTML)"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.504 21 5.79v13.558a2.25 2.25 0 01-2.25 2.25H9.75a2.25 2.25 0 01-2.25-2.25V5.79c0-1.286 1.124-2.492 2.664-2.622a2.25 2.25 0 012.486 2.025c.121 1.286.121 2.578 0 3.864a2.25 2.25 0 01-2.486 2.025c-1.54-.13-2.664-1.336-2.664-2.622V7.5h.75a.75.75 0 010 1.5H9.75v10.89c0 .55.45 1 1 1h9.45a1 1 0 001-1V5.79c0-.55-.45-1-1-1h-.75V4.5a.75.75 0 01.75-.75h.363a.75.75 0 01.05-.015z" clipRule="evenodd" /><path fillRule="evenodd" d="M4.5 7.5a.75.75 0 01.75.75v12.25c0 .69.56 1.25 1.25 1.25h11.5a.75.75 0 010 1.5H6.5A2.75 2.75 0 013.75 19.5V8.25a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>
                   </button>
              </div>
              
              {msg.sender === Sender.Bot && renderGroundingMetadata(msg.groundingMetadata)}
            </div>
          </div>
        ))}
        {/* ... processing indicators ... */}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
               <div className="flex space-x-1.5">
                 <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce delay-100"></div>
                 <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className={`p-4 pointer-events-auto transition-all duration-300 ${isCallActive ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 pr-2 shadow-2xl relative"
        >
            {/* STUDIO BUTTON */}
            <button 
                type="button" 
                onClick={onOpenStudio}
                className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center group"
                title="Open Studio"
            >
                <span className="text-xl">✨</span>
            </button>

            {/* MAGIC BUTTON (PROACTIVE) */}
            <button
                type="button"
                onClick={onMagicClick}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-yellow-400 transition-all hidden md:flex"
                title="Magic (Surprise Me)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15.75a.75.75 0 01.721.544l.178.622a2.25 2.25 0 001.65 1.545l.622.178a.75.75 0 010 1.442l-.622.178a2.25 2.25 0 00-1.65 1.545l-.178.622a.75.75 0 01-1.442 0l-.178-.622a2.25 2.25 0 00-1.65-1.545l-.622-.178a.75.75 0 01.721-.544z" clipRule="evenodd" />
                </svg>
            </button>

            {/* VAULT UPLOAD BUTTON (NEW) */}
            <div className="relative">
                <input 
                    type="file" 
                    ref={vaultInputRef} 
                    onChange={handleVaultUpload} 
                    className="hidden" 
                />
                <button
                    type="button"
                    onClick={() => vaultInputRef.current?.click()}
                    className="p-3 rounded-full bg-white/10 hover:bg-emerald-500/20 text-emerald-400 transition-all flex items-center justify-center border border-transparent hover:border-emerald-500/50"
                    title="Upload to Vault"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" /></svg>
                </button>
            </div>

            {/* TEXT INPUT */}
            <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={isRecordingNote ? "Listening..." : "Message..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/40 px-2 py-2"
                disabled={isRecordingNote}
            />

            {/* MIC BUTTON */}
            <button 
                type="button" 
                onClick={handleDictateToggle}
                className={`p-3 rounded-full transition-all ${isRecordingNote ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
            >
                {isRecordingNote ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>
                )}
            </button>

            {/* SEND BUTTON */}
            <button 
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="p-3 rounded-full bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
            </button>
        </form>

        {/* Camera Toggle Button (Kept alone in bottom bar) */}
        <div className="flex justify-center gap-4 mt-4 pb-2">
            <button 
                onClick={onCameraToggle}
                className={`p-3 rounded-full backdrop-blur-md border transition-all ${isCameraActive ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
                title="Toggle Camera"
            >
                {isCameraActive ? (
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /><path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0zm1.5 0h11.25a6.75 6.75 0 00-11.25 0z" clipRule="evenodd" /></svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                )}
            </button>
        </div>
      </div>

      {/* Self video preview */}
      <div className={`absolute bottom-24 right-4 z-50 transition-all duration-500 ${isCameraActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <div className="w-32 h-48 bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative">
              <video 
                ref={selfVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
              <div className="absolute bottom-2 left-2 flex gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-bold text-white uppercase tracking-widest">LIVE</span>
              </div>
          </div>
      </div>

    </div>
  );
};
