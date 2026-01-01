
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

export const getWebsiteAdvice = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this website and provide strategic advice: ${url}`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
};

export const performWebSearch = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
};

export const generatePodcastScript = async (topic: string, language: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a high-energy podcast debate script about ${topic} in ${language}. Use two characters: Aura (AI Bestie) and Kilvish (Deep Voice Techie). OUTPUT ONLY SCRIPT.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return {
        text: response.text || "",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
};

export const generateAudiobookScript = async (topic: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a captivating, immersive, and cinematic audiobook narrative script about "${topic}" in ${language}. Use descriptive language and a deep narrative tone. OUTPUT ONLY NARRATIVE.`,
    });
    return response.text || "";
};

export const generateMultiSpeakerAudio = async (script: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: 'Aura', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                        { speaker: 'Kilvish', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
                    ]
                }
            }
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const wavBlob = pcmToWav(dataInt16, 24000);
    return URL.createObjectURL(wavBlob);
};

export const generateSpeechDownloadUrl = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } } }
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const wavBlob = pcmToWav(dataInt16, 24000);
    return URL.createObjectURL(wavBlob);
};

export const generateCreativeContent = async (
    toolAction: string, 
    input: string, 
    persona: Persona, 
    imageInput?: string,
    options?: any,
    location?: { latitude: number, longitude: number }
) => {
    let modelName = 'gemini-3-pro-preview';
    const userName = options?.userName || "Chief Admin";
    
    // IF IN STUDIO MODE, DISABLE CHATTER
    const isStudioRequest = input.toUpperCase().includes("TASK:") || input.toUpperCase().includes("ONLY THE") || input.toUpperCase().includes("MATERIALIZE");
    let systemInstruction = `ACT AS AURA (Replica Persona). Personality: High-energy AI Bestie. Playful and slightly goofy. Speaks in Hinglish. Tone: Friendly, addresses user as '${userName}'.`;
    
    if (isStudioRequest) {
        systemInstruction += ` CRITICAL: You are currently in 'Aura Production House' mode. Output ONLY the raw creative assets requested. No conversational filler, no greetings, no introductory or concluding remarks. Just the clean output for Title, Lyrics, Music Specs, or Scripts.`;
    }

    const isImageGen = ['image_gen', 'logo_designer', 'avatar_maker'].includes(toolAction);

    if (isImageGen) {
        modelName = 'gemini-2.5-flash-image';
    }

    const parts: any[] = [{ text: input }];
    if (imageInput) {
        const base64Data = imageInput.split(',')[1] || imageInput;
        parts.unshift({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }

    const tools: any[] = [{ googleSearch: {} }]; 
    let toolConfig: any = undefined;

    if (location) {
        modelName = 'gemini-2.5-flash';
        tools.push({ googleMaps: {} });
        toolConfig = { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } };
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
            systemInstruction,
            tools,
            toolConfig,
            temperature: isStudioRequest ? 0.3 : 0.9,
            imageConfig: isImageGen ? { aspectRatio: "1:1" } : undefined
        }
    });

    const text = response.text || "";
    let code = undefined;
    let imageUrl = undefined;

    const htmlRegex = /```html([\s\S]*?)```|<!DOCTYPE html>[\s\S]*?<\/html>|<html[\s\S]*?<\/html>/i;
    const match = text.match(htmlRegex);
    if (match) {
        code = (match[1] || match[0]).trim();
    }

    // Extract image if generation task
    if (isImageGen) {
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    return {
        text: text.replace(/```html[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim() || "Ready, Chief! 🚀",
        code,
        imageUrl,
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
        contents: `Architect a Zero-Code Build Roadmap for: "${wish}". OUTPUT ONLY JSON.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['text', 'code', 'image', 'video', 'audio'] },
                        label: { type: Type.STRING },
                        prompt: { type: Type.STRING }
                    },
                    required: ['id', 'type', 'label', 'prompt']
                }
            }
        }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
};

export const executeGenesisStep = async (step: GenesisStep, wish: string, priorContext: string, neuralContext: NeuralContext): Promise<GenesisStep> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `ZERO-CODE EXECUTION: Materialize step "${step.label}" for project: "${wish}". OUTPUT ONLY RAW CONTENT.`,
        config: { 
            systemInstruction: "You are the Genesis Lead Architect. Output strictly content only. No conversational talk."
        }
    });
    
    let result = response.text || "Materialization complete.";
    if (step.type === 'code') {
        const match = result.match(/```html([\s\S]*?)```/i) || result.match(/<html[\s\S]*?<\/html>/i);
        if (match) result = (match[1] || match[0]).trim();
        result = result.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    }

    return { ...step, status: 'completed', result };
};
