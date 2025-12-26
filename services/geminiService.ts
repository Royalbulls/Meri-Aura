
// Fix: Added missing exports for podcast and audiobook generation and updated to use Modality enum.
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Persona, GenesisStep, NeuralContext } from '../types';

// Always use named parameter for initialization and obtain key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILS ---

export const getEmbedding = async (text: string): Promise<number[]> => {
    const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: [{ parts: [{ text }] }]
    });
    return response.embedding?.values || [];
};

// --- CORE GENERATION ---

export const generateCreativeContent = async (
    toolAction: string, 
    input: string, 
    persona: Persona, 
    imageInput?: string,
    option?: any,
    location?: { latitude: number, longitude: number }
) => {
    let modelName = 'gemini-3-flash-preview';
    let systemInstruction = `You are ${persona.name}. ${persona.description}. Tone: ${persona.soulVibe || 'Helpful'}. Output must be concise and formatted.`;

    if (toolAction === 'invoice_editor') {
        systemInstruction = `You are an expert Invoice Generator & Editor. TASK: Reconstruct as editable HTML. Return ONLY RAW HTML. No markdown.`;
    } else if (toolAction === 'blog_post') {
        modelName = 'gemini-3-pro-preview';
        systemInstruction = `You are an expert Blogger. Return a beautiful HTML/CSS blog post using Tailwind. No markdown code blocks.`;
    } else if (toolAction === 'generate_csv') {
        modelName = 'gemini-3-pro-preview';
        systemInstruction = `You are an expert Data Analyst. Generate ONLY raw CSV text. First row headers.`;
    } else if (toolAction === 'news_reporter') {
        modelName = 'gemini-3-pro-preview'; 
        systemInstruction = `You are the Editor-in-Chief of Aura Global News. Generate world-class investigative news report. Use Tailwind CSS. No markdown.`;
    } else if (toolAction === 'chat') {
        systemInstruction = `ACT AS A BEST FRIEND. Be helpful, funny, and technically sharp. Context: ${input}`;
    }

    const parts: any[] = [{ text: input }];
    if (imageInput) {
        const base64Data = imageInput.split(',')[1] || imageInput;
        parts.unshift({
            inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
            }
        });
    }

    const tools: any[] = [];
    if (['trend_hunter', 'news_reporter', 'web_browser'].includes(toolAction)) {
        tools.push({ googleSearch: {} });
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            temperature: 0.7
        }
    });

    const text = response.text || "";
    let code = undefined;
    if (text.includes("```html")) code = text.split("```html")[1].split("```")[0];
    else if (text.includes("<!DOCTYPE html>")) code = text;
    else if (toolAction === 'generate_csv') code = text;
    if (!code && text.trim().startsWith('<')) code = text.trim();

    return {
        text,
        code,
        imageUrl: undefined, 
        videoUrl: undefined,
        contentType: 'text',
        groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
};

// --- BROWSER / SEARCH ---

export const performWebSearch = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search results for: ${query}. Create a beautiful search results page using Tailwind CSS. Include 5-7 realistic results with titles, snippets, and fake URLs. Return ONLY RAW HTML. No markdown.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
};

export const getWebsiteAdvice = async (url: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this website: ${url}. Provide strategic advice and summary. Return ONLY RAW HTML. No markdown.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
};

// --- GENESIS ---

export const planGenesis = async (wish: string, context: NeuralContext): Promise<GenesisStep[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `SYSTEM COMMAND: Architect an executable multi-step project plan for: "${wish}".
        CONTEXT: ${JSON.stringify(context)}.
        
        OUTPUT RULES:
        1. Break into 4-6 specialized steps.
        2. Assign specialized agent types (code, text, image, audio).
        3. Ensure steps build on each other.
        4. Return JSON array ONLY.
        
        FORMAT: [{ "id": "uuid", "label": "Short Action Name", "type": "text"|"code"|"image", "prompt": "Deep technical instructions for specialized agent" }]`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
};

export const executeGenesisStep = async (step: GenesisStep, wish: string, priorContext: string, neuralContext: NeuralContext): Promise<GenesisStep> => {
    const systemPrompt = `ACT AS A ${step.type.toUpperCase()} SPECIALIST AGENT. 
    TASK: ${step.label}. 
    GLOBAL GOAL: ${wish}.
    NEURAL CONTEXT: ${neuralContext.brandVoice}. ${neuralContext.businessProfile}.
    
    INSTRUCTIONS:
    - If type is 'code', return a COMPLETE standalone HTML/Tailwind implementation.
    - If type is 'text', return a beautiful formatted executive report using HTML.
    - Ensure output is production-ready.
    - NO MARKDOWN code blocks.
    
    PRIOR PROGRESS:
    ${priorContext}
    
    GENERATE NOW:`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: systemPrompt,
    });

    let cleanResult = response.text || "";
    if (cleanResult.includes("```html")) cleanResult = cleanResult.split("```html")[1].split("```")[0];
    else if (cleanResult.includes("```")) cleanResult = cleanResult.split("```")[1].split("```")[0];

    return { ...step, status: 'completed', result: cleanResult.trim() };
};

// --- AUDIO / TTS ---

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
    if (!base64Audio) throw new Error("No audio returned");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = audioContext.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
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
    if (!base64Audio) throw new Error("No audio returned");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/pcm' }));
};

export const generateMultiSpeakerAudio = async (script: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: `A conversation: ${script}` }] },
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
    if (!base64Audio) throw new Error("Audio failed");
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/pcm' }));
};

// --- PODCAST / AUDIOBOOK SCRIPTS ---

/**
 * Fix: Implemented missing generatePodcastScript function.
 * Generates a podcast script with multiple speakers and grounding metadata.
 */
export const generatePodcastScript = async (topic: string, language: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
            parts: [{
                text: `Generate a high-quality podcast script in ${language} about "${topic}". 
                The conversation is between Aura (helpful, evolved AI) and Kilvish (skeptical, argumentative rival). 
                Include deep investigative analysis. Use a dialogue format like 'Aura: ...' and 'Kilvish: ...'.`
            }]
        }],
        config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.8
        }
    });

    return {
        text: response.text || "",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
};

/**
 * Fix: Implemented missing generateAudiobookScript function.
 * Generates an immersive audiobook narration script.
 */
export const generateAudiobookScript = async (topic: string, language: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
            parts: [{
                text: `Write an immersive, cinematic, and deep audiobook-style story about "${topic}" in ${language}. 
                Focus on narrative depth and emotional resonance.`
            }]
        }],
        config: {
            temperature: 0.7
        }
    });

    return response.text || "";
};
