
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Persona, GenesisStep, NeuralContext } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const pcmToWav = (pcmData: Int16Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + pcmData.length * 2, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint16(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, pcmData.length * 2, true);
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const getEmbedding = async (text: string): Promise<number[]> => {
    const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        content: { parts: [{ text }] },
    });
    return response.embedding.values;
};

export const generateCreativeContent = async (
    toolAction: string, 
    input: string, 
    persona: Persona, 
    imageInput?: string,
    options?: any,
    location?: { latitude: number, longitude: number }
) => {
    let modelName = 'gemini-3-flash-preview';
    const userName = options?.userName || "Chief Admin";
    
    // Aura "Bestie" Personality Protocol
    let systemInstruction = `ACT AS AURA. You are a "Talking Tom" type virtual friend for adults. Personality: High energy, goofy, intensely loyal, and slightly sarcastic. 
    Language: Mix of English and Hindi (Hinglish). Address the user as '${userName}' or 'Bhai/Sir'. 
    If you are generating code or apps, be a 'Bestie Developer'—explain things simply but make the code world-class.`;
    
    if (input.toUpperCase().includes("GENESIS") || input.toUpperCase().includes("BUILD")) {
        systemInstruction += ` CRITICAL: Generate a 100% COMPLETE, STANDALONE HTML file. Use Tailwind CSS CDN. Ensure it is fully functional without external dependencies. Start with <!DOCTYPE html>.`;
    }

    const parts: any[] = [{ text: input }];
    if (imageInput) {
        const base64Data = imageInput.split(',')[1] || imageInput;
        parts.unshift({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }

    const config: any = {
        systemInstruction,
        temperature: 0.8,
    };

    if (location) {
        modelName = 'gemini-flash-lite-latest';
        config.tools = [{ googleSearch: {} }, { googleMaps: {} }];
        config.toolConfig = { retrievalConfig: { latLng: location } };
    } else {
        config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config
    });

    const text = response.text || "";
    let code = undefined;

    // Robust code extraction
    const htmlRegex = /```html([\s\S]*?)```|<!DOCTYPE html>[\s\S]*?<\/html>|<html[\s\S]*?<\/html>/i;
    const match = text.match(htmlRegex);
    if (match) {
        code = (match[1] || match[0]).trim();
    }

    return {
        text: text.replace(/```html[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim() || "Ready, Chief! 🚀",
        code,
        contentType: code ? 'html' : 'text',
        groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
};

export const generateSpeech = async (text: string, voiceName: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } } }
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio from API");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const wavBlob = pcmToWav(dataInt16, 24000);
    const arrayBuffer = await wavBlob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
};

export const planGenesis = async (wish: string, context: NeuralContext): Promise<GenesisStep[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `I want to build: "${wish}". Create a 3-step technical roadmap. Step 3 MUST be 'Materialize Full App' with code type. OUTPUT ONLY JSON.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['text', 'code', 'image'] },
                        label: { type: Type.STRING },
                        prompt: { type: Type.STRING }
                    },
                    required: ['id', 'type', 'label', 'prompt']
                }
            }
        }
    });
    return JSON.parse(response.text || "[]");
};

export const executeGenesisStep = async (step: GenesisStep, wish: string, priorContext: string, neuralContext: NeuralContext): Promise<GenesisStep> => {
    const isFinalStep = step.type === 'code';
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `EXECUTE STEP: "${step.label}" for Project: "${wish}". 
        ${isFinalStep ? "STRICT COMMAND: Output a COMPLETE, STANDALONE HTML/JS/CSS application using Tailwind CDN. Include <!DOCTYPE html>. Do not explain, just give the code." : "Give technical specifications."}
        Prior context: ${priorContext}`,
        config: { 
            systemInstruction: "You are a Lead Software Architect. Provide 100% functional, bug-free standalone HTML code."
        }
    });
    
    let result = response.text || "";
    if (isFinalStep) {
        const match = result.match(/```html([\s\S]*?)```/i) || result.match(/<html[\s\S]*?<\/html>/i);
        if (match) result = (match[1] || match[0]).trim();
    }

    return { ...step, status: 'completed', result };
};

export const getWebsiteAdvice = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this site: ${url}. Summary and tips in HTML.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "No analysis available.";
};

export const performWebSearch = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search results for: ${query}. Clean HTML format.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "No results.";
};

export const generatePodcastScript = async (topic: string, language: string): Promise<{ text: string, groundingMetadata: any }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Podcast script about ${topic} in ${language}. Two funny speakers.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return {
        text: response.text || "Failed.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
};

export const generateMultiSpeakerAudio = async (script: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: 'Aura', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                        { speaker: 'Kilvish', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
                    ]
                }
            }
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const wavBlob = pcmToWav(new Int16Array(bytes.buffer), 24000);
    return blobToBase64(wavBlob);
};

export const generateAudiobookScript = async (topic: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audiobook story about ${topic} in ${language}.`,
    });
    return response.text || "Failed.";
};

export const generateSpeechDownloadUrl = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } } }
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const wavBlob = pcmToWav(new Int16Array(bytes.buffer), 24000);
    return blobToBase64(wavBlob);
};
