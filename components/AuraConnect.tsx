
import React, { useState, useEffect } from 'react';
import { Persona, Contact, CustomerJourneyPoint } from '../types';

interface AuraConnectProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

// Enhanced mock leads with journey history, tags and notes
const MOCK_LEADS: any[] = [
    { 
        id: '1', 
        name: 'Rajesh Malhotra', 
        company: 'Malhotra FinTech', 
        value: '$12,500', 
        status: 'Hot', 
        stage: 'Negotiation', 
        tag: 'High ROI', 
        icon: '👤', 
        lastContact: '2h ago', 
        email: 'rajesh@fintech.in', 
        phone: '+91 98765 43210',
        notes: "Interested in large-scale cloud infrastructure overhaul. Looking for a partner who understands the Indian regulatory landscape for FinTech. Very aggressive timeline for Q3 deployment.",
        tags: ["FinTech", "Cloud Infra", "Decision Maker", "Enterprise"],
        journey: [
            { id: 'j1', icon: '🔍', title: 'Initial Query', timestamp: Date.now() - 86400000 * 5, details: 'Inquiry via website about Cloud Spanner integration.' },
            { id: 'j2', icon: '📱', title: 'WhatsApp Discovery', timestamp: Date.now() - 86400000 * 3, details: 'Deep dive call regarding data residency requirements.' },
            { id: 'j3', icon: '🤝', title: 'Proposal Sent', timestamp: Date.now() - 86400000, details: 'Sent v1 architecture proposal and ROI breakdown.' }
        ]
    },
    { 
        id: '2', 
        name: 'Priya Sharma', 
        company: 'Sharma Logistics', 
        value: '$8,200', 
        status: 'Nurture', 
        stage: 'Proposal', 
        tag: 'Enterprise', 
        icon: '👩‍💼', 
        lastContact: '1d ago', 
        email: 'priya@sharma.log', 
        phone: '+91 98234 56789',
        notes: "Currently evaluating multiple vendors. Primary pain point is real-time tracking across 12 states. Tech-savvy but budget-conscious.",
        tags: ["Logistics", "Cold Chain", "Optimization", "Mid-Market"],
        journey: [
            { id: 'j4', icon: '📸', title: 'Event Lead', timestamp: Date.now() - 86400000 * 10, details: 'Met at the Logistics 4.0 Expo in Pune.' },
            { id: 'j5', icon: '📧', title: 'Email Thread', timestamp: Date.now() - 86400000 * 7, details: 'Followed up with whitepaper on IoT tracking.' }
        ]
    },
    { 
        id: '3', 
        name: 'Vikram Singh', 
        company: 'Singh Automotive', 
        value: '$25,000', 
        status: 'Hot', 
        stage: 'Closing', 
        tag: 'Strategic', 
        icon: '👨‍🔧', 
        lastContact: '5m ago', 
        email: 'vikram@singh.auto', 
        phone: '+91 91234 56789',
        notes: "VIP Client. High priority for AI-driven inventory management. Has already approved the technical pilot phase. Closing meeting scheduled for Friday.",
        tags: ["Automotive", "AI-Core", "Strategic Partner", "Billionaire Circle"],
        journey: [
            { id: 'j6', icon: '🤝', title: 'Introduction', timestamp: Date.now() - 86400000 * 30, details: 'Direct referral from Royal Bulls network.' },
            { id: 'j7', icon: '⚡', title: 'Pilot Started', timestamp: Date.now() - 86400000 * 15, details: 'Deployed edge-node AI prototype at main warehouse.' },
            { id: 'j8', icon: '💰', title: 'PO Drafted', timestamp: Date.now() - 86400000 * 2, details: 'Draft Purchase Order received for enterprise license.' }
        ]
    },
    { 
        id: '4', 
        name: 'Anjali Desai', 
        company: 'Desai Retail', 
        value: '$4,100', 
        status: 'Cold', 
        stage: 'Lead', 
        tag: 'Small Biz', 
        icon: '👩‍🎨', 
        lastContact: '3d ago', 
        email: 'anjali@desai.shop', 
        phone: '+91 99887 76655',
        notes: "Small retail chain owner. Looking for basic POS modernization. Currently on hold due to festival season rush.",
        tags: ["Retail", "SME", "POS", "Price Sensitive"],
        journey: [
            { id: 'j9', icon: '🌐', title: 'Organic Search', timestamp: Date.now() - 86400000 * 4, details: 'Found Aura via "AI for small shops" search.' }
        ]
    },
    { 
        id: '5', 
        name: 'Siddharth Mehra', 
        company: 'Mehra Energy', 
        value: '$11,000', 
        status: 'Hot', 
        stage: 'Qualification', 
        tag: 'Cloud Mig', 
        icon: '👨‍💼', 
        lastContact: '1h ago', 
        email: 'sid@mehra.energy', 
        phone: '+91 97766 55443',
        notes: "Energy sector veteran. Interested in predictive maintenance for solar farms. Highly interested in our Vertex AI capability.",
        tags: ["Energy", "Solar", "Predictive", "Tech-First"],
        journey: [
            { id: 'j10', icon: '📄', title: 'Case Study Download', timestamp: Date.now() - 86400000 * 2, details: 'Downloaded the "AI in Renewables" case study.' }
        ]
    },
];

const CAMPAIGN_METRICS = [
    { id: 'wa', label: 'WhatsApp Dominance', icon: '💬', reach: '12.4K', conversion: 18.5, color: '#10b981', roi: '5.2x' },
    { id: 'li', label: 'LinkedIn Enterprise', icon: '💼', reach: '3.2K', conversion: 24.2, color: '#3b82f6', roi: '8.1x' },
    { id: 'em', label: 'Ghost Email Suite', icon: '📧', reach: '45K', conversion: 4.8, color: '#6366f1', roi: '3.4x' },
    { id: 'ig', label: 'Viral Meta Protocol', icon: '📸', reach: '150K', conversion: 2.1, color: '#ec4899', roi: '4.2x' },
];

const GROWTH_DATA = [
    { m: 'J', v: 1200 }, { m: 'F', v: 2100 }, { m: 'M', v: 1800 }, { m: 'A', v: 3500 },
    { m: 'M', v: 4200 }, { m: 'J', v: 3900 }, { m: 'J', v: 5800 }, { m: 'A', v: 7200 },
    { m: 'S', v: 8100 }, { m: 'O', v: 9500 }, { m: 'N', v: 11200 }, { m: 'D', v: 12400 }
];

export const AuraConnect: React.FC<AuraConnectProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'universe' | 'campaigns'>('overview');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsLoaded(true), 300);
            return () => clearTimeout(timer);
        } else {
            setIsLoaded(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredLeads = MOCK_LEADS.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // SVG Line/Area Path Helpers
    const getChartPath = (isArea: boolean) => {
        const w = 1000;
        const h = 200;
        const max = 13000;
        const points = GROWTH_DATA.map((d, i) => {
            const x = (i / (GROWTH_DATA.length - 1)) * w;
            const y = h - (d.v / max) * h;
            return `${x},${y}`;
        });
        if (isArea) return `M0,${h} L${points.join(' L')} L${w},${h} Z`;
        return `M${points.join(' L')}`;
    };

    return (
        <div className="absolute inset-0 z-[150] bg-[#020205] flex flex-col font-sans text-white animate-in slide-in-from-right duration-500 overflow-hidden select-none">
            
            {/* --- PREMIUM CONTROL HEADER --- */}
            <div className="h-24 border-b border-white/5 flex justify-between items-center px-8 bg-black/40 backdrop-blur-3xl z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-800 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(37,99,235,0.3)] border border-white/10 group cursor-pointer">
                        <span className="group-hover:rotate-12 transition-transform">🤝</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black tracking-tighter uppercase">Aura Connect</h2>
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black border border-blue-500/30 uppercase tracking-widest">Enterprise Elite</span>
                        </div>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Neural CRM Synchronized
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-8 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                        <div className="text-center">
                            <div className="text-[9px] font-black text-white/20 uppercase mb-0.5">Pipeline</div>
                            <div className="text-lg font-black text-blue-400">$1.4M</div>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-[9px] font-black text-white/20 uppercase mb-0.5">Avg ROI</div>
                            <div className="text-lg font-black text-emerald-400">4.8x</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500/20 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/10 group">
                        <span className="text-white/40 group-hover:text-white transition-colors">✕</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* --- NAVIGATION SIDEBAR --- */}
                <div className="w-20 lg:w-72 bg-black/40 border-r border-white/5 flex flex-col p-4 gap-4 z-40 shrink-0">
                    {[
                        { id: 'overview', label: 'Executive Overview', icon: '📊', desc: 'Performance Intelligence' },
                        { id: 'universe', label: 'Client Universe', icon: '👥', desc: 'Target Database' },
                        { id: 'campaigns', label: 'Campaign Lab', icon: '🚀', desc: 'Growth Engine' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full p-4 rounded-[1.5rem] flex flex-col lg:flex-row items-center gap-4 transition-all duration-300 relative group overflow-hidden ${
                                activeTab === item.id 
                                ? 'bg-blue-600 shadow-[0_20px_40px_rgba(37,99,235,0.2)] text-white scale-[1.02] border border-white/20' 
                                : 'hover:bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            <span className="text-2xl drop-shadow-md">{item.icon}</span>
                            <div className="hidden lg:block text-left">
                                <div className="text-[11px] font-black uppercase tracking-wider">{item.label}</div>
                                <div className="text-[8px] opacity-40 font-bold uppercase truncate max-w-[150px]">{item.desc}</div>
                            </div>
                        </button>
                    ))}
                    
                    <div className="mt-auto hidden lg:block">
                        <div className="p-5 bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/20 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">💡</div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Bestie Tip</p>
                            <p className="text-[11px] text-white/60 italic leading-relaxed">
                                {selectedLead ? `"Bhai, ${selectedLead.name} ki journey dekh rahe ho? Ek extra nudge de do and closure done!"` : `"Bhai, Vikram Singh ki deal 90% closing stage par hai. Ek follow-up aur, and target achieved! 🔥"`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- WORKSPACE ENGINE --- */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.05)_0%,_transparent_50%)]">
                    
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                            
                            {/* Visual KPI Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Network Reach', val: '12.4K', trend: '↑ 24%', col: 'blue' },
                                    { label: 'Active Leads', val: '342', trend: '↑ 12%', col: 'purple' },
                                    { label: 'Conversion', val: '8.4%', trend: '↑ 0.8%', col: 'emerald' },
                                    { label: 'Churn Rate', val: '1.2%', trend: '↓ 0.2%', col: 'red' }
                                ].map((kpi, i) => (
                                    <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all hover:-translate-y-1">
                                        <div className={`absolute -right-8 -top-8 w-24 h-24 bg-${kpi.col}-500/5 blur-3xl`}></div>
                                        <div className={`text-[9px] font-black text-${kpi.col}-400 uppercase tracking-[0.3em] mb-6`}>{kpi.label}</div>
                                        <div className="text-4xl font-black tracking-tighter mb-1">{kpi.val}</div>
                                        <div className={`text-[10px] font-bold ${kpi.trend.includes('↑') ? 'text-emerald-400' : 'text-red-400'}`}>{kpi.trend} <span className="text-white/20 ml-1">vs last month</span></div>
                                    </div>
                                ))}
                            </div>

                            {/* MAIN CHARTS SECTION */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                
                                {/* GROWTH AREA CHART */}
                                <div className="lg:col-span-2 p-10 bg-black/60 border border-white/10 rounded-[3.5rem] min-h-[450px] flex flex-col shadow-2xl backdrop-blur-2xl relative group">
                                    <div className="flex justify-between items-center mb-12">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-1">Scale Analytics</h3>
                                            <div className="text-2xl font-black">Contact Acquisition Flow</div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 tracking-[0.2em]">LIVE DATA STREAM</div>
                                    </div>

                                    <div className="flex-1 relative mt-4">
                                        <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible">
                                            <defs>
                                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            
                                            {/* Grid */}
                                            {[0, 50, 100, 150, 200].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                                            
                                            {/* Area */}
                                            <path 
                                                d={getChartPath(true)} fill="url(#chartGrad)" 
                                                className={`transition-all duration-[2s] ease-out origin-bottom ${isLoaded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`} 
                                            />
                                            
                                            {/* Line */}
                                            <path 
                                                d={getChartPath(false)} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                                                className={`transition-all duration-[2.5s] ease-out ${isLoaded ? 'dash-offset-0' : 'dash-offset-full'}`}
                                                style={{ strokeDasharray: 2000, strokeDashoffset: isLoaded ? 0 : 2000 }}
                                            />

                                            {/* Points */}
                                            {GROWTH_DATA.map((d, i) => (
                                                <circle 
                                                    key={i} cx={(i / (GROWTH_DATA.length - 1)) * 1000} cy={200 - (d.v / 13000) * 200} r="6" 
                                                    fill="#3b82f6" className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                                                    style={{ transitionDelay: `${i * 100}ms` }}
                                                />
                                            ))}
                                        </svg>
                                        
                                        {/* X-Axis */}
                                        <div className="absolute left-0 right-0 -bottom-8 flex justify-between px-2">
                                            {GROWTH_DATA.map((d, i) => <span key={i} className="text-[9px] font-black text-white/20">{d.m}</span>)}
                                        </div>
                                    </div>

                                    <div className="mt-16 flex gap-10 border-t border-white/5 pt-8">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Peak Volume</span>
                                            <span className="text-xl font-black text-blue-400">12.4K <span className="text-[10px] text-emerald-400">↑ 18%</span></span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Growth Forecast</span>
                                            <span className="text-xl font-black text-white">15K+ <span className="text-[10px] text-blue-400">BY Q2</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* DONUT CHART: TARGET DISTRO */}
                                <div className="p-10 bg-black/60 border border-white/10 rounded-[3.5rem] flex flex-col shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-10">Lead Mix Matrix</h3>
                                    
                                    <div className="flex-1 flex flex-col items-center justify-center gap-10">
                                        <div className="relative w-48 h-48">
                                            <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                                                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="45 100" className={`transition-all duration-[2s] ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                                                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-45" className={`transition-all duration-[2s] ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                                                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#6366f1" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-75" className={`transition-all duration-[2s] ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="text-3xl font-black tracking-tighter">342</div>
                                                <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active</div>
                                            </div>
                                        </div>

                                        <div className="w-full space-y-4">
                                            {[
                                                { l: 'Strategic', v: '45%', col: 'bg-blue-500' },
                                                { l: 'High Risk', v: '30%', col: 'bg-red-500' },
                                                { l: 'Enterprise', v: '25%', col: 'bg-indigo-500' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${item.col} shadow-[0_0_10px_currentColor]`}></div>
                                                        <span className="text-[10px] font-black uppercase text-white/50">{item.l}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black">{item.v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: UNIVERSE (Leads) */}
                    {activeTab === 'universe' && (
                        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 h-full animate-in fade-in slide-in-from-right-8 duration-700">
                            
                            {/* Leads Browser */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-end mb-10 shrink-0">
                                    <div>
                                        <h3 className="text-5xl font-black tracking-tighter mb-1">Target Universe</h3>
                                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.5em]">High Precision Acquisition</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="relative group">
                                            <input 
                                                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Filter targets..." 
                                                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none w-64 backdrop-blur-xl transition-all" 
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                                        </div>
                                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">Add Entry</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-32">
                                    {filteredLeads.map(lead => (
                                        <div 
                                            key={lead.id} onClick={() => setSelectedLead(lead)}
                                            className={`p-6 rounded-[2.5rem] border flex items-center gap-6 transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                                                selectedLead?.id === lead.id ? 'bg-blue-600 border-blue-400 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform">
                                                {lead.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xl font-black tracking-tight">{lead.name}</div>
                                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{lead.company}</div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1.5">
                                                <div className="text-lg font-black text-white">{lead.value}</div>
                                                <div className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${lead.status === 'Hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                                    {lead.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* --- DEEP DOSSIER (DETAILED VIEW) --- */}
                            <div className="w-full lg:w-[450px] shrink-0 sticky top-0 h-full">
                                {selectedLead ? (
                                    <div className="bg-black/60 border border-white/10 rounded-[4rem] p-8 h-full flex flex-col shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-3xl relative overflow-hidden">
                                        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]"></div>
                                        
                                        <div className="text-center mb-8 relative z-10 shrink-0">
                                            <div className="w-24 h-24 bg-black/60 rounded-[2rem] mx-auto flex items-center justify-center text-5xl shadow-2xl mb-4 border border-white/10 transform hover:scale-105 transition-transform ring-4 ring-blue-600/5">
                                                {selectedLead.icon}
                                            </div>
                                            <h4 className="text-2xl font-black tracking-tighter mb-1">{selectedLead.name}</h4>
                                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.4em]">{selectedLead.company}</p>
                                        </div>

                                        <div className="space-y-6 flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-2 pb-10">
                                            
                                            {/* 1. NEURAL TAGS */}
                                            <div>
                                                <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">Neural Matrix Tags</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(selectedLead.tags || [selectedLead.tag]).map((t: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 tracking-wide">
                                                            #{t.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 2. STRATEGIC NOTES */}
                                            <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Intelligence Memo
                                                </div>
                                                <p className="text-xs text-white/80 leading-relaxed font-medium">
                                                    {selectedLead.notes || `"Bhai, ye client Cloud Migration protocols explore kar raha hai. ${selectedLead.tag} status validated."`}
                                                </p>
                                            </div>

                                            {/* 3. KEY METRICS */}
                                            <div className="space-y-4">
                                                {[
                                                    { l: 'Pipeline Stage', v: selectedLead.stage, c: 'text-blue-400' },
                                                    { l: 'Est. Valuation', v: selectedLead.value, c: 'text-emerald-400' },
                                                    { l: 'Point of Contact', v: selectedLead.email, c: 'text-white/60' },
                                                    { l: 'Direct Comms', v: selectedLead.phone, c: 'text-white/60' }
                                                ].map((d, i) => (
                                                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{d.l}</span>
                                                        <span className={`text-[10px] font-bold ${d.c}`}>{d.v}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 4. ENGAGEMENT JOURNEY (HISTORY) */}
                                            <div>
                                                <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Engagement Journey</div>
                                                <div className="space-y-4 pl-4 border-l border-white/10">
                                                    {(selectedLead.journey || []).map((step: any, i: number) => (
                                                        <div key={i} className="relative group/step">
                                                            <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-blue-600 border border-black shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-sm">{step.icon}</span>
                                                                <span className="text-[10px] font-black text-white/90 uppercase tracking-wider">{step.title}</span>
                                                                <span className="text-[8px] text-white/20 ml-auto">{new Date(step.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-[10px] text-white/40 leading-relaxed group-hover/step:text-white/60 transition-colors">{step.details}</p>
                                                        </div>
                                                    ))}
                                                    {(!selectedLead.journey || selectedLead.journey.length === 0) && (
                                                        <p className="text-[9px] text-white/20 italic">No historical events recorded.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-auto relative z-10 shrink-0 pt-4 border-t border-white/5">
                                            <button className="py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                                                <span>💬</span> WhatsApp
                                            </button>
                                            <button className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all">Archive</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/10 border-dashed rounded-[4rem] opacity-30 group hover:opacity-50 transition-all">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">👤</div>
                                        <h4 className="text-xl font-black uppercase tracking-widest">Awaiting Command</h4>
                                        <p className="text-xs mt-4 font-bold leading-relaxed max-w-xs">Select a target from the universe to initialize deep-scan analysis.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CAMPAIGNS */}
                    {activeTab === 'campaigns' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-left-8 duration-700 pb-32">
                            <div className="text-center mb-20">
                                <h3 className="text-7xl font-black tracking-tighter mb-4 leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">Marketing Lab</h3>
                                <p className="text-[11px] text-blue-500 font-black uppercase tracking-[1em]">Viral Expansion Protocols Active</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {CAMPAIGN_METRICS.map(m => (
                                    <div key={m.id} className="p-10 bg-white/5 border border-white/5 rounded-[3.5rem] group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden hover:border-white/10 shadow-2xl">
                                        <div className="flex justify-between items-start mb-10 relative z-10">
                                            <div className="w-20 h-20 bg-black/40 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl group-hover:rotate-12 transition-transform border border-white/5">
                                                {m.icon}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Global Reach</div>
                                                <div className="text-4xl font-black tracking-tighter" style={{ color: m.color }}>{m.reach}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6 relative z-10">
                                            <div>
                                                <div className="flex justify-between items-end mb-2">
                                                    <h4 className="text-2xl font-black">{m.label}</h4>
                                                    <span className="text-xs font-bold" style={{ color: m.color }}>{m.conversion}% Efficiency</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full transition-all duration-[2s] ease-out shadow-[0_0_15px_currentColor]"
                                                        style={{ width: isLoaded ? `${m.conversion * 2}%` : '0%', backgroundColor: m.color }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center border-t border-white/5 pt-6">
                                                <div className="text-center">
                                                    <div className="text-[8px] font-black text-white/20 uppercase">ROI Multiplier</div>
                                                    <div className="text-xl font-black" style={{ color: m.color }}>{m.roi}</div>
                                                </div>
                                                <button className="px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black" style={{ border: `1px solid ${m.color}`, color: m.color }}>Deploy Update</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Neural Architect Input */}
                            <div className="p-12 bg-black/60 border border-white/5 rounded-[4rem] shadow-2xl relative overflow-hidden group backdrop-blur-3xl">
                                <div className="absolute top-10 left-10 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Strategy Generator</span>
                                </div>
                                <textarea 
                                    placeholder="Bhai, explain your target niche. I'll construct a full omni-channel growth strategy for you..."
                                    className="w-full h-48 bg-transparent outline-none text-2xl font-light leading-relaxed resize-none placeholder-white/5 mt-10"
                                ></textarea>
                                <button className="w-full py-8 bg-blue-600 hover:bg-blue-500 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-4 group">
                                    <span className="group-hover:rotate-180 transition-transform duration-700 text-2xl">⚙️</span> EXECUTE STRATEGY ENGINE
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.2); border-radius: 4px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .dash-offset-full { stroke-dashoffset: 2000; }
                .dash-offset-0 { stroke-dashoffset: 0; }
            `}</style>
        </div>
    );
};
