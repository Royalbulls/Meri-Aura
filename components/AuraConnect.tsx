
import React, { useState, useEffect } from 'react';
import { Persona, Contact } from '../types';
import { storageService } from '../services/storageService';

interface AuraConnectProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

export const AuraConnect: React.FC<AuraConnectProps> = ({ isOpen, onClose, currentPersona }) => {
    const [activeTab, setActiveTab] = useState<'universe' | 'add'>('universe');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({ name: "", phone: "", status: 'Hot' });

    useEffect(() => {
        if (isOpen) loadContacts();
    }, [isOpen]);

    const loadContacts = async () => {
        setIsLoading(true);
        const data = await storageService.getAllContacts();
        setContacts(data.sort((a, b) => b.joinedDate - a.joinedDate));
        setIsLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const newContact: Contact = {
            id: Date.now().toString(), businessId: 'global', type: 'personal', journey: [],
            name: formData.name, phone: formData.phone, notes: "", tags: [formData.status], joinedDate: Date.now()
        };
        await storageService.saveContact(newContact);
        setFormData({ name: "", phone: "", status: 'Hot' });
        loadContacts();
        setActiveTab('universe');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1650] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden h-[75vh]">
                
                <div className="h-14 px-6 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs">👥</div>
                        <h2 className="text-xs font-black uppercase tracking-widest italic">Neural Connect</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('universe')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${activeTab === 'universe' ? 'bg-blue-600' : 'text-white/30'}`}>Universe</button>
                        <button onClick={() => setActiveTab('add')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${activeTab === 'add' ? 'bg-blue-600' : 'text-white/30'}`}>Add</button>
                        <button onClick={onClose} className="ml-2 w-7 h-7 flex items-center justify-center bg-white/5 rounded-full text-xs">✕</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto neural-scroll p-4">
                    {activeTab === 'universe' ? (
                        <div className="space-y-2">
                            <input 
                                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Filter Nodes..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] outline-none mb-4"
                            />
                            {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                                <div key={lead.id} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-sm">👤</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-black uppercase truncate">{lead.name}</div>
                                        <div className="text-[8px] font-bold text-white/20">{lead.phone}</div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${lead.tags[0] === 'Hot' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {lead.tags[0]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleAdd} className="p-4 space-y-4 max-w-sm mx-auto">
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none" placeholder="Name" />
                            <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none" placeholder="Phone" />
                            <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest">Capture Lead</button>
                        </form>
                    )}
                </div>
            </div>
            <style>{`.neural-scroll::-webkit-scrollbar { width: 3px; } .neural-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>
        </div>
    );
};
