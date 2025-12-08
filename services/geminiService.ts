
// ... existing imports ...
import { GoogleGenAI, Modality } from "@google/genai";
import { Persona, ChatResponse, AstrologyDetails, PersonalitySettings, Message, Sender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ... existing generateChatResponse ...
export const generateChatResponse = async (
  history: Message[],
  message: string,
  persona: Persona,
  location: { latitude: number; longitude: number } | undefined,
  context: string | null,
  personality: PersonalitySettings
): Promise<ChatResponse> => {
  const systemInstruction = `
    You are ${persona.name}.
    ${persona.description}

    Current Context:
    - User Location: ${location ? `${location.latitude}, ${location.longitude}` : 'Unknown'}
    - Memory Context: ${context || 'None'}
    - Personality Traits: Playfulness: ${personality.playfulness}%, Empathy: ${personality.empathy}%, Directness: ${personality.directness}%

    Respond naturally.
  `;

  // Format history for the model
  const contents = history.map(h => {
      const parts: any[] = [{ text: h.text }];
      // Include image attachment if present and from user (e.g. vision scan or upload)
      if (h.sender === Sender.User && h.attachmentUrl && h.attachmentUrl.startsWith('data:image')) {
          try {
              const mimeType = h.attachmentUrl.split(';')[0].split(':')[1];
              const base64Data = h.attachmentUrl.split(',')[1];
              if (mimeType && base64Data) {
                  parts.push({
                      inlineData: {
                          data: base64Data,
                          mimeType: mimeType
                      }
                  });
              }
          } catch (e) {
              console.warn("Failed to attach image to message history", e);
          }
      }
      return {
          role: h.sender === Sender.User ? 'user' : 'model',
          parts: parts
      };
  });
  
  // Add user message
  contents.push({ role: 'user', parts: [{ text: message }] });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
    }
  });

  return {
    text: response.text || "I am speechless.",
    groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    directionsUrl: undefined 
  };
};

// ... existing generateAvatarImage ...
export const generateAvatarImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {} // No responseMimeType for gemini-2.5-flash-image
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
};

// ... existing generateAvatarVideo ...
export const generateAvatarVideo = async (imageUrl: string, prompt: string): Promise<string> => {
    const base64Data = imageUrl.split(',')[1];
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: base64Data,
            mimeType: 'image/png'
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '9:16'
        }
    });
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }
    
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed");
    
    const vidResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await vidResponse.blob();
    return URL.createObjectURL(blob);
};

// ... existing generateSpeech ...
export const generateSpeech = async (text: string, voiceName: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    // 1. Sanitize Text: Remove HTML tags which confuse the TTS model
    const cleanText = text.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 600);
    
    if (!cleanText) throw new Error("Text is empty after cleanup");

    // 2. Validate Voice
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const voice = validVoices.includes(voiceName) ? voiceName : 'Kore';

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: cleanText }] },
        config: {
            responseModalities: ['AUDIO' as any], // Use string to avoid enum import issues
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice }
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
    
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    
    return buffer;
};

// ... existing generatePersonaFromAstrology ...
export const generatePersonaFromAstrology = async (details: AstrologyDetails): Promise<Persona> => {
    const prompt = `Create a detailed persona for an AI agent based on this astrology data: Name: ${details.name}, DOB: ${details.dob}, Time: ${details.time}, Place: ${details.place}, Gender: ${details.gender}, Genre: ${details.selectedGenre}.
    Return JSON with fields: id, name, description, visualPrompt, voiceName.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    const json = JSON.parse(response.text || '{}');
    return {
        ...json,
        id: `cosmic_${Date.now()}`,
        isCustom: true
    };
};

// ... existing generateCollabImage ...
export const generateCollabImage = async (personaPrompt: string, userPhotoBase64: string, style: string): Promise<string> => {
    const base64Data = userPhotoBase64.split(',')[1];
    const mimeType = userPhotoBase64.split(';')[0].split(':')[1];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: `Create a collaboration image. Style: ${style}. Context: The user in the photo meeting the character described as: ${personaPrompt}` }
            ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return '';
};

// ... existing analyzeUserFace ...
export const analyzeUserFace = async (base64Image: string): Promise<string> => {
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: "Describe the person in this image in detail (appearance, expression, clothing)." }
            ]
        }
    });
    return response.text || "";
};

// ... existing transcribeAudio ...
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    const base64Data = base64Audio.split(',')[1];
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: "Transcribe this audio." }
            ]
        }
    });
    return response.text || "";
};

// ... existing getEmbedding ...
export const getEmbedding = async (text: string): Promise<number[]> => {
    if (!text || !text.trim()) return [];
    try {
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            content: { parts: [{ text }] }
        });
        if (response.embedding?.values) {
            return response.embedding.values;
        }
        console.warn("No embedding values returned from API");
        return [];
    } catch (e) {
        console.error("Embedding error:", e);
        return [];
    }
};

// ... existing getWebsiteAdvice ...
export const getWebsiteAdvice = async (url: string): Promise<string> => {
    const prompt = `
        The user is browsing this URL/Topic: "${url}".
        
        ACT AS A CYBER-SECURITY EXPERT AND SHOPPING/RESEARCH ASSISTANT.
        
        MISSION:
        1. Identify what this website/topic is.
        2. Give a "System Check" security rating (Safe/Phishing/Scam risk).
        3. Provide 3 specific tips for this site (e.g., if shopping: "Check for coupons", if reading: "Verify sources").
        
        Keep it concise, friendly, and actionable. Use emojis.
        Output format HTML (Inline CSS).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    
    return response.text || "Analyzing site data...";
};

// ... existing performWebSearch ...
export const performWebSearch = async (query: string): Promise<string> => {
    const prompt = `
        ACT AS A MODERN SEARCH ENGINE (Google AI Overview).
        USER QUERY: "${query}"
        
        MISSION: Perform a real Google Search using your tools and display the results as a clean list.
        
        FORMAT REQUIREMENTS:
        - Return RAW HTML. No Markdown.
        - Style it exactly like Google Search Results in Dark Mode.
        - **IMPORTANT:** Use <a> tags for titles so the user can click them.
        
        OUTPUT STRUCTURE (HTML):
        <div style="font-family: sans-serif; padding: 20px; color: #e8eaed;">
            <!-- AI Summary (Optional but good) -->
            <div style="background: #303134; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 16px;">✨ AI Overview</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #bdc1c6;">[Provide a 2-sentence direct answer to the query here]</p>
            </div>

            <!-- Search Results List -->
            <div class="search-result" style="margin-bottom: 30px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <div style="background: #202124; border-radius: 50%; width: 16px; height: 16px;"></div>
                    <span style="font-size: 12px; color: #bdc1c6;">Domain Name</span>
                </div>
                <a href="URL_HERE" style="font-size: 20px; color: #8ab4f8; text-decoration: none; display: block; margin-bottom: 4px; hover:underline;">Page Title Here</a>
                <div style="font-size: 14px; color: #9aa0a6; display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden;">Snippet description of the page content goes here...</div>
            </div>
            
            <!-- Repeat for 4-5 top results -->
        </div>
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    return response.text || "<div style='padding:20px; color:white;'>No results found.</div>";
};

// ... existing generateCreativeContent ...
export const generateCreativeContent = async (
    action: string, 
    input: string, 
    persona: Persona, 
    imageInput?: string, 
    option?: any, 
    location?: { latitude: number, longitude: number }
): Promise<{ text: string, code?: string, imageUrl?: string, earthLocation?: string, groundingMetadata?: any }> => {
    
    // ... existing check_location ...
    if (action === 'check_location') {
         if (!location) return { text: "Location unavailable." };
         const prompt = `Using LatLng (${location.latitude}, ${location.longitude}), identify exact address, landmarks, and what is special nearby.`;
         const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: [{role: 'user', parts: [{text: prompt}]}], config: {tools: [{googleMaps: {}}]}});
         return { text: response.text || "Checking location...", groundingMetadata: response.candidates?.[0]?.groundingMetadata };
    }

    // ... existing youtube_search ...
    if (action === 'youtube_search') {
         const prompt = `
            Find the best YouTube video for the topic: "${input}".
            
            OUTPUT FORMAT:
            1. Video Title
            2. Brief description of what happens in it.
            3. The direct YouTube URL (e.g., https://www.youtube.com/watch?v=...)
            
            Ensure you provide a valid link found via Google Search.
         `;
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
             config: { tools: [{googleSearch: {}}] }
         });
         return { 
             text: response.text || "Searching YouTube...", 
             groundingMetadata: response.candidates?.[0]?.groundingMetadata 
         };
    }

    // ... existing web_browser ...
    if (action === 'web_browser') {
         // USE THE NEW SEARCH FUNCTION FOR BETTER RESULTS
         const searchHtml = await performWebSearch(input);
         return { 
             text: searchHtml, 
             // Pass generic metadata if any
             groundingMetadata: undefined 
         };
    }

    // ... existing link_summary ...
    if (action === 'link_summary') {
        const prompt = `
            Analyze and summarize the content of this link/query: "${input}".
            Provide key takeaways, main points, and any relevant details.
        `;
        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
             config: { tools: [{googleSearch: {}}] }
         });
         return { 
             text: response.text || "Analyzing link...", 
             groundingMetadata: response.candidates?.[0]?.groundingMetadata 
         };
    }

    // ... existing blog_post ...
    if (action === 'blog_post') {
        const prompt = `
            ACT AS A WORLD-CLASS BLOGGER AND EDITOR.
            TOPIC: "${input}"
            
            MISSION: Write a highly creative, engaging, accurate, and detailed blog post.
            
            FORMAT REQUIREMENTS (INLINE CSS FOR EXTERNAL COMPATIBILITY):
            - Return ONLY the HTML content.
            - **DO NOT use CSS classes.** Use inline 'style' attributes for ALL styling.
            - **Container:** Wrap everything in <div style="background-color: #111827; color: #f3f4f6; padding: 24px; border-radius: 12px; font-family: sans-serif; line-height: 1.6;">
            - **Title:** <h1 style="font-size: 2.5rem; font-weight: 800; background: linear-gradient(to right, #ec4899, #8b5cf6); -webkit-background-clip: text; color: transparent; margin-bottom: 20px;">...</h1>
            - **Headings:** <h2 style="font-size: 1.5rem; font-weight: 600; color: #fff; border-left: 4px solid #ec4899; padding-left: 12px; margin-top: 30px; margin-bottom: 15px;">...</h2>
            - **Paragraphs:** <p style="color: #d1d5db; margin-bottom: 15px;">...</p>
            - **Lists:** <ul style="color: #d1d5db; margin-bottom: 20px; padding-left: 20px;">...</ul>
            - **Highlights:** <span style="color: #fcd34d; font-weight: bold;">...</span>
            - **Blockquotes:** <blockquote style="border-left: 4px solid #8b5cf6; margin: 24px 0; font-style: italic; color: #9ca3af; background-color: rgba(255,255,255,0.05); padding: 16px; border-radius: 0 8px 8px 0;">...</blockquote>
            
            CONTENT GUIDELINES:
            - Use Google Search for facts.
            - Structure with Intro, Body, Conclusion.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }]
            }
        });

        return { 
            text: response.text || "Generating blog...", 
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
        };
    }

    // ... existing vision_scan ...
    if (action === 'vision_scan') {
        // FAST, PASSIVE SCAN MODE
        const parts: any[] = [{ text: `
            Identify the primary subject in this view. Return ONLY 3-5 words describing it. 
            Example: "Laptop on a wooden table" or "A red sports car".
            Do not use markdown. Do not be verbose.
        ` }];
        
        if (imageInput) {
            const base64Data = imageInput.split(',')[1];
            const mimeType = imageInput.split(';')[0].split(':')[1];
            parts.push({ inlineData: { data: base64Data, mimeType } });
        } else {
             return { text: "Blind" };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });
        
        return { text: response.text || "Analyzing..." };
    }

    // ... existing smart_measure ...
    if (action === 'smart_measure') {
        const parts: any[] = [{ text: `
            ACT AS A UNIVERSAL REALITY SCANNER (Project Astra Style).
            USER QUERY: "${input}"
            
            MISSION: Analyze the image deeply. Identify objects, read text, estimate measurements, or explain context.
            
            FORMAT REQUIREMENTS (Clean HTML for HUD):
            - Return ONLY HTML.
            - **Container:** <div style="background-color: rgba(0,0,0,0.6); color: #fff; padding: 20px; border-radius: 20px; font-family: sans-serif; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);">
            - **Header:** <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; opacity: 0.7; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;"> <span>⚡ INTELLIGENT VISION</span> </div>
            - **Main Answer:** <h2 style="font-size: 1.2rem; font-weight: 500; margin-bottom: 10px; line-height: 1.4;">...</h2>
            - **Details:** <p style="font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.6;">...</p>
            
            TOOLS:
            - **Google Maps:** Use Lat/Lng to identify location context if provided.
            - **Google Search:** Find prices, history, facts.
        ` }];

        if (imageInput) {
            const base64Data = imageInput.split(',')[1];
            const mimeType = imageInput.split(';')[0].split(':')[1];
            parts.push({ inlineData: { data: base64Data, mimeType } });
        } else {
            return { text: "No visual feed available." };
        }
        
        let toolConfig: any = undefined;
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
            contents: { parts },
            config: {
                tools: [{ googleSearch: {} }, { googleMaps: {} }],
                toolConfig: toolConfig
            }
        });

        return { 
            text: response.text || "Scan complete.", 
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
        };
    }

    // --- NEW HANDLER: LIVE VASTU ---
    if (action === 'live_vastu') {
        if (!location) return { text: "⚠️ Location is required for Live Vastu Compass. Please enable GPS." };

        const parts: any[] = [{ text: `
            ACT AS A VASTU SHASTRA EXPERT WITH SATELLITE VISION.
            
            USER LOCATION: Lat ${location.latitude}, Lng ${location.longitude}.
            USER NOTES: "${input}"
            
            MISSION:
            1. Use Google Maps to identify the exact address and orient yourself (North, East, etc.).
            2. Analyze the surroundings using your knowledge of the map (Are there water bodies, hospitals, temples, or heavy structures nearby?).
            3. Apply Vastu Principles to this specific coordinate.
            4. Is this location auspicious (Shubh)?
            
            FORMAT REQUIREMENTS (HTML):
            - Return ONLY HTML.
            - **Container:** <div style="background-color: #312e81; color: #e0e7ff; padding: 24px; border-radius: 12px; font-family: sans-serif; border: 1px solid #6366f1;">
            - **Header:** <h1 style="font-size: 1.8rem; font-weight: bold; color: #fbbf24; text-align: center; margin-bottom: 20px;">🧭 Live Vastu Compass</h1>
            - **Location:** <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem; text-align: center;">📍 Analysis for: [Insert Detected Address]</div>
            - **Vastu Score:** <div style="font-size: 2rem; font-weight: 800; text-align: center; margin: 20px 0; color: #4ade80;">Score: X/10</div>
            - **Directions:** <h3 style="color: #c7d2fe; border-bottom: 1px solid #4f46e5; margin-top: 20px;">🌐 Directional Energy</h3>
            - **Points:** <ul style="padding-left: 20px; line-height: 1.6; color: #d1d5db;">...</ul>
            - **Verdict:** <p style="font-weight: bold; text-align: center; background: #4338ca; padding: 10px; border-radius: 8px; margin-top: 20px;">...</p>
        ` }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                      latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                      }
                    }
                }
            }
        });

        return { 
            text: response.text || "Analyzing Vastu energy...", 
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
        };
    }

    // ... existing vastu_scan ...
    if (action === 'vastu_scan') {
        const parts: any[] = [{ text: `
            ACT AS A VASTU SHASTRA ARCHITECT EXPERT.
            USER INPUT: "${input}"
            
            MISSION: Analyze the floor plan/image or description.
            
            FORMAT REQUIREMENTS (INLINE CSS):
            - Return ONLY HTML.
            - **Container:** <div style="background-color: #312e81; color: #e0e7ff; padding: 24px; border-radius: 12px; font-family: sans-serif; border: 1px solid #6366f1;">
            - **Title:** <h1 style="font-size: 2rem; font-weight: bold; color: #818cf8; margin-bottom: 16px;">Vastu Analysis Report</h1>
            - **Score:** <div style="background-color: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 1.2rem; text-align: center; border: 1px solid #4f46e5;">Vastu Score: X/10</div>
            - **Headings:** <h3 style="color: #c7d2fe; font-size: 1.2rem; border-bottom: 1px solid #4f46e5; padding-bottom: 5px; margin-top: 20px;">...</h3>
            - **Lists:** <ul style="padding-left: 20px; margin-bottom: 15px;">...</ul>
            - **Defect:** <span style="color: #f87171; font-weight: bold;">❌ Defect:</span>
            - **Remedy:** <span style="color: #4ade80; font-weight: bold;">✅ Remedy:</span>
        ` }];

        if (imageInput) {
            const base64Data = imageInput.split(',')[1];
            const mimeType = imageInput.split(';')[0].split(':')[1];
            parts.push({ inlineData: { data: base64Data, mimeType } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });

        return { text: response.text || "Vastu Analysis complete." };
    }

    // ... existing ai_chef ...
    if (action === 'ai_chef') {
        const parts: any[] = [{ text: `
            ACT AS A MASTER CHEF.
            USER INPUT: "${input}"
            
            MISSION: Identify ingredients and suggest recipes.
            
            FORMAT REQUIREMENTS (INLINE CSS):
            - Return ONLY HTML.
            - **Container:** <div style="background-color: #064e3b; color: #ecfdf5; padding: 24px; border-radius: 12px; font-family: sans-serif; border: 1px solid #10b981;">
            - **Title:** <h1 style="font-size: 2rem; font-weight: bold; color: #34d399; margin-bottom: 16px; text-align: center;">👨‍🍳 Chef's Special</h1>
            - **Recipe Title:** <h2 style="font-size: 1.5rem; color: #d1fae5; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-top: 24px;">...</h2>
            - **Ingredients:** <ul style="background: rgba(0,0,0,0.2); padding: 15px 15px 15px 35px; border-radius: 8px; margin-bottom: 15px;">...</ul>
            - **Steps:** <ol style="padding-left: 20px; line-height: 1.6;">...</ol>
            - Use emojis for visuals.
        ` }];

        if (imageInput) {
            const base64Data = imageInput.split(',')[1];
            const mimeType = imageInput.split(';')[0].split(':')[1];
            parts.push({ inlineData: { data: base64Data, mimeType } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });

        return { text: response.text || "Chef is cooking..." };
    }

    // ... existing comic ...
    if (action === 'comic') {
        const { layout, genre, language, sourcePages, targetPages } = option || {};
        const topic = input;
        const prompt = `
            ACT AS A MASTER COMIC BOOK WRITER AND VISUAL DIRECTOR.
            
            **MISSION:** Create a compelling Comic Script & Storyboard.
            **TOPIC/STORY:** "${topic}"
            
            **PARAMETERS:**
            - **Layout Structure:** ${layout} (Strictly organize output for this format).
            - **Art Style/Genre:** ${genre} (Tone, shadows, character design).
            - **Language:** ${language} (For dialogue/monologue).
            - **Pacing:** Adapt a ${sourcePages}-page idea into ${targetPages} page(s).
            
            **OUTPUT FORMAT:**
            1. **Title:** (Creative & Stylish).
            2. **Panel Breakdown:**
               - **Panel X:** [Visual Description for Artist - Camera Angle, Lighting, Action]
               - **Characters:** [Expression/Pose]
               - **Text:** [Dialogue bubble / Caption box]
            
            **CREATIVE DIRECTION:**
            - Be cinematic. Use terms like "Close-up", "Wide Shot", "Worm's eye view".
            - If genre is 'manga', read right-to-left flow.
            - If 'noir', emphasize shadows.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        let comicImageUrl = undefined;
        try {
            const imagePrompt = `Comic book page, ${layout}, ${genre} style, ${topic}, masterpiece, extremely detailed, vibrant colors, dynamic composition, high quality render, graphic novel aesthetic`;
            const imgResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] }
            });
            for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    comicImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }
        } catch (e) {
            console.error("Comic visual generation failed", e);
        }

        return { text: response.text || "Generating Comic Script...", imageUrl: comicImageUrl };
    }
    
    // ... existing kids_mode ...
    if (action === 'kids_mode') {
         const mode = option?.mode || 'story'; // story, quiz, or validate_quiz
         let prompt = "";
         
         if (mode === 'story') {
             prompt = `
                ACT AS SPARKY, A CUTE ROBOT FRIEND FOR KIDS.
                TOPIC: "${input}"
                MISSION: Tell a very short, magical, and interactive story (max 4 sentences) where the CHILD is the main hero.
                TONE: Super excited, lots of emojis, very simple English/Hinglish.
                ENDING: Ask a question to continue the story!
             `;
         } else if (mode === 'quiz') {
             prompt = `
                ACT AS SPARKY, A TEACHER BOT.
                TOPIC: General Knowledge / Science / Animals.
                MISSION: Ask a fun, simple multiple-choice question for a 7-10 year old kid.
                FORMAT: Question first, then Options A, B, C.
                Use Emojis!
             `;
         } else if (mode === 'validate_quiz') {
             prompt = `
                ACT AS SPARKY.
                USER ANSWER: "${input}"
                MISSION: Check if the answer is correct to the previous question.
                IF CORRECT: Celebrate wildly! 🎉
                IF WRONG: Gently explain the right answer.
                Keep it very short.
             `;
         }

         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return { text: response.text || "Sparky is thinking..." };
    }
    
    // ... existing generic fallback ...
    const prompt = `Action: ${action}. Input: ${input}. Persona: ${persona.name}. Options: ${JSON.stringify(option)}`;
    
    // Fallback handler can also take images now if generic tools need them
    const parts: any[] = [{ text: prompt }];
    if (imageInput) {
        const base64Data = imageInput.split(',')[1];
        const mimeType = imageInput.split(';')[0].split(':')[1];
        parts.push({ inlineData: { data: base64Data, mimeType } });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    return { 
        text: response.text || "Processed.", 
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
    };
};
