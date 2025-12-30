
import { getEmbedding } from "./geminiService";
import { MemoryVector } from "../types";

const DB_NAME = 'aura_memory_db';
const STORE_NAME = 'vectors';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error("IndexedDB blocked or unavailable"));
        } catch (e) {
            reject(e);
        }
    });
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
};

const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

export const memoryService = {
    addMemory: async (text: string, importance: number = 1): Promise<void> => {
        if (!text || text.length < 5) return; 
        try {
            const vector = await getEmbedding(text);
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const memory: any = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                text,
                vector,
                timestamp: Date.now(),
                importance
            };
            store.add(memory);
        } catch (e) { 
            console.warn("Memory system bypassed: ", e); 
        }
    },

    searchMemories: async (queryText: string): Promise<{context: string, count: number} | null> => {
        if (!queryText || queryText.length < 3) return null;
        try {
            const queryVector = await getEmbedding(queryText);
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.getAll();
                request.onsuccess = () => {
                    const all = request.result as any[];
                    if (!all || !all.length) return resolve(null);

                    const scored = all.map(mem => {
                        const sim = cosineSimilarity(queryVector, mem.vector);
                        const weightedScore = sim * (mem.importance || 1);
                        return { ...mem, weightedScore };
                    });

                    scored.sort((a, b) => b.weightedScore - a.weightedScore);
                    const relevant = scored.filter(s => s.weightedScore > 0.7).slice(0, 3);

                    if (relevant.length > 0) {
                        const context = relevant.map(r => 
                            `[Memory from ${getRelativeTime(r.timestamp)}]: "${r.text}"`
                        ).join("\n");
                        resolve({ context, count: relevant.length });
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => resolve(null);
            });
        } catch (e) { 
            return null; 
        }
    },

    clearMemory: async () => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
        } catch (e) {}
    }
};
