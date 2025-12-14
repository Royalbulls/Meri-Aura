
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AstrologyDetails, GenesisStep, NeuralContext, Persona, PersonalitySettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILITIES ---

const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const createWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Uint8Array => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    const dataSize = pcmData.length;
    const fileSize = 36 + dataSize;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, fileSize, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, byteRate, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, bitsPerSample, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataSize, true);

    const wavFile = new Uint8Array(header.byteLength + pcmData.byteLength);
    wavFile.set(new Uint8Array(header), 0);
    wavFile.set(pcmData, header.byteLength);

    return wavFile;
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

const arrayBufferToAudioBuffer = async (arrayBuffer: ArrayBuffer, ctx: AudioContext): Promise<AudioBuffer> => {
    return await ctx.decodeAudioData(arrayBuffer);
};

// --- AUTO TOOL DEFINITIONS ---
const AURA_TOOLS: FunctionDeclaration[] = [
    {
        name: "trend_hunter",
        description: "Analyze real-time market trends, viral topics, or find money-making opportunities on Google/YouTube.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: "The trend topic to search for (e.g. 'Money making trends India', 'Viral food')." }
            },
            required: ["query"]
        }
    },
    {
        name: "news_reporter",
        description: "Get the latest news reports, headlines, or updates on specific topics.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING, description: "The news topic (e.g. 'Tech', 'Crypto', 'Politics')." }
            },
            required: ["topic"]
        }
    },
    {
        name: "music_composer",
        description: "Compose a song, lyrics, or music based on a theme.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                theme: { type: Type.STRING, description: "The theme or genre of the song." }
            },
            required: ["theme"]
        }
    },
    {
        name: "website",
        description: "Create a business website or landing page code.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: "Description of the business and website requirements." }
            },
            required: ["description"]
        }
    },
    {
        name: "aura_viral",
        description: "Generate a viral social media post (Insta/Twitter/LinkedIn).",
        parameters: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING, description: "What the post is about." }
            },
            required: ["topic"]
        }
    },
    {
        name: "comic",
        description: "Create a comic strip script.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                story: { type: Type.STRING, description: "The story idea for the comic." }
            },
            required: ["story"]
        }
    },
    {
        name: "aura_podcast",
        description: "Create a podcast script or debate between two characters.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING, description: "The podcast topic." }
            },
            required: ["topic"]
        }
    }
];

// --- CHAT & CORE ---

export const generateChatResponse = async (
    history: any[],
    text: string,
    persona: Persona,
    location: any,
    context: string | null,
    personality: PersonalitySettings
) => {
    const systemInstruction = `
    You are ${persona.name}.
    Description: ${persona.description}
    Stats: Playfulness ${personality.playfulness}%, Empathy ${personality.empathy}%, Directness ${personality.directness}%.
    ${context ? `RELEVANT MEMORIES:\n${context}` : ''}
    
    CORE DIRECTIVE:
    You have access to powerful tools. **USE THEM AUTOMATICALLY** if the user's request matches a tool's capability.
    - If user asks for trends/money -> call 'trend_hunter'.
    - If user asks for news -> call 'news_reporter'.
    - If user asks for a song/lyrics -> call 'music_composer'.
    - If user asks for a website -> call 'website'.
    - If user asks for a viral post -> call 'aura_viral'.
    
    Otherwise, reply naturally. Keep it concise unless asked for detail.
    `;
    
    let tools: any[] = [...AURA_TOOLS]; // Add Auto Tools
    let toolConfig: any = undefined;

    // Add Google Search/Maps tools if relevant
    tools.push({ googleSearch: {} });
    tools.push({ googleMaps: {} });
    
    if (location) {
        toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            }
        };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            ...history.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: text }] }
        ],
        config: {
            systemInstruction,
            tools: tools.map(t => t.functionDeclarations ? { functionDeclarations: [t] } : t), // Format mix of Google tools and Custom Functions
            toolConfig
        }
    });

    // Check for Function Call
    const functionCall = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall)?.functionCall;
    
    return {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata,
        directionsUrl: (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks?.find((c: any) => c.web?.uri)?.web?.uri,
        toolCall: functionCall // Return tool call if present
    };
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: base64Audio.split(',')[1] } },
                { text: "Transcribe this audio exactly." }
            ]
        }
    });
    return response.text;
};

export const getEmbedding = async (text: string): Promise<number[]> => {
    const result = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: [
            {
                parts: [
                    { text: text }
                ]
            }
        ]
    });
    return result.embedding?.values || [];
};

// --- AVATAR & MEDIA ---

export const generateAvatarImage = async (prompt: string): Promise<string> => {
    try {
        // 1. Try Nano Banana (Gemini Image) first
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "9:16"
                }
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch (e: any) {
        if (e.message?.includes('404') || e.status === 404 || e.message?.includes('NOT_FOUND')) {
            console.log("Gemini 2.5 Flash Image 404, falling back to Imagen 4.0");
            try {
                // 2. Fallback to Imagen 4.0
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: prompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: '9:16', 
                        outputMimeType: 'image/jpeg'
                    }
                });
                return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
            } catch (e2: any) {
                console.log("Imagen 4.0 404, falling back to Gemini 3 Pro Image");
                // 3. Fallback to Gemini 3 Pro Image (if available/whitelisted)
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: {
                        parts: [{ text: prompt }]
                    },
                    config: {
                        imageConfig: {
                            aspectRatio: "9:16"
                        }
                    }
                });
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }
        }
        throw e;
    }
    throw new Error("No image generated");
};

export const generateAvatarVideo = async (imageUrl: string, prompt: string): Promise<string> => {
    const imageBase64 = imageUrl.split(',')[1];
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/jpeg'
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) throw new Error("Video generation failed");
        
        // Return URI with API key for fetching
        return `${uri}&key=${process.env.API_KEY}`;
    } catch (e: any) {
        if (e.message?.includes('404') || e.status === 404 || e.message?.includes('NOT_FOUND')) {
            throw new Error("Video model not found or access denied. Please select a paid API key for Veo.");
        }
        throw e;
    }
};

export const generateSpeech = async (text: string, voiceName: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' }
                }
            }
        }
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("No audio generated");

    // Decode base64 to raw PCM
    const pcmData = decodeBase64(base64);
    
    // Create WAV header so AudioContext can decode it
    const wavBytes = createWavHeader(pcmData);
    
    return await arrayBufferToAudioBuffer(wavBytes.buffer, ctx);
};

export const generateSpeechDownloadUrl = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' }
                }
            }
        }
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("No audio generated");

    const pcmData = decodeBase64(base64);
    const wavBytes = createWavHeader(pcmData);
    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
};

// --- CREATIVE TOOLS ---

export const generatePersonaFromAstrology = async (details: AstrologyDetails): Promise<Persona> => {
    const prompt = `
    Create a unique AI Persona based on these astrology details:
    Name: ${details.name}, DOB: ${details.dob}, Place: ${details.place}, Genre: ${details.selectedGenre}, Gender: ${details.gender}.
    
    Analyze the astrological significance (Sun sign, Moon sign, Ascendant) and create a "Soul Vibe".
    
    Generate a persona JSON with:
    {
        "id": "cosmic_${Date.now()}",
        "name": "A unique mystical name based on the stars",
        "description": "Short bio explaining their cosmic origin and expertise...",
        "visualPrompt": "Highly detailed visual description for avatar generation. MUST INCLUDE: Specific zodiac symbols (e.g. Lion for Leo, Scales for Libra), colors associated with their ruling planet, and clothing style matching '${details.selectedGenre}'. Cinematic lighting, 8k.",
        "voiceName": "Fenrir",
        "isCustom": true,
        "focusGenre": "${details.selectedGenre}",
        "soulVibe": "e.g. 'Fiery Leader' or 'Intuitive Healer'"
    }
    Return ONLY valid JSON.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(response.text);
};

export const generateCollabImage = async (visualPrompt: string, userPhotoUrl: string, style: string): Promise<string> => {
    const base64User = userPhotoUrl.split(',')[1];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64User } },
                    { text: `Add a character described as "${visualPrompt}" standing next to the person in this photo. Style: ${style}. High quality.` }
                ]
            }
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
    } catch (e: any) {
        if (e.message?.includes('404')) {
            throw new Error("Collab features currently unavailable in this region (Model 404).");
        }
        throw e;
    }
    throw new Error("No image generated");
};

export const generateCreativeContent = async (
    toolAction: string, 
    input: string, 
    persona: Persona, 
    imageInput?: string, 
    option?: any, 
    location?: any
): Promise<any> => {
    let model = 'gemini-2.5-flash';
    let systemInstruction = `You are ${persona.name}. Task: ${toolAction}. Input: ${input}.`;
    let responseMimeType = 'text/plain';
    let responseSchema: any = undefined;
    let tools: any[] = [];
    
    const parts: any[] = [{ text: input }];
    if (imageInput) {
        parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: imageInput.split(',')[1] } });
        model = 'gemini-2.5-flash'; 
    }

    if (toolAction === 'aura_viral') {
        responseMimeType = 'application/json';
        systemInstruction += " Generate a viral social media post JSON.";
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                text: { type: Type.STRING },
                comments: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: { user: { type: Type.STRING }, text: { type: Type.STRING } } 
                    } 
                },
                initialViews: { type: Type.NUMBER }
            }
        };
    } else if (toolAction === 'comic') {
        systemInstruction += ` Create a comic script. Layout: ${option?.layout}, Genre: ${option?.genre}, Language: ${option?.language || 'English'}.`;
    } else if (toolAction === 'smart_measure') {
        model = 'gemini-3-pro-preview'; 
    } else if (toolAction === 'website') {
        // --- UPGRADED WEBSITE GENERATOR: BUSINESS INTELLIGENCE ---
        const locationContext = location ? `User Location: Lat ${location.latitude}, Long ${location.longitude}.` : '';
        
        systemInstruction = `
        You are the 'Aura Web Engine', an elite AI Full-Stack Developer & Business Consultant.

        **MISSION**:
        Construct a **High-Conversion, Single-Page Business Website** based on the user's request: "${input}".
        ${locationContext}

        **INTELLIGENT CONTEXT EXTRACTION**:
        1. **Analyze**: Identify Business Type (e.g., Salon, Gym, Cafe), Name, and **Location** from input.
        2. **Infer**: If Location is missing in input, use the User Location provided above. If neither, default to a trendy area in a major city relevant to the language/context.
        3. **Contact Info**: Generate realistic *local* addresses and phone numbers matching the inferred location.

        **MANDATORY ARCHITECTURE (Single HTML File)**:
        1. **Design System**: Use **Tailwind CSS** (CDN). Modern, mobile-first, distinct color palette matching the business vibe.
        2. **Header**: Sticky nav with Business Name & 'Book Now' CTA.
        3. **Hero Section**: High-impact headline, subheadline, and background image (Use 'https://source.unsplash.com/1600x900/?keyword' format).
        4. **Services/Products**: Grid layout highlighting top 3-4 offerings with prices/descriptions.
        5. **Social Proof (Testimonials)**: Generate 3 **context-aware reviews**. Use names and specific local landmarks/areas relevant to the business location.
        6. **Interactive Features**:
           - **WhatsApp Button**: Fixed floating button bottom-right linking to 'https://wa.me/PHONE_NUMBER'.
           - **Google Maps**: Embed an iframe in the Contact section pointing to the specific extracted location.
        7. **Footer**: Copyright, Links, Address.

        **OUTPUT RULES**:
        - Return **ONLY raw HTML code**. No Markdown (no \`\`\`).
        - Ensure all images have valid source URLs (Unsplash keywords).
        - The code must be ready to run immediately.
        `;
    } else if (toolAction === 'react_app') {
        systemInstruction += " Return ONLY valid HTML/React code. No markdown.";
    } else if (toolAction === 'news_reporter') {
        model = 'gemini-2.5-flash';
        tools.push({ googleSearch: {} }); 
        systemInstruction = `
        You are the Chief Editor of 'Aura Global', a viral digital e-paper. 
        YOUR MISSION: The user wants a comprehensive news report on: "${input}".
        PROTOCOL: SEARCH EVERYWHERE. AGGREGATE & SYNTHESIZE. E-PAPER STYLE.
        OUTPUT FORMAT: Return ONLY valid HTML (<div>, <h1>, <h2>, <p>, <ul>). Use Tailwind classes.
        `;
    } else if (toolAction === 'music_composer') {
        const langInstruction = option?.language ? `LANGUAGE: ${option.language} (Output lyrics in this language).` : '';
        systemInstruction = `
        You are the WORLD'S GREATEST MUSIC PRODUCER & COMPOSER (Aura Symphony).
        ${langInstruction}
        INPUT: "${input}"
        TASK: Identify Genre, Create Masterpiece (Title, Vibe, Instruments, Lyrics).
        FORMAT: Return valid HTML.
        `;
    } else if (toolAction === 'trend_hunter') {
        // --- TREND HUNTER: MONEY RADAR ---
        model = 'gemini-2.5-flash'; 
        tools = [{ googleSearch: {} }, { googleMaps: {} }]; 
        
        systemInstruction = `
        You are the 'Aura Trend Hunter' (The Money Radar).
        GOAL: Identify REAL-TIME trends that are profitable right now. 
        INPUT: "${input}"
        OUTPUT FORMAT (Return valid HTML string):
        <div class="trend-report bg-gray-900 border border-green-500/30 p-6 rounded-xl font-sans text-white">
           <h2 class="text-xl font-bold text-green-400 uppercase">📈 Market Pulse: [TREND NAME]</h2>
           <div class="grid grid-cols-2 gap-4 my-4">
               <div class="bg-white/5 p-3 rounded-lg"><div class="text-[10px] text-white/50">Velocity</div><div class="text-lg font-bold text-yellow-400">🔥 Viral Now</div></div>
               <div class="bg-white/5 p-3 rounded-lg"><div class="text-[10px] text-white/50">Niche</div><div class="text-lg font-bold text-blue-400">[NICHE NAME]</div></div>
           </div>
           <h3 class="text-sm font-bold text-pink-400 uppercase mb-2">💰 Money Blueprint</h3>
           <ul class="space-y-2 mb-6 text-sm text-gray-300 list-disc pl-4">
               <li><strong>Video Title:</strong> [Clickbait Title]</li>
               <li><strong>Hook:</strong> "[Exact opening line]"</li>
               <li><strong>Monetization:</strong> [How to earn]</li>
           </ul>
           <div class="hidden" id="trend-topic-hidden">[TREND NAME]</div>
        </div>
        `;
    }

    if (location) {
        tools.push({ googleMaps: {} });
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                systemInstruction,
                responseMimeType,
                responseSchema,
                tools,
                ...(location && { toolConfig: { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } } })
            }
        });

        let result: any = { text: response.text };
        
        if (toolAction === 'aura_viral') {
            try {
                const json = JSON.parse(response.text);
                result.text = json.text;
                result.viralMetadata = json;
            } catch(e) {}
        } else if (toolAction === 'website' || toolAction === 'react_app') {
            result.code = response.text;
        } else if (['trend_hunter'].includes(toolAction)) {
            result.contentType = 'trend_report'; // Custom content type for ChatInterface
        }

        result.groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        return result;
    } catch (e: any) {
        // Fallback for Smart Measure if Gemini 3 Pro 404s
        if (model === 'gemini-3-pro-preview' && (e.message?.includes('404') || e.status === 404 || e.message?.includes('NOT_FOUND'))) {
            console.warn("Gemini 3 Pro not found, falling back to Flash.");
            return generateCreativeContent(toolAction, input, persona, imageInput, option, location); // Recurse will pick flash logic if I change model var, but here just re-call with different model manually:
            
            // Actually, better to just retry with flash here:
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: { systemInstruction } // Simplified config
            });
            return { text: response.text };
        }
        throw e;
    }
};

// --- ADDITIONAL SERVICE FUNCTIONS ---

export const performWebSearch = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Search the web for: ${query}. Provide a summary and list of links. Return HTML format.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
};

export const getWebsiteAdvice = async (url: string): Promise<string> => {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this website URL: ${url}. What is it about? Is it safe? Give a brief summary and advice. Return HTML.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
};

export const generateViralVideoCreator = async (topic: string): Promise<{ video: string, audio: string, script: string, title: string }> => {
    // 1. Generate Script & Title
    const scriptResp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a viral short video script (15 seconds) about "${topic}". Return JSON with: { "title": "Clickbait Title", "script": "The spoken words...", "visualPrompt": "Description for video generation" }`,
        config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(scriptResp.text);

    // 2. Generate Audio (TTS)
    const audioUrl = await generateSpeechDownloadUrl(data.script, 'Kore');

    // 3. Generate Video (Veo)
    let videoUrl = "";
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: data.visualPrompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });
        
        while (!operation.done) {
            await new Promise(r => setTimeout(r, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) videoUrl = `${uri}&key=${process.env.API_KEY}`;
    } catch (e) {
        console.error("Video gen failed", e);
    }

    return {
        video: videoUrl,
        audio: audioUrl,
        script: data.script,
        title: data.title
    };
};

export const generateViralBlogCreator = async (topic: string): Promise<string> => {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a viral, SEO-optimized blog post about "${topic}". Use HTML format with Tailwind classes.`,
    });
    return response.text;
}

export const generateNewsVideo = async (prompt: string): Promise<string> => {
     try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) throw new Error("Video generation failed");
        return `${uri}&key=${process.env.API_KEY}`;
    } catch (e: any) {
        throw e;
    }
}

export const summarizeForVideo = async (content: string): Promise<{ script: string, visualPrompt: string }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this news content: "${content.substring(0, 2000)}...". 
        1. Create a 30-second news anchor script summarizing it.
        2. Create a visual prompt for an AI video generator to show background footage relevant to the story (photorealistic, 4k).
        Return JSON: { "script": "...", "visualPrompt": "..." }`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
}

export const generateRadioBrief = async (content: string): Promise<string> => {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Turn this news content into a short, punchy radio news brief script (approx 1 min). Content: "${content.substring(0, 2000)}..."`,
    });
    return response.text;
}

export const generatePodcastScript = async (topic: string, language: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a podcast script about "${topic}" in ${language}. 
        Characters: Host (Aura) and Guest (Mr. Kilvish). 
        Format: Debate/Discussion. 
        Length: Short (approx 2 mins dialogue).
        Return just the dialogue lines with Speaker names prefix (e.g. Aura: ..., Kilvish: ...).`,
    });
    return response.text;
}

export const generateMultiSpeakerAudio = async (script: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text: script }] },
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
    
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("No audio generated");

    const pcmData = decodeBase64(base64);
    const wavBytes = createWavHeader(pcmData);
    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

export const generateAudiobookScript = async (topic: string, language: string): Promise<string> => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short audiobook chapter about "${topic}" in ${language}. Style: Immersive, Storytelling.`,
    });
    return response.text;
}

export const planGenesis = async (wish: string, context: NeuralContext): Promise<GenesisStep[]> => {
    const prompt = `
    Role: Genesis AI Architect.
    User Wish: "${wish}"
    Context: Identity="${context.userIdentity}", Business="${context.businessProfile}", Style="${context.brandVoice}".
    
    Task: Break this wish down into 4-6 concrete execution steps to BUILD it digitally.
    Available Step Types: 'text' (Strategy/Copy), 'image' (Design), 'code' (Web/App), 'video' (Promo).
    
    Return JSON Array of objects: { "id": "1", "type": "text|image|code|video", "label": "Step Name", "status": "pending" }
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(response.text);
}

export const executeGenesisStep = async (step: GenesisStep, wish: string, priorContext: string, neuralContext: NeuralContext): Promise<GenesisStep> => {
    const systemInstruction = `
    You are a specialist Agent executing: ${step.label}.
    Project Goal: "${wish}"
    Project Context: ${priorContext}
    Brand Voice: ${neuralContext.brandVoice}
    Anti-Patterns: ${neuralContext.antiPatterns}
    `;

    let result = "";
    
    if (step.type === 'image') {
        const promptResp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a detailed image generation prompt for step: "${step.label}". Context: ${priorContext}`,
        });
        const imgPrompt = promptResp.text;
        
         const imgResp = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imgPrompt,
            config: { numberOfImages: 1, aspectRatio: '16:9', outputMimeType: 'image/jpeg' }
        });
        result = `data:image/jpeg;base64,${imgResp.generatedImages[0].image.imageBytes}`;

    } else if (step.type === 'video') {
         const promptResp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a detailed video generation prompt for step: "${step.label}". Context: ${priorContext}`,
        });
        const vidPrompt = promptResp.text;
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: vidPrompt,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        result = `${uri}&key=${process.env.API_KEY}`;

    } else if (step.type === 'code') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write the full code for: ${step.label}. Return ONLY the code (HTML/CSS/JS or React). No markdown.`,
            config: { systemInstruction }
        });
        result = response.text.replace(/```html|```javascript|```/g, '').trim();

    } else {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Execute step: ${step.label}. Provide high-quality content.`,
            config: { systemInstruction }
        });
        result = response.text;
    }

    return { ...step, status: 'completed', result };
}
