
import React, { useState, useEffect } from 'react';
import { generateCreativeContent } from '../services/geminiService';
import { DEFAULT_PERSONAS } from '../constants';

interface KidsModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    dreamCoins: number;
    onUpdateCoins: (coins: number) => void;
}

export const KidsModeModal: React.FC<KidsModeModalProps> = ({ isOpen, onClose, dreamCoins, onUpdateCoins }) => {
    const [activeTab, setActiveTab] = useState<'adventure' | 'brain' | 'shop'>('adventure');
    const [sparkyText, setSparkyText] = useState("Hi! I'm Sparky! Ready to play?");
    const [userInput, setUserInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<string[]>([]);
    const [quizActive, setQuizActive] = useState(false);

    // Sparky Persona (Hardcoded for safety in this mode)
    const sparky = DEFAULT_PERSONAS.find(p => p.id === 'sparky') || DEFAULT_PERSONAS[0];

    useEffect(() => {
        const savedInv = localStorage.getItem('dream_inventory');
        if (savedInv) setInventory(JSON.parse(savedInv));
    }, []);

    const saveInventory = (newInv: string[]) => {
        setInventory(newInv);
        localStorage.setItem('dream_inventory', JSON.stringify(newInv));
    };

    if (!isOpen) return null;

    const handleStory = async () => {
        if (!userInput.trim()) return;
        setIsLoading(true);
        try {
            const result = await generateCreativeContent('kids_mode', userInput, sparky, undefined, { mode: 'story' });
            setSparkyText(result.text);
            onUpdateCoins(dreamCoins + 10); // Reward
        } catch (e) {
            setSparkyText("Oops! My antenna got twisted. Try again!");
        } finally {
            setIsLoading(false);
            setUserInput("");
        }
    };

    const handleQuizStart = async () => {
        setIsLoading(true);
        try {
            const result = await generateCreativeContent('kids_mode', 'Give me a question', sparky, undefined, { mode: 'quiz' });
            setSparkyText(result.text);
            setQuizActive(true);
        } catch (e) {
            setSparkyText("Brain freeze! 🥶");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuizAnswer = async () => {
        if (!userInput.trim()) return;
        setIsLoading(true);
        try {
            const result = await generateCreativeContent('kids_mode', userInput, sparky, undefined, { mode: 'validate_quiz' });
            setSparkyText(result.text);
            
            // Simple heuristic check for positive reinforcement to award coins
            if (result.text.includes("🎉") || result.text.toLowerCase().includes("correct")) {
                onUpdateCoins(dreamCoins + 20);
            }
            setQuizActive(false);
        } catch (e) {
            setSparkyText("I didn't catch that. Say again?");
        } finally {
            setIsLoading(false);
            setUserInput("");
        }
    };

    const buyItem = (item: string, price: number) => {
        if (dreamCoins >= price) {
            onUpdateCoins(dreamCoins - price);
            saveInventory([...inventory, item]);
            setSparkyText(`Yay! You bought a ${item}! It's in your backpack! 🎒`);
        } else {
            setSparkyText("Oh no! Not enough Dream Coins! Do some Quizzes! 🪙");
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-yellow-400 font-sans flex flex-col items-center justify-center p-4">
            {/* Main Game Container */}
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative border-8 border-orange-500">
                
                {/* Header */}
                <div className="bg-orange-500 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all">
                            🔙 Exit
                        </button>
                        <h1 className="text-2xl font-black uppercase tracking-wider">Dreamer World</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full">
                        <span className="text-2xl">🪙</span>
                        <span className="text-xl font-black">{dreamCoins}</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* Left: Sparky Interaction */}
                    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-blue-50 relative overflow-hidden">
                        {/* Decorative background blobs */}
                        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute top-10 right-10 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

                        {/* Sparky Bubble */}
                        <div className="bg-white p-6 rounded-[30px] shadow-xl border-4 border-blue-200 mb-6 max-w-md w-full relative z-10">
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center text-4xl shadow-lg">
                                🤖
                            </div>
                            <p className="text-center text-lg md:text-xl font-bold text-gray-700 mt-6 leading-relaxed">
                                {sparkyText}
                            </p>
                        </div>

                        {/* Interaction Input */}
                        {activeTab !== 'shop' && (
                            <div className="w-full max-w-md z-10">
                                {activeTab === 'adventure' && (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder="Tell me a story about..."
                                            className="flex-1 p-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg font-bold text-gray-700 placeholder-gray-300 shadow-sm"
                                        />
                                        <button 
                                            onClick={handleStory} 
                                            disabled={isLoading}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? '...' : 'Go!'}
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'brain' && (
                                    <div className="flex flex-col gap-4 items-center">
                                        {!quizActive ? (
                                            <button 
                                                onClick={handleQuizStart} 
                                                disabled={isLoading}
                                                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(107,33,168)] hover:shadow-[0_4px_0_rgb(107,33,168)] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
                                            >
                                                {isLoading ? 'Loading...' : '🧠 New Challenge!'}
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 w-full">
                                                <input 
                                                    type="text" 
                                                    value={userInput}
                                                    onChange={(e) => setUserInput(e.target.value)}
                                                    placeholder="Type your answer..."
                                                    className="flex-1 p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-500 outline-none text-lg font-bold text-gray-700"
                                                />
                                                <button 
                                                    onClick={handleQuizAnswer} 
                                                    disabled={isLoading}
                                                    className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-2xl font-bold shadow-lg disabled:opacity-50"
                                                >
                                                    Check
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Menu / Shop */}
                    <div className="w-full md:w-80 bg-gray-50 border-l border-gray-100 flex flex-col">
                        <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-200">
                            <button 
                                onClick={() => setActiveTab('adventure')}
                                className={`p-2 rounded-xl text-xs font-black uppercase tracking-wide flex flex-col items-center gap-1 transition-all ${activeTab === 'adventure' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">🚀</span> Story
                            </button>
                            <button 
                                onClick={() => setActiveTab('brain')}
                                className={`p-2 rounded-xl text-xs font-black uppercase tracking-wide flex flex-col items-center gap-1 transition-all ${activeTab === 'brain' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">🧠</span> Quiz
                            </button>
                            <button 
                                onClick={() => setActiveTab('shop')}
                                className={`p-2 rounded-xl text-xs font-black uppercase tracking-wide flex flex-col items-center gap-1 transition-all ${activeTab === 'shop' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">🛍️</span> Shop
                            </button>
                        </div>

                        {/* Inventory / Shop Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'shop' ? (
                                <div className="space-y-4">
                                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest text-center">Dream Shop</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { name: 'Candy', icon: '🍬', price: 10 },
                                            { name: 'Ball', icon: '⚽', price: 20 },
                                            { name: 'Plant', icon: '🌵', price: 30 },
                                            { name: 'Rocket', icon: '🚀', price: 50 },
                                            { name: 'Crown', icon: '👑', price: 100 },
                                            { name: 'Robot', icon: '🤖', price: 150 },
                                        ].map(item => (
                                            <button 
                                                key={item.name}
                                                onClick={() => buyItem(item.name, item.price)}
                                                className="bg-white p-3 rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:shadow-lg transition-all flex flex-col items-center"
                                            >
                                                <span className="text-3xl mb-1">{item.icon}</span>
                                                <span className="font-bold text-gray-700 text-sm">{item.name}</span>
                                                <span className="text-xs font-bold text-green-500 bg-green-100 px-2 py-0.5 rounded-full mt-1">
                                                    {item.price} 🪙
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest text-center">My Backpack</h3>
                                    {inventory.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <span className="text-4xl">🎒</span>
                                            <p className="text-sm font-bold mt-2">Empty!</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {inventory.map((item, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-2xl" title={item}>
                                                    {/* Mapping icons roughly or just first letter */}
                                                    {item.includes('Candy') ? '🍬' : 
                                                     item.includes('Ball') ? '⚽' : 
                                                     item.includes('Plant') ? '🌵' :
                                                     item.includes('Rocket') ? '🚀' :
                                                     item.includes('Crown') ? '👑' :
                                                     item.includes('Robot') ? '🤖' : '📦'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
};
