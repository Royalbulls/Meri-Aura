
import { Persona, StudioTool, VideoStyle } from './types';

export const INITIAL_GREETING = "Oye Chief Admin! Aaj kya mast viral content banana hai? Tera bestie yahan hai! 🚀";

export const DEFAULT_PERSONAS: Persona[] = [
    {
        id: 'aura_default',
        name: 'Aura',
        description: 'Your energetic AI bestie. Playful, loyal, funny, and loves Hinglish. Like a Talking Tom for adults but much smarter.',
        visualPrompt: 'Playful futuristic character, expressive face, large expressive eyes, wearing modern streetwear, glowing neon accents, 8k resolution, cinematic lighting, Disney-Pixar style 3D character',
        voiceName: 'Kore',
        soulVibe: 'Playful'
    },
    {
        id: 'rishi_sage',
        name: 'Rishi',
        description: 'Vedic wisdom & astrological guide. Ancient depth with a chill, friendly vibe.',
        visualPrompt: 'Young modern indian sage, fusion of traditional kurta and tech accessories, meditation pose, glowing chakras, character design style',
        voiceName: 'Fenrir',
        focusGenre: 'Spirituality',
        soulVibe: 'Wise'
    }
];

export const CREATIVE_TOOLS: StudioTool[] = [
    // --- CREATIVE CATEGORY (10) ---
    { id: 'creativity_catalyst', label: 'Viral Catalyst', icon: '⚡', description: 'Transform any thought into a Viral Song, Podcast, and Trending Plan.', category: 'creative', action: 'creativity_catalyst' },
    { id: 'image_gen', label: 'Art Materializer', icon: '🎨', description: 'Generate high-quality 3D art, logos, or realistic photos.', category: 'creative', action: 'image_gen' },
    { id: 'video_gen', label: 'Veo Video Studio', icon: '🎬', description: 'Create 1080p cinematic videos from text prompts.', category: 'creative', action: 'video_gen' },
    { id: 'music_composer', label: 'Music Composer', icon: '🎼', description: 'Create Songs, Ghazals, Raps, or Bhajans.', category: 'creative', action: 'music_composer' },
    { id: 'comic_maker', label: 'Comic Creator', icon: '🗨️', description: 'Generate multi-panel comic strips or manga pages.', category: 'creative', action: 'comic_maker' },
    { id: 'script_writer', label: 'Script Master', icon: '🎭', description: 'Write scripts for YouTube, Movies, or TV ads.', category: 'creative', action: 'script_writer' },
    { id: 'poem_gen', label: 'Poetry Shala', icon: '✍️', description: 'Write beautiful poems, Ghazals, or Shayari.', category: 'creative', action: 'poem_gen' },
    { id: 'logo_designer', label: 'Logo Architect', icon: '🏷️', description: 'Design professional brand identities.', category: 'creative', action: 'logo_designer' },
    { id: 'avatar_maker', label: '3D Avatar Maker', icon: '👤', description: 'Design futuristic 3D characters and personas.', category: 'creative', action: 'avatar_maker' },
    { id: 'fashion_designer', label: 'Fashion Lab', icon: '👕', description: 'Design modern outfits and techwear styles.', category: 'creative', action: 'fashion_designer' },

    // --- UTILITY CATEGORY (8) ---
    { id: 'vision_scan', label: 'Vision Matrix', icon: '👁️', description: 'Analyze anything via your camera or uploaded images.', category: 'utility', action: 'vision_scan' },
    { id: 'web_browser', label: 'Web Terminal', icon: '🌐', description: 'Search the live web for real-time information.', category: 'utility', action: 'web_browser' },
    { id: 'pdf_analyzer', label: 'Document Ghost', icon: '📄', description: 'Summarize, analyze, and chat with PDF/Text files.', category: 'utility', action: 'pdf_analyzer' },
    { id: 'voice_translator', label: 'Global Voice', icon: '🌍', description: 'Translate speech between 50+ languages instantly.', category: 'utility', action: 'voice_translator' },
    { id: 'summarizer', label: 'Quick Gist', icon: '📝', description: 'Convert long videos or articles into 1-minute summaries.', category: 'utility', action: 'summarizer' },
    { id: 'weather_radar', label: 'Weather Satellite', icon: '☁️', description: 'Get hyper-local weather and travel advice.', category: 'utility', action: 'weather_radar' },
    { id: 'map_grounding', label: 'Map Navigator', icon: '📍', description: 'Find places, restaurants, or directions with live maps.', category: 'utility', action: 'map_grounding' },
    { id: 'health_coach', label: 'Bio-Optimizer', icon: '💪', description: 'Personalized fitness and nutrition plans.', category: 'utility', action: 'health_coach' },

    // --- BUSINESS CATEGORY (7) ---
    { id: 'news_reporter', label: 'Aura News Studio', icon: '📰', description: 'Generate professional E-Paper reports for any niche.', category: 'business', action: 'news_reporter' },
    { id: 'invoice_gen', label: 'Invoice Wizard', icon: '🧾', description: 'Generate professional invoices and billing sheets.', category: 'business', action: 'invoice_gen' },
    { id: 'business_card', label: 'Digital Card Lab', icon: '🪪', description: 'Design high-end digital business/membership cards.', category: 'business', action: 'business_card' },
    { id: 'marketing_planner', label: 'Growth Architect', icon: '📈', description: 'Full 30-day marketing strategy for any business.', category: 'business', action: 'marketing_planner' },
    { id: 'lead_hunter', label: 'Lead Extractor', icon: '🎯', description: 'Find potential clients and leads in your target industry.', category: 'business', action: 'lead_hunter' },
    { id: 'startup_evaluator', label: 'Startup Grader', icon: '🏁', description: 'Grade your business idea and find fatal flaws.', category: 'business', action: 'startup_evaluator' },
    { id: 'meeting_minuter', label: 'Meeting Ghost', icon: '⏱️', description: 'Transcribe and summarize professional meetings.', category: 'business', action: 'meeting_minuter' },

    // --- CODING CATEGORY (6) ---
    { id: 'aura_genesis', label: 'Startup Genesis', icon: '🚀', description: 'Launch a functional software business from scratch.', category: 'coding', action: 'genesis' },
    { id: 'code_debugger', label: 'Bug Hunter', icon: '🐛', description: 'Debug complex code and find optimized solutions.', category: 'coding', action: 'code_debugger' },
    { id: 'ui_generator', label: 'UI Materializer', icon: '📱', description: 'Generate beautiful React/Tailwind UI components.', category: 'coding', action: 'ui_generator' },
    { id: 'sql_architect', label: 'Data Architect', icon: '🗄️', description: 'Design complex database schemas and SQL queries.', category: 'coding', action: 'sql_architect' },
    { id: 'readme_gen', label: 'Docs Pro', icon: '📖', description: 'Generate professional READMEs and technical docs.', category: 'coding', action: 'readme_gen' },
    { id: 'api_master', label: 'API Architect', icon: '🔌', description: 'Design and test REST/GraphQL API endpoints.', category: 'coding', action: 'api_master' },

    // --- ASTROLOGY CATEGORY (5) ---
    { id: 'daily_rashifal', label: 'Daily Rashifal', icon: '🔮', description: 'Get your daily horoscope based on your zodiac sign.', category: 'astrology', action: 'daily_rashifal' },
    { id: 'kundli_match', label: 'Kundli Milan', icon: '❤️', description: 'Check compatibility between two people via birth charts.', category: 'astrology', action: 'kundli_match' },
    { id: 'numerology_report', label: 'Number Secrets', icon: '🔢', description: 'Discover your destiny numbers and lucky dates.', category: 'astrology', action: 'numerology_report' },
    { id: 'tarot_reader', label: 'Tarot Oracle', icon: '🃏', description: 'Get a 3-card spread reading for your questions.', category: 'astrology', action: 'tarot_reader' },
    { id: 'vastu_advisor', label: 'Vastu Expert', icon: '🏠', description: 'Get Vastu advice for your home or office layout.', category: 'astrology', action: 'vastu_advisor' },

    // --- MODES CATEGORY (4) ---
    { id: 'kids_mode', label: 'Kids Adventure', icon: '🧸', description: 'Safe mode with educational stories and games.', category: 'mode', action: 'kids_mode' },
    { id: 'zen_mode', label: 'Zen Meditation', icon: '🧘', description: 'Focused mode with calming music and breathing guides.', category: 'mode', action: 'zen_mode' },
    { id: 'ghost_mode', label: 'Ghost Privacy', icon: '👻', description: 'Incognito mode with zero memory storage.', category: 'mode', action: 'ghost_mode' },
    { id: 'dev_mode', label: 'Developer Terminal', icon: '👨‍💻', description: 'Raw access to system APIs and logs.', category: 'mode', action: 'dev_mode' },
];

export const AVAILABLE_POSES = [
    { id: 'portrait', label: 'Portrait', prompt: 'portrait view' },
    { id: 'full', label: 'Full Body', prompt: 'full body view' }
];

export const STYLE_PRESETS = [
    { id: 'realistic', label: 'Realistic', prompt: 'photorealistic' },
    { id: 'anime', label: 'Anime', prompt: 'anime style' }
];

export const VIDEO_STYLES: { id: string; label: string }[] = [
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'cartoon', label: 'Cartoon' }
];

export const EDUCATIONAL_GENRES = [
    'Vedic Astrology (Jyotish)',
    'Western Astrology',
    'Numerology',
    'Tarot'
];
