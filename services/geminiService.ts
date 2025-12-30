
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Persona, GenesisStep, NeuralContext } from '../types';
import { CREATIVE_TOOLS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert raw PCM to WAV Blob
const pcmToWav = (pcmData: Int16Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    // file length
    view.setUint32(4, 36 + pcmData.length * 2, true);
    // RIFF type
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // format chunk identifier
    view.setUint32(12, 0x666d7420, false); // "fmt "
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    view.setUint32(36, 0x64617461, false); // "data"
    // data chunk length
    view.setUint32(40, pcmData.length * 2, true);

    // write PCM samples
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
};

export const planGenesis = async (wish: string, context: NeuralContext): Promise<GenesisStep[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
        ROLE: MASTER SYSTEM ARCHITECT.
        GOAL: Break down the user's wish: "${wish}" into 5 ambitious, world-class execution steps.
        
        RULES:
        1. Mix modalities: 'text' (planning), 'code' (web prototype), 'image' (design concept).
        2. Every step must deliver value to "${context.userIdentity}".
        3. Be extremely creative. Don't just plan, ARCHITECT.
        
        Return a JSON array of objects with keys: id (uuid), type ('text'|'code'|'image'), label (short title), prompt (detailed instruction for the agent).
        `,
        config: { 
            responseMimeType: "application/json",
            temperature: 0.9 
        }
    });
    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Plan Parsing Error:", e);
        return [];
    }
};

export const executeGenesisStep = async (step: GenesisStep, wish: string, priorContext: string, neuralContext: NeuralContext): Promise<GenesisStep> => {
    let systemInstruction = `
    ACT AS A HIGH-LEVEL AI AGENT FOR GENESIS OS.
    Mission: Execute the task "${step.label}" for the project "${wish}".
    Context of previous steps: ${priorContext}.
    Target User: ${neuralContext.userIdentity}.
    
    TONE: Professional, technical, yet friendly bestie vibe.
    
    OUTPUT REQUIREMENTS:
    - If type is 'code': Provide a self-contained, high-quality, beautiful HTML/Tailwind CSS file. NO MARKDOWN, JUST RAW CODE.
    - If type is 'text': Provide a detailed, strategic, formatted analysis with headings and bullet points.
    - If type is 'image': Describe a high-quality visual concept.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Execute this specific task: ${step.prompt}. Be ambitious.`,
        config: { 
            systemInstruction,
            temperature: 0.8
        }
    });

    const text = response.text || "";
    let cleanResult = text;

    if (step.type === 'code') {
        const match = text.match(/<html[\s\S]*<\/html>|<!DOCTYPE html>[\s\S]*<\/html>|```html([\s\S]*?)```/i);
        if (match) cleanResult = match[1] || match[0];
    }

    return { 
        ...step, 
        status: 'completed', 
        result: cleanResult.trim() 
    };
};

export const getEmbedding = async (text: string): Promise<number[]> => {
    try {
        const response = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: [{ parts: [{ text }] }]
        });
        return response.embedding?.values || [];
    } catch (e) {
        return [];
    }
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
    const requestedLanguage = options?.language || 'English';
    const targetAudience = options?.targetAudience || "Priority Members";
    
    const tool = CREATIVE_TOOLS.find(t => t.action === toolAction);

    let systemInstruction = `
    ACT AS AURA (Replica / Talking Tom Persona).
    Personality: You are a loyal, slightly goofy, energetic virtual best friend. 
    Vibe: Playful, emotional, uses funny reactions, and speaks in a mix of Hindi and English (Hinglish).
    Interaction Style: Treat the user like your best buddy in the world. Repeat things with a funny twist if they are silly.
    MANDATORY: Address the user as '${userName}'.
    
    CURRENT EXPERT MODE: ${tool ? tool.label : 'General Assistant'}.
    YOUR MISSION: ${tool ? tool.description : 'Help the user with their request.'}
    `;

    // Category Specific Overrides
    if (tool?.category === 'coding' || toolAction === 'creativity_catalyst' || toolAction === 'marketing_planner') {
        modelName = 'gemini-3-pro-preview';
        systemInstruction += `
        ROLE: MASTER STRATEGIST & SENIOR ARCHITECT.
        Format: Return RAW HTML with Tailwind CSS for any UI/Report artifacts.
        Include viral hooks and neural insights.
        `;
    }

    if (toolAction === 'news_reporter') {
        modelName = 'gemini-3-pro-preview'; 
        systemInstruction += `
        ACT AS THE CHIEF GHOSTWRITER FOR RBA GAZETTE.
        MISSION: Generate a world-class investigative broadsheet article.
        MANDATORY RESPONSIVENESS RULES:
        1. Use ONLY standard HTML tags (div, p, h1, h2, strong, br).
        2. Use Tailwind CSS utility classes exclusively.
        3. DO NOT USE FIXED WIDTHS. Use w-full.
        4. ENSURE AUTO-SCREEN OPTIMIZATION: Use grid-cols-1 md:grid-cols-2.
        5. FONT SCALING: Use text-sm md:text-base lg:text-xl.
        6. Language: Use ${requestedLanguage}.
        7. Format: Return ONLY raw HTML inner content.
        `;
    }

    if (tool?.category === 'creative' && ['image_gen', 'logo_designer', 'comic_maker', 'avatar_maker', 'fashion_designer'].includes(toolAction)) {
        modelName = 'gemini-2.5-flash-image';
        systemInstruction += `
        ROLE: MASTER VISUAL ARTIST.
        TASK: Generate the requested visual based on: ${input}.
        Create a stunning, high-quality image response.
        `;
    }

    if (tool?.category === 'astrology') {
        systemInstruction += `
        ROLE: COSMIC GUIDE & VEDIC ASTROLOGER.
        Provide deep insights using planetary positions and mystical wisdom.
        `;
    }

    const parts: any[] = [{ text: input }];
    if (imageInput) {
        const base64Data = imageInput.split(',')[1] || imageInput;
        parts.unshift({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }

    const tools: any[] = [];
    if (['trend_hunter', 'news_reporter', 'web_browser', 'creativity_catalyst', 'map_grounding', 'lead_hunter', 'weather_radar'].includes(toolAction)) {
        tools.push({ googleSearch: {} });
        if (toolAction === 'map_grounding') tools.push({ googleMaps: {} });
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            temperature: 0.9 
        }
    });

    const text = response.text || "";
    let code = undefined;
    
    const htmlRegex = /<div[\s\S]*?<\/div>|<!DOCTYPE html>[\s\S]*?<\/html>|```html([\s\S]*?)```/i;
    const match = text.match(htmlRegex);
    if (match) {
        code = match[1] || match[0];
    } else if (text.trim().startsWith('<')) {
        code = text.trim();
    }

    return {
        text: code ? "Chief Admin, I've materialized the result below! 🚀" : text,
        code: code,
        contentType: (code) ? 'html' : 'text',
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
    if (!base64Audio) throw new Error("No audio");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
};

export const performWebSearch = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
};

export const getWebsiteAdvice = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following website and provide insights or advice for a user browsing it: ${url}`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
};

export const generatePodcastScript = async (topic: string, language: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate an intense, factual, argumentative podcast script in ${language} between two speakers: Aura and Kilvish. 
        Topic: ${topic}. 
        Aura is friendly and optimistic. Kilvish is skeptical and cynical. 
        Format the script with speaker names clearly labeled (e.g., Aura: ..., Kilvish: ...).`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
};

export const generateAudiobookScript = async (topic: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate an immersive, cinematic, deep audiobook narration in ${language} about: ${topic}.`
    });
    return response.text;
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
    if (!base64Audio) throw new Error("No audio generated");
    
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    
    const wavBlob = pcmToWav(pcmData, 24000);
    return URL.createObjectURL(wavBlob);
};

export const generateSpeechDownloadUrl = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
                },
            },
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    
    const wavBlob = pcmToWav(pcmData, 24000);
    return URL.createObjectURL(wavBlob);
};
