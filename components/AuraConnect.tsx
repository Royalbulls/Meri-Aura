
import React, { useState, useEffect } from 'react';
import { Persona, Contact, CampusStat, Sender } from '../types';
import { storageService } from '../services/storageService';

interface AuraConnectProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

export const AuraConnect: React.FC<AuraConnectProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'universe' | 'add'>('overview');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Form State for New Contact
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        phone: "",
        email: "",
        type: 'personal' as 'personal' | 'business',
        notes: "",
        status: 'Hot' // Custom tag
    });

    useEffect(() => {
        if (isOpen) {
            loadContacts();
        }
    }, [isOpen]);

    const loadContacts = async () => {
        setIsLoading(true);
        const data = await storageService.getAllContacts();
        setContacts(data.sort((a, b) => b.joinedDate - a.joinedDate));
        setIsLoading(false);
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return;

        const newContact: Contact = {
            id: Date.now().toString(),
            businessId: 'aura_global',
            type: formData.type,
            source: 'direct',
            journey: [{ id: 'j1', icon: '✨', title: 'Captured by Aura', timestamp: Date.now(), details: 'Initial onboarding complete.' }],
            name: formData.name,
            companyName: formData.company,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes,
            tags: [formData.status],
            joinedDate: Date.now()
        };

        await storageService.saveContact(newContact);
        setFormData({ name: "", company: "", phone: "", email: "", type: 'personal', notes: "", status: 'Hot' });
        loadContacts();
        setActiveTab('universe');
    };

    const handleDeleteContact = async (id: string) => {
        if(window.confirm("Bhai, lead delete kar du?")) {
            await storageService.deleteContact(id);
            loadContacts();
        }
    };

    const getStats = () => {
        const total = contacts.length;
        const hotLeads = contacts.filter(c => c.tags.includes('Hot')).length;
        const bizContacts = contacts.filter(c => c.type === 'business').length;
        const todayCount = contacts.filter(c => {
            const d = new Date(c.joinedDate);
            return d.toDateString() === new Date().toDateString();
        }).length;

        return [
            { id: 'total', label: 'Total Contacts', value: total.toString(), trend: `↑ ${todayCount} today`, color: 'blue' },
            { id: 'hot', label: 'Hot Leads', value: hotLeads.toString(), trend: 'High Priority', color: 'pink' },
            { id: 'biz', label: 'Business Nodes', value: bizContacts.toString(), trend: 'Strategic', color: 'emerald' },
            { id: 'reach', label: 'Saved Hours', value: (total * 2).toString() + 'h', trend: 'CRM Impact', color: 'purple' }
        ];
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[150] bg-[#020205] flex flex-col font-sans text-white animate-in slide-in-from-right duration-500 overflow-hidden select-none">
            
            {/* HEADER */}
            <div className="h-24 border-b border-white/5 flex justify-between items-center px-8 bg-black/40 backdrop-blur-3xl z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10 group cursor-pointer">
                        <span className="group-hover:rotate-12 transition-transform">🤝</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase">Aura Connect CRM</h2>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> {contacts.length} Neural Nodes Online
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500/20 rounded-2xl flex items-center justify-center transition-all border border-white/10">✕</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* SIDEBAR */}
                <div className="w-20 lg:w-72 bg-black/40 border-r border-white/5 flex flex-col p-4 gap-4 z-40 shrink-0">
                    {[
                        { id: 'overview', label: 'Executive Stats', icon: '📊' },
                        { id: 'universe', label: 'Leads Universe', icon: '👥' },
                        { id: 'add', label: 'Capture Lead', icon: '⚡' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full p-4 rounded-2xl flex flex-col lg:flex-row items-center gap-4 transition-all ${
                                activeTab === item.id 
                                ? 'bg-blue-600 shadow-xl text-white' 
                                : 'hover:bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="hidden lg:block text-[11px] font-black uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* WORKSPACE */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.05)_0%,_transparent_50%)]">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {getStats().map((stat) => (
                                    <div key={stat.id} className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
                                        <div className={`text-[9px] font-black text-${stat.color}-400 uppercase tracking-[0.3em] mb-4`}>{stat.label}</div>
                                        <div className="text-4xl font-black mb-1">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-emerald-400">{stat.trend}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-blue-600/10 border border-blue-500/20 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-8">
                                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl shrink-0">🤖</div>
                                <div className="flex-1">
                                    <div className="text-2xl font-black mb-2 leading-tight uppercase tracking-tighter">Aura Lead Analytics</div>
                                    <p className="text-sm text-white/60 leading-relaxed italic">
                                        "Bhai, aapke database mein abhi **{contacts.filter(c => c.tags.includes('Hot')).length} Hot Leads** hain. Unhe follow-up karna priority hai. Latest contact **{contacts[0]?.name || 'N/A'}** hai."
                                    </p>
                                </div>
                                <button onClick={() => setActiveTab('add')} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Capture New</button>
                            </div>
                        </div>
                    )}

                    {/* UNIVERSE TAB */}
                    {activeTab === 'universe' && (
                        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <h3 className="text-4xl font-black tracking-tighter uppercase">Neural Universe</h3>
                                <div className="w-full md:w-80 relative">
                                    <input 
                                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Filter Leads..."
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3 text-xs outline-none focus:border-blue-500 transition-all"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="py-20 text-center animate-pulse">Syncing nodes...</div>
                            ) : contacts.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <div className="text-6xl mb-4">🏜️</div>
                                    <p className="font-black uppercase tracking-widest text-xs">No contacts materiality detected.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                                    {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                                        <div key={lead.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col gap-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:rotate-12 transition-transform">
                                                    {lead.type === 'business' ? '🏢' : '👤'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xl font-black tracking-tight truncate uppercase">{lead.name}</div>
                                                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">{lead.companyName || 'Individual Node'}</div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={`text-[8px] px-3 py-1 rounded-full uppercase font-black tracking-widest ${
                                                        lead.tags[0] === 'Hot' ? 'bg-pink-500/20 text-pink-400' : 
                                                        lead.tags[0] === 'Warm' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                        {lead.tags[0]}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-[11px] font-bold text-white/40">
                                                    <span>📞 {lead.phone}</span>
                                                    {lead.email && <span className="truncate">📧 {lead.email}</span>}
                                                </div>
                                                <p className="text-[10px] text-white/60 line-clamp-2 italic">"{lead.notes || 'No neural notes.'}"</p>
                                            </div>
                                            
                                            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2">
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Added: {new Date(lead.joinedDate).toLocaleDateString()}</span>
                                                <div className="flex gap-2">
                                                    <a href={`tel:${lead.phone}`} className="p-2 bg-blue-600 rounded-lg text-white text-xs hover:bg-blue-500 transition-colors">CALL</a>
                                                    <button onClick={() => handleDeleteContact(lead.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-colors">DEL</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADD TAB */}
                    {activeTab === 'add' && (
                        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
                             <div className="text-center mb-12">
                                <h3 className="text-5xl font-black tracking-tighter uppercase mb-2">Capture Intelligence</h3>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.6em]">New Lead Protocol</p>
                            </div>

                            <form onSubmit={handleAddContact} className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-6 backdrop-blur-3xl shadow-2xl">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Full Name</label>
                                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" placeholder="e.g. Rahul Sharma" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Phone Number</label>
                                        <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" placeholder="+91..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Organization</label>
                                        <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" placeholder="College or Office" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Email Addr</label>
                                        <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" placeholder="email@domain.com" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Node Type</label>
                                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all appearance-none">
                                            <option value="personal" className="bg-gray-900">Personal Ambassador</option>
                                            <option value="business" className="bg-gray-900">Business Enterprise</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Heat Level</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all appearance-none">
                                            <option value="Hot" className="bg-gray-900">🔥 Hot (Ready)</option>
                                            <option value="Warm" className="bg-gray-900">⚡ Warm (Interested)</option>
                                            <option value="Cold" className="bg-gray-900">❄️ Cold (Future)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Neural Notes</label>
                                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 text-sm outline-none focus:border-blue-500 transition-all resize-none" placeholder="Bhai, is lead ke bare mein kuch details likho..."></textarea>
                                </div>

                                <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.4em] shadow-xl shadow-blue-500/20 transition-all active:scale-95">Materialize Lead</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.2); border-radius: 4px; }`}</style>
        </div>
    );
};
