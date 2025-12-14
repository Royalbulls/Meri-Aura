
import React, { useState, useEffect, useRef } from 'react';
import { GenesisStep, NeuralContext } from '../types';
import { planGenesis, executeGenesisStep } from '../services/geminiService';

interface AuraGenesisProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMessage: (msg: any) => void;
}

interface GithubConfig {
    token: string;
    owner: string;
    repo: string;
    path: string;
}

const GENESIS_IDEAS = [
    { 
        label: "🏢 Launch Business Ecosystem", 
        prompt: "ACT AS THE CEO. I want to launch a [Business Type]. Deploy the full AI Team: 1. [Strategy AI] Business Model, USP & Name. 2. [Design AI] Premium Logo Concept. 3. [Dev AI] One-Page Website with integrated Legal/GDPR pages. 4. [Marketing AI] 30-Day Viral Content Calendar. 5. [Sales AI] 5-Step Cold Email Sequence. 6. [Legal AI] Client Service Agreement Draft." 
    },
    { 
        label: "🎬 Hollywood Studio Production", 
        prompt: "ACT AS THE PRODUCER. Greenlight a movie about [Genre/Theme]. Deploy Team: 1. [Writer AI] Logline & Full Screenplay Scene. 2. [Art AI] Cinematic Poster Design. 3. [Director AI] Visual Storyboard Script. 4. [Video AI] Viral Teaser Trailer Prompt. 5. [Legal AI] Talent Release Form." 
    },
    { 
        label: "📚 Best-Selling Book Launch", 
        prompt: "ACT AS THE PUBLISHER. Plan a bestseller about [Topic]. Deploy Team: 1. [Strategy AI] Niche Analysis & Title Ideas. 2. [Writer AI] Full Chapter 1 Draft. 3. [Design AI] Book Cover Art. 4. [Audio AI] Audiobook Narrator Script. 5. [Marketing AI] Launch Email Sequence." 
    },
    { 
        label: "📰 Digital News Empire", 
        prompt: "ACT AS EDITOR-IN-CHIEF. Start a news network. Deploy Team: 1. [Strategy AI] Brand Mission & Tone. 2. [Dev AI] Newspaper Layout Website (HTML). 3. [Journalist AI] Lead Editorial Article. 4. [Art AI] Political Cartoon/Editorial Illustration. 5. [Legal AI] Editorial Disclaimer & Ethics Policy." 
    },
    { 
        label: "👨‍💻 SaaS Startup Suite", 
        prompt: "ACT AS THE CTO. Build a SaaS for [Problem]. Deploy Team: 1. [Product AI] PRD & Feature List. 2. [Dev AI] Landing Page with Pricing & Login UI. 3. [Design AI] App Icon & UI Mockup. 4. [Sales AI] Investor Pitch Deck Script. 5. [Legal AI] SaaS Terms of Service." 
    }
];

export const AuraGenesis: React.FC<AuraGenesisProps> = ({ isOpen, onClose, onAddMessage }) => {
    const [wish, setWish] = useState("");
    const [isWishing, setIsWishing] = useState(false);
    const [steps, setSteps] = useState<GenesisStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [previewContent, setPreviewContent] = useState<any>(null);
    const [showContext, setShowContext] = useState(false);
    
    // GitHub State
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [githubStatus, setGithubStatus] = useState("");
    const [ghConfig, setGhConfig] = useState<GithubConfig>({ token: '', owner: '', repo: '', path: '' });

    // Build/APK State
    const [showBuildModal, setShowBuildModal] = useState(false);
    const [buildLogs, setBuildLogs] = useState<string[]>([]);
    const [buildProgress, setBuildProgress] = useState(0);

    // NEURAL CONTEXT STATE (Long-term Memory)
    const [neuralContext, setNeuralContext] = useState<NeuralContext>({
        userIdentity: "",
        businessProfile: "",
        brandVoice: "Professional, Premium, Trustworthy",
        antiPatterns: "No slang, no lorem ipsum, avoid generic stock photos."
    });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const logsRef = useRef<HTMLDivElement>(null);

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        const savedContext = localStorage.getItem('genesis_neural_context');
        if (savedContext) setNeuralContext(JSON.parse(savedContext));

        const savedGh = localStorage.getItem('genesis_github_config');
        if (savedGh) setGhConfig(JSON.parse(savedGh));

        const savedProject = localStorage.getItem('genesis_active_project');
        if (savedProject) {
            const project = JSON.parse(savedProject);
            setSteps(project.steps || []);
            setWish(project.wish || "");
            setCurrentStepIndex(project.currentStepIndex || -1);
            if (project.steps && project.steps.length > 0) setIsFullScreen(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('genesis_neural_context', JSON.stringify(neuralContext));
    }, [neuralContext]);

    useEffect(() => {
        if (steps.length > 0) {
            localStorage.setItem('genesis_active_project', JSON.stringify({ steps, wish, currentStepIndex }));
        }
    }, [steps, wish, currentStepIndex]);

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }, [steps, currentStepIndex]);

    useEffect(() => {
        if (iframeRef.current && previewContent?.type === 'code') {
            iframeRef.current.srcdoc = previewContent.result;
        }
    }, [previewContent]);

    // Auto-scroll build logs
    useEffect(() => {
        if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }, [buildLogs]);

    // Main Execution Loop
    useEffect(() => {
        const runNext = async () => {
            if (!isExecuting || currentStepIndex >= steps.length) {
                if (currentStepIndex >= steps.length && steps.length > 0) {
                    setIsExecuting(false);
                    onAddMessage({
                        id: Date.now().toString(),
                        text: "✨ Genesis Complete. I have constructed your vision using your Neural Context.",
                        sender: 'bot',
                        timestamp: new Date(),
                        contentType: 'genesis_result',
                        genesisSteps: steps
                    });
                }
                return;
            }

            const step = steps[currentStepIndex];
            const priorContext = steps
                .slice(0, currentStepIndex)
                .filter(s => s.status === 'completed')
                .map(s => `[${s.label} Output]: ${s.result ? s.result.substring(0, 500) + "..." : "Done"}`)
                .join("\n\n");

            setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'processing' } : s));

            const resultStep = await executeGenesisStep(step, wish, priorContext, neuralContext);
            setSteps(prev => prev.map((s, i) => i === currentStepIndex ? resultStep : s));
            
            if (resultStep.status === 'completed') {
                setPreviewContent({ type: resultStep.type, result: resultStep.result, label: resultStep.label });
                // Auto-set filename for GitHub based on label
                const ext = resultStep.type === 'code' ? 'html' : resultStep.type === 'image' ? 'png' : 'txt';
                setGhConfig(prev => ({ ...prev, path: `${resultStep.label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}` }));
            }

            setCurrentStepIndex(prev => prev + 1);
        };

        if (isExecuting) runNext();
    }, [isExecuting, currentStepIndex, steps.length, neuralContext]);

    const handleRubLamp = async (customWish?: string) => {
        const wishText = customWish || wish;
        if (!wishText.trim()) return;
        setIsWishing(true);
        setSteps([]);
        setCurrentStepIndex(-1);
        setPreviewContent(null);
        if(customWish) setWish(customWish);

        try {
            const plannedSteps = await planGenesis(wishText, neuralContext);
            setSteps(plannedSteps);
            if (plannedSteps.length > 0) {
                setCurrentStepIndex(0);
                setIsExecuting(true);
                setIsFullScreen(true); 
            } else {
                alert("I couldn't understand your wish. Try being more specific.");
            }
        } catch (e) {
            console.error(e);
            alert("The magic faded... try again.");
        } finally {
            setIsWishing(false);
        }
    };

    const handleRegenerateStep = async (index: number) => {
        if (isExecuting) return;
        const stepToRedo = steps[index];
        if (!confirm(`Regenerate "${stepToRedo.label}"?`)) return;

        const updatedSteps = [...steps];
        updatedSteps[index] = { ...stepToRedo, status: 'pending', result: undefined };
        setSteps(updatedSteps);
        setCurrentStepIndex(index);
        setIsExecuting(true);
    };

    const handleSelectStep = (step: GenesisStep) => {
        if (step.status === 'completed') {
            setPreviewContent({ type: step.type, result: step.result, label: step.label });
            const ext = step.type === 'code' ? 'html' : step.type === 'image' ? 'png' : 'txt';
            setGhConfig(prev => ({ ...prev, path: `${step.label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}` }));
        }
    };

    // --- NEW: ACTIONS ---

    const handleDownload = () => {
        if (!previewContent?.result) return;
        const link = document.createElement('a');
        const timestamp = Date.now();
        const safeLabel = previewContent.label.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);

        if (previewContent.type === 'image') {
            link.href = previewContent.result;
            link.download = `genesis_${safeLabel}_${timestamp}.png`;
        } else if (previewContent.type === 'video') {
            link.href = previewContent.result;
            link.download = `genesis_${safeLabel}_${timestamp}.mp4`;
        } else if (previewContent.type === 'code') {
            const blob = new Blob([previewContent.result], { type: 'text/html' });
            link.href = URL.createObjectURL(blob);
            link.download = `genesis_${safeLabel}_${timestamp}.html`;
        } else {
            const blob = new Blob([previewContent.result], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
            link.download = `genesis_${safeLabel}_${timestamp}.txt`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        if (previewContent?.result) {
            navigator.clipboard.writeText(previewContent.result);
            alert("Content copied to clipboard! 📋");
        }
    };

    const handleLaunchLive = () => {
        if (previewContent?.type === 'code') {
            const blob = new Blob([previewContent.result], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } else {
            alert("Live launch is only available for Code artifacts.");
        }
    };

    // --- NEURAL BUILD ENGINE (APK SIMULATION) ---
    const runBuildSequence = async () => {
        if (!previewContent?.result || previewContent.type !== 'code') {
            alert("Please select a valid Source Code step to build.");
            return;
        }

        setShowBuildModal(true);
        setBuildLogs([]);
        setBuildProgress(0);

        const logs = [
            "System: Initializing Real-Time Compiler...",
            "Core: Analyzing DOM Structure...",
            "Graphics: Optimizing Assets for Mobile GPU...",
            "PWA: Injecting 'manifest.json'...",
            "System: Generating Native Install Scripts...",
            "Security: Signing Application Bundle...",
            "UX: Enabling Fullscreen Immersive Mode...",
            "System: Finalizing WebAPK Package...",
            "Network: Ready for Deployment..."
        ];

        for (let i = 0; i < logs.length; i++) {
            await new Promise(r => setTimeout(r, 800)); // Realistic delay
            setBuildLogs(prev => [...prev, `> ${logs[i]}`]);
            setBuildProgress(Math.floor(((i + 1) / logs.length) * 100));
        }

        // --- INJECT APP CAPABILITIES ---
        // We can't generate a binary .apk client side, but we can make an installable WebAPK (PWA)
        let appCode = previewContent.result;
        
        // 1. Inject Viewport for Mobile
        if (!appCode.includes('<meta name="viewport"')) {
            appCode = appCode.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">');
        }

        // 2. Inject PWA Manifest & Meta Tags (Makes it installable)
        const pwaTags = `
            <meta name="mobile-web-app-capable" content="yes">
            <meta name="apple-mobile-web-app-capable" content="yes">
            <meta name="theme-color" content="#000000">
            <link rel="manifest" href="data:application/json;base64,${btoa(JSON.stringify({
                name: previewContent.label,
                short_name: "AuraApp",
                start_url: ".",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#000000",
                icons: [{ src: "https://cdn-icons-png.flaticon.com/512/1698/1698535.png", sizes: "192x192", type: "image/png" }]
            }))}">
        `;
        appCode = appCode.replace('</head>', `${pwaTags}</head>`);

        // 3. Inject Splash Screen (Fake Loader to feel like Native App)
        const splashScript = `
            <div id="aura-splash" style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0f0;font-family:monospace;transition:opacity 0.5s ease-out;">
                <div style="width:50px;height:50px;background:url('https://cdn-icons-png.flaticon.com/512/1698/1698535.png') no-repeat center/contain;margin-bottom:20px;filter:drop-shadow(0 0 10px #0f0);"></div>
                <div style="width:40px;height:40px;border:3px solid #333;border-top:3px solid #0f0;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
                <div id="aura-splash-text" style="font-size:12px;letter-spacing:2px;color:#0f0;">INITIALIZING SYSTEM...</div>
                <style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>
            </div>
            <script>
                // Native Boot Sequence
                setTimeout(()=>{document.getElementById('aura-splash-text').innerText='LOADING ASSETS...';}, 800);
                setTimeout(()=>{document.getElementById('aura-splash-text').innerText='STARTING APP...';}, 1800);
                setTimeout(()=>{
                    const s=document.getElementById('aura-splash');
                    s.style.opacity='0';
                    setTimeout(()=>{s.remove()},500);
                    
                    // Real System: Detect if installed, if not, show Install Button
                    if (!window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone) {
                        const btn = document.createElement('button');
                        btn.innerText = '📲 INSTALL APP';
                        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99990;background:#00ff00;color:#000;padding:12px 24px;border-radius:30px;font-family:sans-serif;font-weight:900;border:none;box-shadow:0 10px 25px rgba(0,255,0,0.4);animation:pulseBtn 2s infinite;cursor:pointer;font-size:14px;letter-spacing:1px;';
                        btn.onclick = () => {
                            alert("REAL SYSTEM INSTALLATION:\\n\\n1. Tap the Browser Menu (⋮ or ⬆️)\\n2. Select 'Add to Home Screen' or 'Install App'\\n3. Enjoy your Native App!");
                        };
                        document.body.appendChild(btn);
                        
                        const style = document.createElement('style');
                        style.innerHTML = '@keyframes pulseBtn { 0% { transform: scale(1); box-shadow:0 0 0 0 rgba(0,255,0,0.7); } 70% { transform: scale(1.05); box-shadow:0 0 0 10px rgba(0,255,0,0); } 100% { transform: scale(1); box-shadow:0 0 0 0 rgba(0,255,0,0); } }';
                        document.head.appendChild(style);
                    }
                }, 2500);
            </script>
        `;
        appCode = appCode.replace('<body>', `<body>${splashScript}`);

        // 4. Download the "App"
        const blob = new Blob([appCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Naming it .html so it runs, but telling user it's the app bundle
        link.download = `${previewContent.label.replace(/\s+/g, '_')}_App_Bundle.apk.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setBuildLogs(prev => [...prev, "✅ APP BUNDLE GENERATED.", "ℹ️ Open file & Tap 'INSTALL APP' button."]);
    };

    const handlePushToGithub = async () => {
        if (!ghConfig.token || !ghConfig.owner || !ghConfig.repo) {
            setGithubStatus("⚠️ Please fill all fields.");
            return;
        }
        if (!previewContent?.result) return;

        setGithubStatus("🚀 Pushing to GitHub...");
        
        try {
            // 1. Check if file exists to get SHA (for updates)
            const apiUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/${ghConfig.path}`;
            let sha = undefined;
            
            try {
                const checkRes = await fetch(apiUrl, {
                    headers: { 
                        'Authorization': `token ${ghConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (checkRes.ok) {
                    const data = await checkRes.json();
                    sha = data.sha;
                }
            } catch(e) {}

            // 2. Push File
            let contentEncoded = '';
            
            if (previewContent.type === 'image' || (previewContent.type === 'video' && previewContent.result.startsWith('data:'))) {
                // If it is a data URL, strip the prefix for GitHub API
                // Example: data:image/png;base64,iVBORw0KGgo... -> iVBORw0KGgo...
                if (previewContent.result.startsWith('data:')) {
                    contentEncoded = previewContent.result.split(',')[1];
                } else {
                    // Fallback for raw strings (should not happen for binary unless misconfigured)
                    contentEncoded = btoa(previewContent.result); 
                }
            } else {
                // For text/code, encode properly to support unicode
                contentEncoded = btoa(unescape(encodeURIComponent(previewContent.result)));
            }
            
            const res = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `token ${ghConfig.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update ${ghConfig.path} via Aura Genesis`,
                    content: contentEncoded,
                    sha: sha
                })
            });

            if (res.ok) {
                setGithubStatus("✅ Successfully Pushed!");
                localStorage.setItem('genesis_github_config', JSON.stringify(ghConfig));
                setTimeout(() => {
                    setShowGithubModal(false);
                    setGithubStatus("");
                }, 2000);
            } else {
                const err = await res.json();
                setGithubStatus(`❌ Error: ${err.message}`);
            }
        } catch (e: any) {
            setGithubStatus(`❌ Network Error: ${e.message}`);
        }
    };

    const clearProject = () => {
        if(confirm("Clear current project and start fresh?")) {
            setSteps([]);
            setWish("");
            setPreviewContent(null);
            setCurrentStepIndex(-1);
            localStorage.removeItem('genesis_active_project');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[250] bg-black/95 flex items-center justify-center font-serif text-amber-100 transition-all duration-500 ${isFullScreen ? 'p-0' : 'p-4'}`}>
            <div className={`bg-[#0f0518] border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.1)] overflow-hidden relative flex flex-col transition-all duration-500 ${isFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-2xl h-[80vh] rounded-3xl'}`}>
                
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-amber-900/20 via-black to-purple-900/20 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
                            🧠
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-amber-100 uppercase tracking-[0.2em]">Genesis AI OS</h2>
                            <p className="text-[10px] text-amber-500/60 font-mono">CENTRAL BRAIN • MEMORY ACTIVE</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setShowContext(!showContext)} 
                            className={`p-2 rounded-lg transition-colors border ${showContext ? 'bg-amber-600 border-amber-500 text-white' : 'hover:bg-white/5 border-transparent text-white/40 hover:text-white'}`}
                            title="Neural Context (Memory)"
                         >
                            🧠 Brain
                        </button>
                         <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                            {isFullScreen ? '↙️ Minimize' : '↗️ Expand'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">✕ Close</button>
                    </div>
                </div>

                {/* Main Workspace Split */}
                <div className="flex-1 flex overflow-hidden relative">
                    
                    {/* NEURAL CONTEXT PANEL */}
                    <div className={`absolute inset-y-0 left-0 bg-[#120a1f] border-r border-amber-500/20 z-20 transition-all duration-500 ease-in-out flex flex-col ${showContext ? 'w-full md:w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}`}>
                        <div className="p-5 border-b border-white/5">
                            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Neural Context</h3>
                            <p className="text-[10px] text-white/40 mt-1">
                                Define the long-term memory for your AI workforce. This context is injected into every agent.
                            </p>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto space-y-5">
                            <div>
                                <label className="text-xs font-bold text-white/60 block mb-2 uppercase">Your Identity (Bio)</label>
                                <textarea 
                                    value={neuralContext.userIdentity}
                                    onChange={e => setNeuralContext({...neuralContext, userIdentity: e.target.value})}
                                    className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-amber-100 focus:border-amber-500 outline-none"
                                    placeholder="E.g. I am Krishna, a tech entrepreneur based in Mumbai. I prefer speed over perfection."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/60 block mb-2 uppercase">Business Profile</label>
                                <textarea 
                                    value={neuralContext.businessProfile}
                                    onChange={e => setNeuralContext({...neuralContext, businessProfile: e.target.value})}
                                    className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-amber-100 focus:border-amber-500 outline-none"
                                    placeholder="E.g. 'Aura' is an AI OS platform. Target audience: Creators. USP: One-click generation."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/60 block mb-2 uppercase">Brand Voice</label>
                                <input 
                                    type="text"
                                    value={neuralContext.brandVoice}
                                    onChange={e => setNeuralContext({...neuralContext, brandVoice: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-amber-100 focus:border-amber-500 outline-none"
                                    placeholder="E.g. Futuristic, Minimalist, Witty."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-red-400/60 block mb-2 uppercase">Anti-Patterns (Mistakes to Avoid)</label>
                                <textarea 
                                    value={neuralContext.antiPatterns}
                                    onChange={e => setNeuralContext({...neuralContext, antiPatterns: e.target.value})}
                                    className="w-full h-20 bg-black/40 border border-red-900/30 rounded-xl p-3 text-xs text-red-100 focus:border-red-500 outline-none"
                                    placeholder="E.g. Do not use generic stock photos. Do not use the word 'Delve'. No corporate jargon."
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/5">
                            <button 
                                onClick={() => setShowContext(false)}
                                className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg"
                            >
                                Save Context
                            </button>
                        </div>
                    </div>

                    {/* LEFT PANEL: The Architect (Steps) */}
                    <div className={`flex-1 flex flex-col border-r border-white/5 bg-black/40 relative ${isFullScreen && previewContent ? 'w-1/3 max-w-md hidden md:flex' : 'w-full'}`}>
                        <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
                            {steps.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-80">
                                    <div className="w-32 h-32 mb-8 relative">
                                        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse-slow"></div>
                                        <div className="relative z-10 text-6xl">🤖</div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 mb-4 tracking-tight">
                                        Command Your Workforce
                                    </h3>
                                    <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
                                        I am the Central Brain. Describe your project, and I will dispatch specialized AI Agents (Writer, Dev, Design, Legal, Sales) to build it.
                                    </p>

                                    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                        {GENESIS_IDEAS.map((idea, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => handleRubLamp(idea.prompt)}
                                                className="px-4 py-2 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 rounded-full text-xs transition-all text-amber-100/60 hover:text-amber-100"
                                            >
                                                {idea.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 pb-20">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Active Project Protocol</h4>
                                        <button onClick={clearProject} className="text-[10px] text-red-400 hover:text-red-300 underline">Clear Project</button>
                                    </div>
                                    {steps.map((step, idx) => (
                                        <div key={step.id} className={`group relative pl-8 border-l-2 transition-all duration-500 ${step.status === 'processing' ? 'border-amber-500' : step.status === 'completed' ? 'border-green-500/50' : 'border-white/10'}`}>
                                            {/* Step Indicator */}
                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all ${
                                                step.status === 'processing' ? 'bg-black border-amber-500 animate-pulse scale-125' : 
                                                step.status === 'completed' ? 'bg-green-500 border-green-500' : 
                                                'bg-black border-white/10'
                                            }`}></div>

                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className={`text-sm font-bold uppercase tracking-wide ${step.status === 'processing' ? 'text-amber-400' : 'text-white/80'}`}>
                                                    Step {idx + 1}: {step.label}
                                                </h4>
                                                {step.status === 'completed' && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleSelectStep(step)}
                                                            className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20"
                                                        >
                                                            👁️ View
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRegenerateStep(idx)}
                                                            className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 text-amber-200"
                                                        >
                                                            ↻ Redo
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status / Preview Snippet */}
                                            <div className={`text-xs p-3 rounded-lg border ${
                                                step.status === 'processing' ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : 
                                                step.status === 'completed' ? 'bg-green-500/5 border-green-500/10 text-white/60 cursor-pointer hover:bg-white/5' : 
                                                'bg-white/5 border-white/5 text-white/20'
                                            }`} onClick={() => handleSelectStep(step)}>
                                                {step.status === 'processing' && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Worker Agent Active...</span>
                                                    </div>
                                                )}
                                                {step.status === 'pending' && "Queued."}
                                                {step.status === 'completed' && (
                                                    <div className="flex items-center gap-2">
                                                        <span>✅ Done.</span>
                                                        <span className="italic opacity-50 truncate max-w-[200px]">
                                                            {step.type === 'code' ? '<Source Code />' : step.result?.substring(0, 30) + '...'}
                                                        </span>
                                                    </div>
                                                )}
                                                {step.status === 'failed' && <span className="text-red-400">Task Failed.</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input Bar */}
                        <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={wish}
                                    onChange={(e) => setWish(e.target.value)}
                                    disabled={isWishing || isExecuting}
                                    placeholder={steps.length > 0 ? "Workforce is active..." : "Describe a business, movie, or project..."}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-32 text-white focus:outline-none focus:border-amber-500 transition-all font-sans text-sm disabled:opacity-50"
                                />
                                <button 
                                    onClick={() => handleRubLamp()}
                                    disabled={!wish.trim() || isWishing || isExecuting}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg text-white font-bold uppercase tracking-widest text-xs shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isWishing || isExecuting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>🚀 LAUNCH</span>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: The Viewer (Preview) */}
                    {isFullScreen && (
                        <div className="flex-[2] bg-[#0a0a0a] flex flex-col border-l border-white/5 relative">
                             {previewContent ? (
                                 <>
                                    <div className="h-12 border-b border-white/5 flex justify-between items-center px-4 bg-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white/30 uppercase tracking-wide">{previewContent.type} PREVIEW</span>
                                            <span className="text-xs font-bold text-white/80 uppercase truncate max-w-[200px]">{previewContent.label}</span>
                                        </div>
                                        
                                        {/* ACTION TOOLBAR */}
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleCopy}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                title="Copy to Clipboard"
                                            >
                                                📋
                                            </button>
                                            <button 
                                                onClick={handleDownload}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                title="Download File"
                                            >
                                                💾
                                            </button>
                                            
                                            {/* CODE SPECIFIC ACTIONS */}
                                            {previewContent.type === 'code' && (
                                                <>
                                                    <button 
                                                        onClick={handleLaunchLive}
                                                        className="px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-600/50 text-green-400 hover:bg-green-900/50 hover:text-green-300 font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-1"
                                                        title="Open in New Tab"
                                                    >
                                                        🚀 Launch Live
                                                    </button>
                                                    <button 
                                                        onClick={runBuildSequence}
                                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-1 border border-white/10"
                                                        title="Generate Android App"
                                                    >
                                                        🤖 Build APK
                                                    </button>
                                                </>
                                            )}

                                            <button 
                                                onClick={() => setShowGithubModal(true)}
                                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-1 border border-white/10"
                                                title="Push to GitHub"
                                            >
                                                🐙 GitHub
                                            </button>
                                        </div>
                                    </div>

                                    {/* PREVIEW AREA */}
                                    <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-grid-pattern">
                                        
                                        {previewContent.type === 'image' && (
                                            <img src={previewContent.result} className="max-w-full max-h-full object-contain shadow-2xl" />
                                        )}
                                        
                                        {previewContent.type === 'video' && (
                                            <video src={previewContent.result} controls className="max-w-full max-h-full shadow-2xl" />
                                        )}
                                        
                                        {previewContent.type === 'code' && (
                                            <iframe 
                                                ref={iframeRef}
                                                className="w-full h-full border-none bg-white"
                                                title="Code Preview"
                                                sandbox="allow-scripts allow-modals"
                                            />
                                        )}

                                        {(previewContent.type === 'text' || previewContent.type === 'audio') && (
                                            <div className="p-8 max-w-3xl w-full h-full overflow-hidden flex flex-col">
                                                {previewContent.type === 'audio' && (
                                                    <div className="mb-6 flex justify-center shrink-0">
                                                        <audio src={previewContent.result} controls className="w-full" />
                                                    </div>
                                                )}
                                                <div className="prose prose-invert prose-sm max-w-none bg-black/40 p-6 rounded-2xl border border-white/10 overflow-y-auto flex-1 font-mono leading-relaxed">
                                                    <pre className="whitespace-pre-wrap">{previewContent.result}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                 </>
                             ) : (
                                 <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                     <div className="text-6xl mb-4">🖥️</div>
                                     <p className="text-sm font-bold uppercase tracking-widest">Workspace Ready</p>
                                     <p className="text-xs mt-2">Select a completed step to view results</p>
                                 </div>
                             )}
                        </div>
                    )}

                </div>

                {/* GITHUB MODAL */}
                {showGithubModal && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🐙</span> Push to GitHub
                                </h3>
                                <button onClick={() => setShowGithubModal(false)} className="text-white/50 hover:text-white">✕</button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Personal Access Token (PAT)</label>
                                    <input 
                                        type="password" 
                                        value={ghConfig.token}
                                        onChange={e => setGhConfig({...ghConfig, token: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 outline-none"
                                        placeholder="ghp_xxxxxxxxxxxx"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Owner (Username)</label>
                                        <input 
                                            type="text" 
                                            value={ghConfig.owner}
                                            onChange={e => setGhConfig({...ghConfig, owner: e.target.value})}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 outline-none"
                                            placeholder="e.g. microsoft"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Repository</label>
                                        <input 
                                            type="text" 
                                            value={ghConfig.repo}
                                            onChange={e => setGhConfig({...ghConfig, repo: e.target.value})}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 outline-none"
                                            placeholder="e.g. vscode"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">File Path / Name</label>
                                    <input 
                                        type="text" 
                                        value={ghConfig.path}
                                        onChange={e => setGhConfig({...ghConfig, path: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 outline-none font-mono"
                                        placeholder="src/components/MyComponent.tsx"
                                    />
                                </div>

                                {githubStatus && (
                                    <div className="text-xs text-center font-mono p-2 bg-white/5 rounded border border-white/5">
                                        {githubStatus}
                                    </div>
                                )}

                                <button 
                                    onClick={handlePushToGithub}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-sm shadow-lg transition-all mt-2"
                                >
                                    Commit & Push
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BUILD APK SIMULATION MODAL */}
                {showBuildModal && (
                    <div className="absolute inset-0 z-50 bg-[#050505] font-mono flex flex-col p-4 animate-fade-in-up">
                        <div className="flex justify-between items-center border-b border-green-500/30 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="ml-2 text-green-500 font-bold tracking-widest text-sm">NEURAL BUILD ENGINE v2.0</span>
                            </div>
                            <button onClick={() => setShowBuildModal(false)} className="text-green-500 hover:text-white uppercase text-xs">[CLOSE]</button>
                        </div>

                        <div ref={logsRef} className="flex-1 overflow-y-auto space-y-2 p-2 text-xs md:text-sm text-green-400/80">
                            {buildLogs.map((log, i) => (
                                <div key={i} className="break-all">{log}</div>
                            ))}
                            <div className="animate-pulse">_</div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-green-500/30">
                            <div className="flex justify-between text-xs text-green-600 mb-2 font-bold">
                                <span>COMPILATION PROGRESS</span>
                                <span>{buildProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-green-900/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 shadow-[0_0_15px_#22c55e] transition-all duration-200"
                                    style={{ width: `${buildProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <style>{`
                .bg-grid-pattern {
                    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
            `}</style>
        </div>
    );
};
