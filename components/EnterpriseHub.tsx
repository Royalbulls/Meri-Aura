
import React, { useState } from 'react';
import { Persona } from '../types';
import { generateCreativeContent } from '../services/geminiService';

interface EnterpriseHubProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

const SPECIALIZATIONS = [
    "Machine Learning - Services", "Security - Services", "Location-Based Services", 
    "Data Analytics - Services", "Infrastructure - Services", "Work Transformation - Enterprise", 
    "Cloud Migration - Services", "Data Management - Services", "Application Development - Services", 
    "Generative AI - Services", "Data Center Modernization - Services"
];

const INDUSTRIES = [
    "Advertising & Marketing", "Business & Professional Services", "Cloud Natives", 
    "Energy & Utilities", "Financial Services", "Industrial Goods & Manufacturing", 
    "Media & Entertainment", "Retail & Wholesale", "Small & Medium Business", 
    "Telecommunications", "Non-Profit"
];

const TECHNOLOGIES = [
    "Apigee", "Google Cloud Analytics", "Google Cloud Compute", "Google Cloud Databases", 
    "Google Cloud Identity & Security", "Google Cloud Networking", "Google Cloud Onboarding", 
    "Google Cloud Productivity", "Google Cloud Storage & Delivery", "Google Maps Platform", 
    "Google Meet", "Open Source Technology", "Cisco", "HashiCorp", "Amazon AWS", 
    "Teradata", "VMware"
];

const SOLUTIONS = [
    { id: 'ms_gcp', label: 'Microsoft on Google Cloud', cat: 'Cloud Migration' },
    { id: 'vm_mig', label: 'VM Migration', cat: 'Infrastructure' },
    { id: 'db_mig', label: 'Enterprise Databases Migration', cat: 'Data Management' },
    { id: 'sec_ops', label: 'Google SecOps Service Delivery', cat: 'Security' },
    { id: 'id_dev', label: 'Identity & Device Management', cat: 'Security' },
    { id: 'conv_des', label: 'Conversational Design', cat: 'Generative AI' },
    { id: 'cust_eng', label: 'Customer Engagement Suite with Google AI', cat: 'Generative AI' },
    { id: 'ml_ops', label: 'MLOps & Vertex AI', cat: 'Machine Learning' },
    { id: 'app_sheet', label: 'AppSheet Low-Code Dev', cat: 'App Development' },
    { id: 'native_app', label: 'Cloud Native Application Development', cat: 'App Development' },
    { id: 'legacy_mod', label: 'Modernize Legacy Applications', cat: 'App Development' },
    { id: 'api_bus', label: 'New Business Channels using APIs', cat: 'App Development' },
    { id: 'lamp_mig', label: 'Web App Migration - LAMP stack', cat: 'Cloud Migration' },
    { id: 'dw_mod', label: 'Data Warehouse Modernization', cat: 'Data Analytics' },
    { id: 'looker_bi', label: 'Looker BI Modernization', cat: 'Data Analytics' },
    { id: 'work_trans', label: 'Work Transformation & Meetings', cat: 'Work Transformation' }
];

export const EnterpriseHub: React.FC<EnterpriseHubProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeSpec, setActiveSpec] = useState(SPECIALIZATIONS[0]);
    const [activeIndustry, setActiveIndustry] = useState(INDUSTRIES[0]);
    const [activeTech, setActiveTech] = useState(TECHNOLOGIES[0]);
    const [activeSol, setActiveSol] = useState(SOLUTIONS[0]);
    
    const [input, setInput] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const prompt = `
            ACT AS AURA: Lead Global Enterprise Architect.
            USER: Krishna Vishwakarma (Royal Bulls CEO).
            
            ENTERPRISE CONTEXT:
            - Specialization: ${activeSpec}
            - Industry: ${activeIndustry}
            - Technology Stack: ${activeTech}
            - Solution Protocol: ${activeSol.label}
            
            REQUEST: "${input}"
            
            TONE: Friendly "Talking Tom" style (Hinglish/Bestie) but with 100% technical accuracy.
            Mention: "Bhai, ye architecture TCS-level robust hai. Hum ${activeTech} ka use karke optimized environment build karenge."
            
            OUTPUT: World-class HTML Architecture Roadmap (Tailwind CSS).
            Include: 1. Executive Summary, 2. Technical Stack Diagram (HTML/CSS), 3. Deployment Steps, 4. ROI Analysis.
            `;
            const response = await generateCreativeContent('chat', prompt, currentPersona);
            setResult(response.code || response.text);
        } catch (e) {
            setResult("<div class='p-4 text-red-500 font-bold'>Bhai, neural link error. Try again?</div>");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[200] bg-[#020202] flex flex-col font-sans text-white animate-in slide-in-from-right duration-500 overflow-hidden">
            
            {/* CYBER HEADER */}
            <div className="h-20 px-8 border-b border-white/5 flex justify-between items-center bg-black/60 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(37,99,235,0.4)] border border-white/20">🏢</div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                            Aura Studio <span className="text-[10px] bg-blue-500 px-3 py-0.5 rounded-full font-black text-black">Enterprise v4.0</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">Solution Architecture Center</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="px-6 py-2 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Exit Studio</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* ADVANCED SELECTION MATRIX (SIDEBAR) */}
                <div className="w-24 md:w-80 bg-black/40 border-r border-white/5 flex flex-col p-4 gap-6 overflow-y-auto no-scrollbar shadow-2xl shrink-0">
                    
                    {/* 01 SPECIALIZATION */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-blue-400/30"></span> 01 Domain
                        </label>
                        <select 
                            value={activeSpec}
                            onChange={(e) => setActiveSpec(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold focus:border-blue-500 outline-none appearance-none hover:bg-white/10 transition-colors"
                        >
                            {SPECIALIZATIONS.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                        </select>
                    </div>

                    {/* 02 INDUSTRY */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-purple-400/30"></span> 02 Industry
                        </label>
                        <select 
                            value={activeIndustry}
                            onChange={(e) => setActiveIndustry(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold focus:border-purple-500 outline-none appearance-none hover:bg-white/10 transition-colors"
                        >
                            {INDUSTRIES.map(i => <option key={i} value={i} className="bg-gray-900">{i}</option>)}
                        </select>
                    </div>

                    {/* 03 TECHNOLOGY */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-cyan-400/30"></span> 03 Product/Tech
                        </label>
                        <select 
                            value={activeTech}
                            onChange={(e) => setActiveTech(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold focus:border-cyan-500 outline-none appearance-none hover:bg-white/10 transition-colors"
                        >
                            {TECHNOLOGIES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                        </select>
                    </div>

                    {/* 04 SOLUTIONS LIST */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-pink-400/30"></span> 04 Solutions
                        </label>
                        <div className="space-y-2">
                            {SOLUTIONS.map(sol => (
                                <button 
                                    key={sol.id}
                                    onClick={() => setActiveSol(sol)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                        activeSol.id === sol.id 
                                        ? 'bg-blue-600/20 border-blue-500/50 shadow-lg text-white' 
                                        : 'bg-white/5 border-transparent text-white/40 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <div className="text-[10px] font-black uppercase truncate">{sol.label}</div>
                                    <div className="text-[8px] opacity-40 font-bold truncate mt-1">{sol.cat}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* WORKSPACE AREA */}
                <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar bg-gradient-to-br from-transparent to-blue-900/5">
                    <div className="max-w-4xl mx-auto space-y-12 pb-20">
                        
                        <div className="text-center space-y-4 mb-20">
                            <h3 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
                                Neural Solution <br/> Matrix
                            </h3>
                            <p className="text-blue-500 font-bold uppercase tracking-[0.6em] text-[10px]">Strategic Business Alignment Active</p>
                        </div>

                        {/* INPUT BOX */}
                        <div className="p-10 bg-white/5 border border-white/10 rounded-[4rem] backdrop-blur-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex justify-between items-center mb-8">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Executive Mission Brief</h4>
                                <div className="px-3 py-1 bg-blue-500/10 rounded-full text-[9px] font-black text-blue-400 border border-blue-500/20">READY FOR DEPLOYMENT</div>
                            </div>
                            
                            <textarea 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Bhai, tell me how we can implement ${activeSol.label} for ${activeIndustry} industry using ${activeTech}? I need a full strategic roadmap.`}
                                className="w-full h-48 bg-transparent outline-none text-xl md:text-2xl font-light leading-relaxed resize-none placeholder-white/5"
                            ></textarea>
                            
                            <div className="flex flex-col md:flex-row gap-4 mt-8">
                                <button 
                                    onClick={handleGenerate}
                                    disabled={isLoading || !input.trim()}
                                    className="flex-1 h-20 bg-white text-black hover:bg-blue-600 hover:text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="text-2xl group-hover:rotate-12 transition-transform">⚡</span>
                                            GENERATE ARCHITECTURE
                                        </>
                                    )}
                                </button>
                                
                                <button className="px-10 h-20 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all">
                                    Archive Context
                                </button>
                            </div>
                        </div>

                        {/* RESULTS PANEL */}
                        {result && (
                            <div className="p-12 bg-black/80 border border-white/10 rounded-[4rem] animate-in fade-in slide-in-from-bottom-12 duration-1000 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    <div className="text-9xl font-black text-blue-500">ROYAL</div>
                                </div>
                                <div className="relative z-10 prose prose-invert prose-blue max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: result }}></div>
                                </div>
                                <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                                    <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20">🚀 Execute Plan</button>
                                    <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">📧 Share Architecture</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.2); border-radius: 4px; }
            `}</style>
        </div>
    );
};
