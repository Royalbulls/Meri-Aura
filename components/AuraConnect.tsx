
import React, { useState, useEffect, useRef } from 'react';
import { Contact, Persona } from '../types';
import { generateCreativeContent } from '../services/geminiService';

interface AuraConnectProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: Persona;
}

interface CallLog {
    id: string;
    contactId: string;
    contactName: string;
    type: 'incoming' | 'outgoing' | 'missed' | 'voicemail';
    timestamp: number;
    duration: string;
    notes?: string;
}

// Helper: Generate Initials
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

// Helper: Dynamic Avatar Color (Premium Palette)
const getAvatarColor = (name: string) => {
    const gradients = [
        'from-pink-600 to-rose-900',
        'from-purple-600 to-indigo-900',
        'from-cyan-600 to-blue-900',
        'from-amber-600 to-orange-900',
        'from-emerald-600 to-teal-900'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `bg-gradient-to-br ${gradients[Math.abs(hash) % gradients.length]}`;
};

// Helper: Relative Time
const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
};

export const AuraConnect: React.FC<AuraConnectProps> = ({ isOpen, onClose, currentPersona }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [view, setView] = useState<'dashboard' | 'add' | 'campaign' | 'history' | 'detail'>('dashboard');
    const [activeContact, setActiveContact] = useState<Contact | null>(null);
    const [campaignMode, setCampaignMode] = useState<'message' | 'call' | 'email'>('message');
    const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', notes: '', tags: '' });
    const [taskInput, setTaskInput] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Campaign Execution State
    const [campaignStep, setCampaignStep] = useState<'setup' | 'review'>('setup');
    const [campaignResults, setCampaignResults] = useState<{ contactId: string; content: string; status: 'pending' | 'completed' }[]>([]);

    // Power Dialer State
    const [isPowerDialing, setIsPowerDialing] = useState(false);
    const [powerDialIndex, setPowerDialIndex] = useState(0);
    const [callDuration, setCallDuration] = useState(0);
    const dialTimerRef = useRef<number | null>(null);

    // History State
    const [historyFilter, setHistoryFilter] = useState<'all' | 'incoming' | 'outgoing' | 'missed'>('all');
    const [showLogModal, setShowLogModal] = useState(false);
    const [manualLog, setManualLog] = useState({ contactId: '', type: 'incoming', duration: '', notes: '', date: '' });

    const importInputRef = useRef<HTMLInputElement>(null);

    // Load data on mount
    useEffect(() => {
        const savedContacts = localStorage.getItem('aura_crm_contacts');
        if (savedContacts) {
            try {
                setContacts(JSON.parse(savedContacts));
            } catch (e) {
                console.error("Failed to load contacts", e);
            }
        }
        const savedLogs = localStorage.getItem('aura_call_history');
        if (savedLogs) {
            try {
                setCallLogs(JSON.parse(savedLogs));
            } catch(e) {
                console.error("Failed to load call logs", e);
            }
        }
    }, []);

    // Timer for Power Dialer
    useEffect(() => {
        if (isPowerDialing) {
            dialTimerRef.current = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (dialTimerRef.current) clearInterval(dialTimerRef.current);
            setCallDuration(0);
        }
        return () => {
            if (dialTimerRef.current) clearInterval(dialTimerRef.current);
        };
    }, [isPowerDialing, powerDialIndex]);

    const saveContacts = (updated: Contact[]) => {
        setContacts(updated);
        localStorage.setItem('aura_crm_contacts', JSON.stringify(updated));
    };

    const saveLogs = (logs: CallLog[]) => {
        setCallLogs(logs);
        localStorage.setItem('aura_call_history', JSON.stringify(logs));
    };

    const getLastContactDate = (contactId: string) => {
        const logs = callLogs.filter(l => l.contactId === contactId);
        if (logs.length === 0) return null;
        return Math.max(...logs.map(l => l.timestamp));
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddContact = (e: React.FormEvent) => {
        e.preventDefault();
        const contact: Contact = {
            id: Date.now().toString(),
            name: newContact.name,
            phone: newContact.phone,
            email: newContact.email,
            notes: newContact.notes,
            tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t)
        };
        saveContacts([...contacts, contact]);
        setNewContact({ name: '', phone: '', email: '', notes: '', tags: '' });
        setView('dashboard');
    };

    const handleDeleteContact = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (window.confirm("Delete this contact?")) {
            saveContacts(contacts.filter(c => c.id !== id));
            if (activeContact?.id === id) {
                setActiveContact(null);
                setView('dashboard');
            }
        }
    };

    const toggleSelectContact = (id: string) => {
        setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const selectAllContacts = () => {
        if (selectedContacts.length === contacts.length) setSelectedContacts([]);
        else setSelectedContacts(contacts.map(c => c.id));
    };

    const openContactDetail = (contact: Contact) => {
        setActiveContact(contact);
        setView('detail');
    };

    // Filter contacts based on search
    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- SMART CSV IMPORT LOGIC ---
    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) return;

            const parseLine = (line: string) => {
                const result = [];
                let startValueIndex = 0;
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === '"') {
                        inQuotes = !inQuotes;
                    } else if (line[i] === ',' && !inQuotes) {
                        let val = line.substring(startValueIndex, i).trim();
                        if (val.startsWith('"') && val.endsWith('"')) {
                            val = val.substring(1, val.length - 1);
                        }
                        result.push(val.replace(/""/g, '"'));
                        startValueIndex = i + 1;
                    }
                }
                let lastVal = line.substring(startValueIndex).trim();
                if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
                    lastVal = lastVal.substring(1, lastVal.length - 1);
                }
                result.push(lastVal.replace(/""/g, '"'));
                return result;
            };

            const headers = parseLine(lines[0]).map(h => h.toLowerCase());
            
            const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('first'));
            const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('cell'));
            const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));

            if (nameIndex === -1) {
                alert("Error: Could not find a 'Name' column in the CSV.");
                return;
            }

            const newContacts: Contact[] = [];
            
            for (let i = 1; i < lines.length; i++) {
                const row = parseLine(lines[i]);
                if (row.length <= nameIndex) continue;

                const name = row[nameIndex];
                let phone = (phoneIndex !== -1 && row.length > phoneIndex) ? row[phoneIndex] : '';
                const email = (emailIndex !== -1 && row.length > emailIndex) ? row[emailIndex] : '';

                if (phone) phone = phone.replace(/[^0-9+]/g, ''); 

                if (name) {
                    const exists = contacts.some(c => c.name === name) || newContacts.some(nc => nc.name === name);
                    if (!exists) {
                        newContacts.push({
                            id: Date.now().toString() + Math.random(),
                            name: name,
                            phone: phone,
                            email: email,
                            notes: 'Imported Contact',
                            tags: ['Imported']
                        });
                    }
                }
            }

            if (newContacts.length > 0) {
                saveContacts([...contacts, ...newContacts]);
                alert(`✅ Successfully imported ${newContacts.length} contacts!`);
            } else {
                alert("No new contacts found or format invalid.");
            }
            if (importInputRef.current) importInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    // --- AI CAMPAIGN EXECUTION ---
    const handleRunCampaign = async () => {
        if (!taskInput || selectedContacts.length === 0) return;
        setIsProcessing(true);
        setCampaignResults([]);

        const newResults: { contactId: string; content: string; status: 'pending' | 'completed' }[] = [];

        const promises = selectedContacts.map(async (id) => {
            const contact = contacts.find(c => c.id === id);
            if (!contact) return;

            try {
                let prompt = "";
                if (campaignMode === 'message') {
                    prompt = `ACT AS AURA. Draft a personal WhatsApp message for ${contact.name}. Context: ${contact.notes}. Goal: ${taskInput}. Tone: Friendly, Human, Emojis. Return ONLY message.`;
                } else if (campaignMode === 'call') {
                    prompt = `ACT AS AURA. Write a phone script for ${contact.name}. Context: ${contact.notes}. Goal: ${taskInput}. Return bullet points (HTML).`;
                } else if (campaignMode === 'email') {
                    prompt = `ACT AS AURA. Draft cold email for ${contact.name}. Goal: ${taskInput}. Return: SUBJECT: ... BODY: ...`;
                }
                
                const response = await generateCreativeContent('blog_post', prompt, currentPersona); 
                newResults.push({
                    contactId: id,
                    content: response.text.replace(/```html|```/g, '').trim(),
                    status: 'pending'
                });
            } catch (e) {
                newResults.push({
                    contactId: id,
                    content: "Error generating content.",
                    status: 'pending'
                });
            }
        });

        await Promise.all(promises);

        setCampaignResults(newResults);
        setCampaignStep('review');
        setIsProcessing(false);
    };

    const sendWhatsApp = (phone: string, text: string) => {
        const cleanText = text.replace(/<[^>]*>?/gm, '');
        const encodedText = encodeURIComponent(cleanText);
        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };

    const makeCall = (contact: Contact) => {
        window.open(`tel:${contact.phone}`, '_self');
        const newLog: CallLog = {
            id: Date.now().toString(),
            contactId: contact.id,
            contactName: contact.name,
            type: 'outgoing',
            timestamp: Date.now(),
            duration: 'Dialed'
        };
        saveLogs([newLog, ...callLogs]);
    };

    const sendEmail = (email: string, fullContent: string) => {
        let subject = "New Message";
        let body = fullContent;

        const subjectMatch = fullContent.match(/SUBJECT:(.*?)(\n|BODY:|$)/i);
        const bodyMatch = fullContent.split(/BODY:/i);

        if (subjectMatch && subjectMatch[1]) {
            subject = subjectMatch[1].trim();
        }
        if (bodyMatch.length > 1) {
            body = bodyMatch[1].trim();
        } else if (subjectMatch) {
            body = fullContent.replace(subjectMatch[0], '').trim();
        }

        const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailto, '_blank');
    };

    const executeCampaignAction = (index: number) => {
        const result = campaignResults[index];
        const contact = contacts.find(c => c.id === result.contactId);
        if (!contact) return;

        if (campaignMode === 'message') sendWhatsApp(contact.phone, result.content);
        else if (campaignMode === 'email') sendEmail(contact.email || '', result.content);
        else if (campaignMode === 'call') makeCall(contact);

        setCampaignResults(prev => prev.map((r, i) => i === index ? { ...r, status: 'completed' } : r));
    };

    const runAutoPilot = async () => {
        if (!window.confirm("Aura will now attempt to automate this campaign.")) return;
        
        // --- POWER DIALER MODE ---
        if (campaignMode === 'call') {
            setIsPowerDialing(true);
            setPowerDialIndex(0);
            
            // Trigger first call immediately
            const result = campaignResults[0];
            const contact = contacts.find(c => c.id === result.contactId);
            if (contact) {
                // We use timeout to allow the React state to update UI first
                setTimeout(() => {
                    window.open(`tel:${contact.phone}`, '_self');
                }, 500);
            }
            return;
        }

        // Existing Message/Email Auto-Pilot
        for (let i = 0; i < campaignResults.length; i++) {
            if (campaignResults[i].status === 'pending') {
                executeCampaignAction(i);
                // Artificial delay to allow browser to handle opening tabs and prevent blocking
                await new Promise(r => setTimeout(r, 1500)); 
            }
        }
    };

    // --- POWER DIALER LOGIC ---
    const handlePowerDialOutcome = (type: 'outgoing' | 'voicemail' | 'missed') => {
        const result = campaignResults[powerDialIndex];
        const contact = contacts.find(c => c.id === result.contactId);
        
        if (contact) {
            // 1. Log the call
            const newLog: CallLog = {
                id: Date.now().toString(),
                contactId: contact.id,
                contactName: contact.name,
                type: type,
                timestamp: Date.now(),
                duration: formatDuration(callDuration),
                notes: `Power Dialer: ${type === 'voicemail' ? 'Left VM' : type === 'missed' ? 'No Answer' : 'Connected'}`
            };
            saveLogs([newLog, ...callLogs]);

            // 2. Mark campaign item as complete
            setCampaignResults(prev => prev.map((r, i) => i === powerDialIndex ? { ...r, status: 'completed' } : r));
        }

        // 3. Move to next
        const nextIndex = powerDialIndex + 1;
        if (nextIndex < campaignResults.length) {
            setPowerDialIndex(nextIndex);
            setCallDuration(0);
            
            // 4. Trigger Next Dial (Autonomous Chain)
            const nextResult = campaignResults[nextIndex];
            const nextContact = contacts.find(c => c.id === nextResult.contactId);
            if (nextContact) {
                // Small delay for UX transition
                setTimeout(() => {
                    window.open(`tel:${nextContact.phone}`, '_self');
                }, 1000);
            }
        } else {
            // Finished
            setIsPowerDialing(false);
            alert("Power Dialing Session Complete!");
        }
    };

    const handleManualLog = (e: React.FormEvent) => {
        e.preventDefault();
        const contact = contacts.find(c => c.id === manualLog.contactId);
        if (!contact) return;

        const timestamp = manualLog.date ? new Date(manualLog.date).getTime() : Date.now();

        const newLog: CallLog = {
            id: Date.now().toString(),
            contactId: contact.id,
            contactName: contact.name,
            type: manualLog.type as any,
            timestamp: timestamp,
            duration: manualLog.duration || '0m',
            notes: manualLog.notes
        };
        
        saveLogs([newLog, ...callLogs]);
        setShowLogModal(false);
        setManualLog({ contactId: '', type: 'incoming', duration: '', notes: '', date: '' });
    };

    const filteredLogs = historyFilter === 'all' 
        ? callLogs 
        : callLogs.filter(log => log.type === historyFilter);

    if (!isOpen) return null;

    // --- POWER DIALER OVERLAY ---
    if (isPowerDialing && campaignResults[powerDialIndex]) {
        const result = campaignResults[powerDialIndex];
        const contact = contacts.find(c => c.id === result.contactId);
        const progress = Math.round(((powerDialIndex + 1) / campaignResults.length) * 100);

        return (
            <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center font-sans text-white">
                <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
                    
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 border-b border-white/10 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold animate-pulse text-green-400">⚡ Power Dialer Active</h2>
                            <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Autonomous Agent Mode</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-mono font-bold">{formatDuration(callDuration)}</div>
                            <div className="text-xs text-white/40">Duration</div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
                        
                        {/* Contact Card */}
                        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                            <div className={`w-20 h-20 rounded-full ${getAvatarColor(contact?.name || '?')} flex items-center justify-center text-3xl font-bold border-4 border-[#121212] shadow-xl`}>
                                {getInitials(contact?.name || '?')}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{contact?.name}</h3>
                                <p className="text-lg text-white/60 font-mono mt-1">{contact?.phone}</p>
                                <div className="flex gap-2 mt-2">
                                    {contact?.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-white/50">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Script */}
                        <div className="flex-1 bg-black/30 rounded-2xl p-6 border border-white/5 overflow-y-auto relative">
                            <div className="absolute top-4 right-4 text-[10px] text-white/30 uppercase font-bold border border-white/10 px-2 py-1 rounded">Script</div>
                            <p className="whitespace-pre-wrap text-sm leading-loose text-white/80 font-medium">
                                {result.content}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button 
                                onClick={() => handlePowerDialOutcome('outgoing')}
                                className="p-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1"
                            >
                                <span className="text-xl">✅</span>
                                Connected
                            </button>
                            <button 
                                onClick={() => handlePowerDialOutcome('voicemail')}
                                className="p-4 bg-amber-600 hover:bg-amber-500 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1"
                            >
                                <span className="text-xl">🗣️</span>
                                Voicemail
                            </button>
                            <button 
                                onClick={() => handlePowerDialOutcome('missed')}
                                className="p-4 bg-red-600 hover:bg-red-500 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1"
                            >
                                <span className="text-xl">⛔</span>
                                No Answer
                            </button>
                            <button 
                                onClick={() => { if(confirm("Stop Power Dialer?")) setIsPowerDialing(false); }}
                                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1 border border-white/10 text-white/50 hover:text-white"
                            >
                                <span className="text-xl">⏹️</span>
                                Stop
                            </button>
                        </div>

                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="p-2 text-center text-[10px] text-white/30 uppercase font-bold tracking-widest">
                        Call {powerDialIndex + 1} of {campaignResults.length}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER ---
    return (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 font-sans text-white">
            <div className="w-full max-w-7xl h-[90vh] bg-[#0a0a0c] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative ring-1 ring-white/5">
                
                {/* Global Header */}
                <div className="px-8 py-5 border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur-md flex justify-between items-center shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-purple-800 text-white flex items-center justify-center text-xl shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                            ⚡
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-white uppercase font-sans">Aura Connect</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Network Intelligence</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">✕</button>
                </div>

                {/* Main Content Split */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Sidebar / Navigation */}
                    <div className={`w-full md:w-80 bg-[#0f0f13]/90 border-r border-white/5 flex flex-col z-10 transition-all duration-300 ${view !== 'dashboard' && view !== 'detail' && 'hidden md:flex'} ${(view === 'detail') && 'hidden md:flex'}`}>
                        
                        {/* Toolbar */}
                        <div className="p-5 space-y-4 border-b border-white/5">
                            {/* Primary Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setView('add')}
                                    className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 group active:scale-95"
                                >
                                    <span className="text-pink-400 group-hover:text-white transition-colors">+</span> New Contact
                                </button>
                                <button 
                                    onClick={() => { setView('campaign'); setCampaignStep('setup'); }}
                                    className="py-3 bg-gradient-to-r from-pink-600/80 to-purple-600/80 hover:from-pink-500 hover:to-purple-500 border border-white/10 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 group active:scale-95"
                                >
                                    <span>🚀</span> Campaign
                                </button>
                            </div>
                            
                            {/* Nav Tabs */}
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => setView('dashboard')}
                                    className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${view === 'dashboard' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                                >
                                    Dashboard
                                </button>
                                <button 
                                    onClick={() => setView('history')}
                                    className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${view === 'history' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                                >
                                    History
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search network..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:border-pink-500/50 focus:bg-white/5 outline-none transition-all"
                                />
                                <svg className="w-4 h-4 text-white/30 absolute left-3 top-3 group-focus-within:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        
                        {/* Contact List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {contacts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-white/30 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl grayscale opacity-20">👥</div>
                                    <div>
                                        <p className="text-xs font-bold text-white/40 uppercase tracking-wide">Network Offline</p>
                                        <button onClick={() => importInputRef.current?.click()} className="text-[10px] text-pink-400 mt-2 hover:text-pink-300 font-bold flex items-center justify-center gap-1 mx-auto transition-colors border border-pink-500/30 px-3 py-1.5 rounded-lg hover:bg-pink-500/10">
                                            <span>📥</span> Import CSV
                                            <input type="file" ref={importInputRef} accept=".csv" onChange={handleImportCSV} className="hidden" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                filteredContacts.map(c => {
                                    const lastSeen = getLastContactDate(c.id);
                                    return (
                                        <div 
                                            key={c.id} 
                                            className={`p-3 rounded-xl border transition-all group relative cursor-pointer ${activeContact?.id === c.id ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}`}
                                            onClick={() => openContactDetail(c)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-lg ${getAvatarColor(c.name)} flex items-center justify-center text-white font-bold text-[10px] shadow-inner shrink-0 ring-1 ring-white/10`}>
                                                    {getInitials(c.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <h4 className={`font-bold text-xs truncate transition-colors ${activeContact?.id === c.id ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{c.name}</h4>
                                                        {lastSeen && <span className="text-[9px] text-white/20 whitespace-nowrap">{getRelativeTime(lastSeen)}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-white/40 font-mono truncate">{c.phone}</p>
                                                        {c.tags.length > 0 && <span className="w-1 h-1 rounded-full bg-white/20"></span>}
                                                        <p className="text-[9px] text-pink-400/70 truncate">{c.tags[0]}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Hover Arrow */}
                                                <div className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">→</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Workspace */}
                    <div className="flex-1 bg-[#0a0a0c] relative overflow-hidden flex flex-col">
                        
                        {/* VIEW: DASHBOARD */}
                        {view === 'dashboard' && (
                            <div className="flex-1 flex flex-col p-8 md:p-12 relative overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Welcome Header */}
                                <div className="mb-10">
                                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Command Center</h3>
                                    <p className="text-sm text-white/40 font-medium">Overview of your professional network and activities.</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors duration-500"></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-pink-400 font-bold mb-2">Total Contacts</div>
                                                <div className="text-4xl font-black text-white">{contacts.length}</div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-xl text-pink-400">👥</div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                                            <button onClick={() => setView('add')} className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors">
                                                <span>+</span> Add New
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-500"></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-2">Total Interactions</div>
                                                <div className="text-4xl font-black text-white">{callLogs.length}</div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-xl text-purple-400">💬</div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-white/5">
                                            <span className="text-[10px] text-white/30">Last activity: {callLogs.length > 0 ? getRelativeTime(callLogs[0].timestamp) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity Feed */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-6">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Live Feed</h4>
                                        <button onClick={() => setView('history')} className="text-[10px] text-white/30 hover:text-white transition-colors uppercase font-bold">View All</button>
                                    </div>
                                    
                                    {callLogs.length === 0 ? (
                                        <div className="border border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl grayscale opacity-30 mb-4">🕸️</div>
                                            <p className="text-sm text-white/40 font-medium">No activity recorded yet.</p>
                                            <button onClick={() => setView('add')} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all">Start Connecting</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 relative pl-4 border-l border-white/5 ml-2">
                                            {callLogs.slice(0, 5).map((log, i) => (
                                                <div key={log.id} className="relative pl-6">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0c] ${log.type === 'outgoing' ? 'bg-green-500' : log.type === 'missed' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                    
                                                    <div className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all group flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${log.type === 'outgoing' ? 'bg-green-500/10 text-green-400' : log.type === 'missed' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                {log.type === 'outgoing' ? '↗' : log.type === 'missed' ? '↙' : '↙'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">{log.contactName}</div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wide">{log.type}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                                    <span className="text-[10px] text-white/40 font-mono">{getRelativeTime(log.timestamp)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-mono text-white/50 bg-black/20 px-2 py-1 rounded border border-white/5">{log.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* VIEW: DETAIL (DOSSIER STYLE) */}
                        {view === 'detail' && activeContact && (
                            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c] animate-in slide-in-from-right-4 duration-500">
                                {/* Dossier Header */}
                                <div className="relative h-48 w-full overflow-hidden">
                                    <div className={`absolute inset-0 opacity-20 blur-3xl scale-150 ${getAvatarColor(activeContact.name)}`}></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0c]"></div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
                                        <div className="flex items-end gap-6">
                                            <div className={`w-32 h-32 rounded-2xl ${getAvatarColor(activeContact.name)} flex items-center justify-center text-5xl font-bold text-white shadow-2xl border-4 border-[#0a0a0c] ring-1 ring-white/10 relative z-10`}>
                                                {getInitials(activeContact.name)}
                                            </div>
                                            <div className="pb-2">
                                                <h1 className="text-4xl font-black text-white tracking-tight mb-2">{activeContact.name}</h1>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeContact.tags.map((tag, i) => (
                                                        <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/70 border border-white/10 backdrop-blur-md">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 pb-2">
                                            <button onClick={() => makeCall(activeContact)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95" title="Call">
                                                📞
                                            </button>
                                            <button onClick={() => sendWhatsApp(activeContact.phone, "")} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95" title="Message">
                                                💬
                                            </button>
                                            {activeContact.email && (
                                                <button onClick={() => sendEmail(activeContact.email!, "")} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95" title="Email">
                                                    ✉️
                                                </button>
                                            )}
                                            <div className="w-px h-10 bg-white/10 mx-2"></div>
                                            <button onClick={(e) => handleDeleteContact(activeContact.id, e)} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 hover:scale-105 active:scale-95" title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => setView('dashboard')} className="absolute top-6 left-6 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10 transition-all flex items-center gap-2">
                                        <span>←</span> Back
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        
                                        {/* Left Column: Info & Context */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Contact Details Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 flex items-center gap-2">
                                                        <span>📱</span> Mobile
                                                    </p>
                                                    <p className="text-lg font-mono text-white tracking-wide">{activeContact.phone}</p>
                                                </div>
                                                {activeContact.email && (
                                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => sendEmail(activeContact.email!, "")}>
                                                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 flex items-center gap-2">
                                                            <span>📧</span> Email
                                                        </p>
                                                        <p className="text-lg font-mono text-white truncate">{activeContact.email}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Intelligence Context */}
                                            <div className="p-6 bg-gradient-to-br from-[#15151a] to-black border border-white/10 rounded-3xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <span className="text-8xl">🧠</span>
                                                </div>
                                                <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <span>📝</span> Intelligence Context
                                                </h4>
                                                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-medium">
                                                    {activeContact.notes ? (
                                                        activeContact.notes
                                                    ) : (
                                                        <span className="text-white/30 italic">No context data available. Add notes to help AI generate better messages.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: History */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 h-fit">
                                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Interaction Log</h4>
                                            
                                            <div className="space-y-4">
                                                {callLogs.filter(l => l.contactId === activeContact.id).length === 0 ? (
                                                    <div className="text-center py-8 text-white/20 text-xs italic">
                                                        No history recorded.
                                                    </div>
                                                ) : (
                                                    callLogs.filter(l => l.contactId === activeContact.id).sort((a,b) => b.timestamp - a.timestamp).map(log => (
                                                        <div key={log.id} className="relative pl-4 border-l border-white/10 pb-4 last:pb-0">
                                                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${log.type === 'outgoing' ? 'bg-green-500' : 'bg-white/20'}`}></div>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-xs font-bold text-white uppercase">{log.type}</p>
                                                                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                                </div>
                                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/50">{log.duration}</span>
                                                            </div>
                                                            {log.notes && <p className="text-[11px] text-white/60 mt-2 bg-black/20 p-2 rounded border border-white/5 italic">"{log.notes}"</p>}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW: ADD CONTACT */}
                        {view === 'add' && (
                            <div className="flex-1 overflow-y-auto p-12 flex items-center justify-center animate-in zoom-in-95 duration-300">
                                <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative">
                                    <button onClick={() => setView('dashboard')} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">✕</button>
                                    
                                    <div className="mb-8 text-center">
                                        <div className="w-16 h-16 bg-pink-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg shadow-pink-600/30">+</div>
                                        <h3 className="text-2xl font-bold text-white">New Connection</h3>
                                        <p className="text-white/40 text-xs mt-1">Add details to expand your network.</p>
                                    </div>

                                    <form onSubmit={handleAddContact} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Full Name</label>
                                                <input required type="text" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none text-white text-sm transition-all focus:bg-black/60" placeholder="e.g. Elon Musk" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Phone</label>
                                                <input required type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none text-white text-sm transition-all focus:bg-black/60" placeholder="+1..." />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Email</label>
                                            <input type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none text-white text-sm transition-all focus:bg-black/60" placeholder="optional@email.com" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Tags</label>
                                            <input type="text" value={newContact.tags} onChange={e => setNewContact({...newContact, tags: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none text-white text-sm transition-all focus:bg-black/60" placeholder="Tech, Investor, VIP" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">Context</label>
                                            <textarea value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 h-24 focus:border-pink-500 outline-none text-white text-sm transition-all focus:bg-black/60 resize-none" placeholder="Context helps AI write better messages..." />
                                        </div>
                                        
                                        <button type="submit" className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg transition-all transform hover:scale-[1.02]">Create Profile</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* VIEW: CAMPAIGN SETUP */}
                        {view === 'campaign' && campaignStep === 'setup' && (
                            <div className="flex-1 flex flex-col p-10 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-500">
                                <div className="max-w-2xl mx-auto w-full">
                                    <div className="mb-10 text-center">
                                        <h3 className="text-3xl font-black text-white tracking-tight">Campaign Launcher</h3>
                                        <p className="text-sm text-white/40 font-medium mt-2">Automate your outreach with AI-generated personalized content.</p>
                                    </div>
                                    
                                    <div className="space-y-8 relative">
                                        {/* Connecting Line */}
                                        <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-white/10 -z-10"></div>

                                        {/* Step 1 */}
                                        <div className="flex gap-6">
                                            <div className="w-12 h-12 rounded-full bg-[#0a0a0c] border-2 border-pink-500 flex items-center justify-center text-pink-500 font-bold text-lg shrink-0 z-10 shadow-[0_0_15px_rgba(236,72,153,0.3)]">1</div>
                                            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Select Channel</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {['message', 'call', 'email'].map(mode => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => setCampaignMode(mode as any)}
                                                            className={`py-4 rounded-xl text-xs font-bold capitalize transition-all border flex flex-col items-center gap-2 ${campaignMode === mode ? 'bg-pink-600 border-pink-500 text-white shadow-lg' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/5 hover:text-white'}`}
                                                        >
                                                            <span className="text-xl">{mode === 'message' ? '💬' : mode === 'call' ? '📞' : '✉️'}</span>
                                                            {mode === 'message' ? 'WhatsApp' : mode === 'call' ? 'Phone Script' : 'Email'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="flex gap-6">
                                            <div className="w-12 h-12 rounded-full bg-[#0a0a0c] border-2 border-purple-500 flex items-center justify-center text-purple-500 font-bold text-lg shrink-0 z-10 shadow-[0_0_15px_rgba(168,85,247,0.3)]">2</div>
                                            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Select Targets ({selectedContacts.length})</h4>
                                                    <button onClick={selectAllContacts} className="text-[10px] text-purple-400 font-bold hover:text-white transition-colors uppercase tracking-wider">
                                                        {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto bg-black/30 border border-white/10 rounded-xl p-2 space-y-1 custom-scrollbar">
                                                    {contacts.map(c => (
                                                        <div 
                                                            key={c.id} 
                                                            onClick={() => toggleSelectContact(c.id)}
                                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedContacts.includes(c.id) ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedContacts.includes(c.id) ? 'bg-purple-500 border-purple-500' : 'border-white/30'}`}>
                                                                {selectedContacts.includes(c.id) && <span className="text-[8px]">✓</span>}
                                                            </div>
                                                            <span className="text-xs text-white font-medium">{c.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="flex gap-6">
                                            <div className="w-12 h-12 rounded-full bg-[#0a0a0c] border-2 border-blue-500 flex items-center justify-center text-blue-500 font-bold text-lg shrink-0 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">3</div>
                                            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Campaign Goal</h4>
                                                <textarea 
                                                    value={taskInput}
                                                    onChange={(e) => setTaskInput(e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none h-28 resize-none transition-all placeholder-white/20"
                                                    placeholder="E.g., Invite them to the product launch next Friday. Tone should be exclusive and professional."
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleRunCampaign}
                                            disabled={isProcessing || !taskInput || selectedContacts.length === 0}
                                            className="w-full py-5 ml-18 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-2xl text-white font-bold text-sm shadow-xl shadow-purple-900/40 disabled:opacity-50 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span className="tracking-widest uppercase">Initializing Agents...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-lg">✨</span> 
                                                    <span className="tracking-widest uppercase">Generate & Review</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW: CAMPAIGN REVIEW */}
                        {view === 'campaign' && campaignStep === 'review' && (
                            <div className="flex-1 flex flex-col h-full bg-[#050505] animate-in fade-in duration-500">
                                <div className="p-6 border-b border-white/10 bg-[#0a0a0c] flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-900/20 border border-green-500/30 flex items-center justify-center text-green-400 text-2xl animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                                            📡
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white tracking-widest uppercase">Mission Control</h3>
                                            <p className="text-xs text-white/40 font-mono mt-1">Ready for execution • {campaignResults.filter(r => r.status === 'completed').length}/{campaignResults.length} Completed</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => { setCampaignStep('setup'); setCampaignResults([]); }}
                                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
                                        >
                                            Abort
                                        </button>
                                        <button 
                                            onClick={runAutoPilot}
                                            className="px-8 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-xs shadow-lg shadow-green-900/30 flex items-center gap-2 animate-pulse hover:animate-none transition-all hover:scale-105 active:scale-95"
                                        >
                                            <span>⚡</span> AUTO-PILOT
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/5 via-[#050505] to-[#050505]">
                                    {campaignResults.map((result, idx) => {
                                        const contact = contacts.find(c => c.id === result.contactId);
                                        return (
                                            <div key={idx} className={`p-5 rounded-2xl border transition-all ${result.status === 'completed' ? 'bg-green-900/10 border-green-500/30 opacity-60' : 'bg-[#0f0f13] border-white/10 hover:border-white/20 hover:bg-[#15151a]'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${result.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></div>
                                                        <span className="font-bold text-sm text-white uppercase tracking-wide">{contact?.name}</span>
                                                        <span className="text-[10px] text-white/30 font-mono border border-white/10 px-2 py-0.5 rounded bg-black/40">{campaignMode === 'email' ? contact?.email : contact?.phone}</span>
                                                    </div>
                                                    {result.status === 'completed' && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-500/20">Transmitted</span>}
                                                </div>
                                                <div className="bg-black/50 p-4 rounded-xl mb-4 font-mono text-xs text-white/80 border border-white/5 relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                                                    <p className="whitespace-pre-wrap pl-3 leading-relaxed">{result.content}</p>
                                                </div>
                                                {result.status === 'pending' && (
                                                    <button 
                                                        onClick={() => executeCampaignAction(idx)}
                                                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
                                                    >
                                                        {campaignMode === 'message' ? '💬 Send WhatsApp' : campaignMode === 'email' ? '✉️ Send Email' : '📞 Dial Now'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* VIEW: HISTORY */}
                        {view === 'history' && (
                            <div className="flex-1 flex flex-col p-8 animate-fade-in-up">
                                <div className="mb-8 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-3xl font-bold text-white">Call Logs</h3>
                                        <p className="text-white/40 text-xs mt-1">Full communication audit trail.</p>
                                    </div>
                                    <div className="flex bg-white/5 rounded-lg p-1">
                                        {['all', 'incoming', 'outgoing', 'missed'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setHistoryFilter(f as any)}
                                                className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${historyFilter === f ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {filteredLogs.length === 0 ? (
                                        <div className="text-center py-20 text-white/20">
                                            <div className="text-4xl mb-4 grayscale opacity-20">📜</div>
                                            <p className="text-sm">No records found.</p>
                                        </div>
                                    ) : (
                                        filteredLogs.sort((a,b) => b.timestamp - a.timestamp).map(log => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg shadow-inner ${log.type === 'outgoing' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : log.type === 'missed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                        {log.type === 'outgoing' ? '↗' : log.type === 'missed' ? '↙' : '↙'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors">{log.contactName}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${log.type === 'outgoing' ? 'text-green-500/50' : log.type === 'missed' ? 'text-red-500/50' : 'text-blue-500/50'}`}>{log.type}</span>
                                                            <span className="text-[10px] text-white/40 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <span className="text-[10px] font-mono text-white/60 bg-black/20 px-2 py-1 rounded border border-white/5">{log.duration}</span>
                                                    {log.notes && <span className="text-[9px] text-white/30 italic max-w-[150px] truncate">{log.notes}</span>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};
