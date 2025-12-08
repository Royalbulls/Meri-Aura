
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

export const memoryService = {
    // 1. Save a new memory (User text -> Vector -> DB)
    addMemory: async (text: string): Promise<void> => {
        // Lower threshold to capture short emotional bursts like "I am sad"
        if (text.length < 4) return; 

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

                    // Filter: Lowered threshold to 0.55 to be more inclusive of loose associations
                    const relevant = scored.filter(s => s.score > 0.55).slice(0, 4); // Increased to top 4

                    if (relevant.length > 0) {
                        console.log("🧠 Memories Found:", relevant.map(r => `${r.text} (${r.score.toFixed(2)})`));
                        // Combine them into a context string
                        resolve(relevant.map(r => r.text).join(" | "));
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
