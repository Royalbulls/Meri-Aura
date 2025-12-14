
import { getEmbedding } from "./geminiService";
import { MemoryVector } from "../types";

const DB_NAME = 'aura_memory_db';
const STORE_NAME = 'vectors';

// Initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Math: Cosine Similarity between two vectors
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Helper: Get relative time string
const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return "A while back";
};

export const memoryService = {
    // 1. Save a new memory (User text -> Vector -> DB)
    addMemory: async (text: string): Promise<void> => {
        // SAVING TOKENS: Only memorize meaningful messages > 15 chars
        if (text.length < 15) return; 

        try {
            const vector = await getEmbedding(text);
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const memory: MemoryVector = {
                id: Date.now().toString(),
                text: text,
                vector: vector,
                timestamp: Date.now()
            };

            store.add(memory);
            console.log("🧠 Memory Saved:", text);
        } catch (e) {
            console.error("Failed to save memory", e);
        }
    },

    // 2. Search for relevant memories based on current query
    searchMemories: async (queryText: string): Promise<string | null> => {
        // Optimization: Don't search memory for very short queries
        if (queryText.length < 5) return null;

        try {
            const queryVector = await getEmbedding(queryText);
            const db = await openDB();
            
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => {
                    const allMemories = request.result as MemoryVector[];
                    if (!allMemories || allMemories.length === 0) {
                        resolve(null);
                        return;
                    }

                    // Score all memories
                    const scored = allMemories.map(mem => ({
                        text: mem.text,
                        score: cosineSimilarity(queryVector, mem.vector),
                        timestamp: mem.timestamp
                    }));

                    // Sort by relevance (highest score first)
                    scored.sort((a, b) => b.score - a.score);

                    // Filter: Threshold 0.6 for decent relevance
                    // Take top 4 to provide richer context
                    const relevant = scored.filter(s => s.score > 0.60).slice(0, 4);

                    if (relevant.length > 0) {
                        console.log("🧠 Memories Found:", relevant.map(r => `${r.text} (${r.score.toFixed(2)})`));
                        
                        // Format specifically for the LLM to understand timeline
                        const formattedMemories = relevant.map(r => 
                            `[${getRelativeTime(r.timestamp)} the user said]: "${r.text}"`
                        ).join("\n");
                        
                        resolve(formattedMemories);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("Memory search failed", e);
            return null;
        }
    }
};
