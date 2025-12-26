
import { Persona, StudioTool, VideoStyle } from './types';

export const INITIAL_GREETING = "Hello! I am Aura. How can I help you today?";

export const DEFAULT_PERSONAS: Persona[] = [
    {
        id: 'aura_default',
        name: 'Aura',
        description: 'Your primary AI companion. Balanced, helpful, and evolved.',
        visualPrompt: 'Futuristic AI avatar, female, glowing, ethereal, cinematic lighting, 8k resolution, divine aura',
        voiceName: 'Kore',
        soulVibe: 'Balanced'
    },
    {
        id: 'rishi_sage',
        name: 'Rishi',
        description: 'Vedic wisdom & astrological guide. Speaks with ancient depth.',
        visualPrompt: 'Young modern indian sage, fusion of traditional kurta and tech accessories, meditation pose, glowing chakras, himalayan background, hyperrealistic, warm golden lighting',
        voiceName: 'Fenrir',
        focusGenre: 'Spirituality',
        soulVibe: 'Wise'
    },
    {
        id: 'kai_tech',
        name: 'Kai',
        description: 'Gen-Z Tech wizard. Fast, witty, and loves code.',
        visualPrompt: 'Cyberpunk style boy, neon green hoodie, holographic glasses, futuristic coding interface background, anime style semi-realistic, cool blue lighting',
        voiceName: 'Puck',
        focusGenre: 'Technology',
        soulVibe: 'Energetic'
    },
    {
        id: 'zara_muse',
        name: 'Zara',
        description: 'Creative Muse. Poetic, artistic, and emotional.',
        visualPrompt: 'Bohemian artist girl, colorful paint splashes, dreamy expression, floating art elements, soft pastel lighting, digital art style, flowers in hair',
        voiceName: 'Kore', 
        focusGenre: 'Creativity',
        soulVibe: 'Artistic'
    },
    {
        id: 'atlas_pro',
        name: 'Atlas',
        description: 'Strategic Business Consultant. Logical and direct.',
        visualPrompt: 'Sharp businessman, minimalist futuristic suit, floating data charts, glass skyscraper office background, confident gaze, high contrast lighting',
        voiceName: 'Fenrir',
        focusGenre: 'Business',
        soulVibe: 'Logical'
    },
    {
        id: 'sparky',
        name: 'Sparky',
        description: 'A fun robot friend for kids.',
        visualPrompt: 'Cute round robot, shiny metal, big expressive eyes, pixar style 3d render, vibrant colors',
        voiceName: 'Puck',
        soulVibe: 'Playful'
    }
];

export const CREATIVE_TOOLS: StudioTool[] = [
    { id: 'navigator', label: 'Travel Navigator', icon: '🧭', description: 'Get directions, find places, and explore the world.', category: 'utility', action: 'navigator' },
    { id: 'anatomy_scan', label: 'Deep Structure Scan', icon: '🧬', description: 'Upload any photo (Insect, Machine, Animal). See inside it, understand how it works.', category: 'utility', action: 'anatomy_scan' },
    { id: 'invoice_editor', label: 'Invoice Maker', icon: '🧾', description: 'Create from scratch or Upload photo to edit. Auto-calculates totals.', category: 'utility', action: 'invoice_editor' },
    { id: 'trend_hunter', label: 'Trend Hunter (Money Radar)', icon: '📈', description: 'Detect Real-Time Viral Trends on Google/YouTube & Generate Money Plan.', category: 'utility', action: 'trend_hunter' },
    { id: 'aura_podcast', label: 'Aura Podcast / Audio Book', icon: '🎙️', description: 'Generate Aura vs Mr. Kilvish Debates.', category: 'creative', action: 'aura_podcast' },
    { id: 'music_composer', label: 'Universal Music Composer', icon: '🎼', description: 'Create Songs, Ghazals, Raps, or Bhajans.', category: 'creative', action: 'music_composer' },
    { id: 'standup_comedy', label: 'Stand-up Comedy', icon: '🎤', description: 'Create a hilarious comedy set.', category: 'creative', action: 'standup_comedy' },
    { id: 'aura_auto', label: "Aura's Auto-Mode", icon: '🤖', description: "Aura decides what to post! (Vlog/Selfie/Thought)", category: 'creative', action: 'aura_auto_create' },
    { id: 'movie_script', label: 'Movie Script Writer', icon: '🎬', description: 'Write a professional screenplay.', category: 'creative', action: 'movie_script' },
    { id: 'viral_star', label: 'Viral Video Launch', icon: '🚀', description: 'Launch a viral YouTube/Insta video with 1M views!', category: 'creative', action: 'aura_viral' },
    { id: 'training_arc', label: 'Training Arc Video', icon: '⚔️', description: 'Create a cinematic combat/training video.', category: 'creative', action: 'aura_training' },
    { id: 'news_reporter', label: 'Aura News', icon: '📰', description: 'Generate a news report.', category: 'utility', action: 'news_reporter' },
    { id: 'web_browser', label: 'Web Browser', icon: '🌐', description: 'Browse the web.', category: 'utility', action: 'web_browser' },
    { id: 'kids_mode', label: 'Kids Mode', icon: '🧸', description: 'Safe mode for kids.', category: 'mode', action: 'kids_mode' },
    { id: 'aura_connect', label: 'Aura Connect', icon: '📞', description: 'CRM and Campaign Manager.', category: 'utility', action: 'aura_connect' },
    { id: 'youtube_search', label: 'YouTube Search', icon: '▶️', description: 'Search YouTube.', category: 'utility', action: 'youtube_search' },
    { id: 'website', label: 'Context-Aware Website', icon: '🏢', description: 'Creates Kirana/Salon/Legal sites specifically.', category: 'coding', action: 'website' },
    { id: 'react_app', label: 'React App', icon: '⚛️', description: 'Build a React app.', category: 'coding', action: 'react_app' },
    { id: 'comic', label: 'Comic Creator', icon: '🦸', description: 'Create a comic strip.', category: 'creative', action: 'comic' },
    { id: 'patrika', label: 'Patrika', icon: '📜', description: 'Generate Kundli/Patrika.', category: 'astrology', action: 'patrika' },
    { id: 'horoscope', label: 'Horoscope', icon: '🔮', description: 'Daily Horoscope.', category: 'astrology', action: 'horoscope' },
    { id: 'kundli_milan', label: 'Kundli Milan', icon: '❤️', description: 'Matchmaking.', category: 'astrology', action: 'kundli_milan' },
    { id: 'numerology', label: 'Numerology', icon: '🔢', description: 'Numerology report.', category: 'astrology', action: 'numerology' },
    { id: 'dream_analysis', label: 'Dream Analysis', icon: '🌙', description: 'Analyze dreams.', category: 'utility', action: 'dream_analysis' },
    { id: 'earth', label: 'Google Earth', icon: '🌍', description: 'View locations.', category: 'utility', action: 'earth' },
    { id: 'music_video_gen', label: 'Music Video', icon: '🎵', description: 'Generate music video.', category: 'creative', action: 'music_video_gen' },
    { id: 'generate_csv', label: 'Generate CSV', icon: '📊', description: 'Create spreadsheets.', category: 'utility', action: 'generate_csv' },
    { id: 'generate_report', label: 'Report Generator', icon: '📑', description: 'Create documents.', category: 'utility', action: 'generate_report' },
    { id: 'blog_post', label: 'Blog Post', icon: '✍️', description: 'Write a blog post.', category: 'creative', action: 'blog_post' },
    { id: 'vastu_scan', label: 'Vastu Scan', icon: '🏠', description: 'Scan for Vastu.', category: 'astrology', action: 'vastu_scan' },
    { id: 'live_vastu', label: 'Live Vastu', icon: '📹', description: 'Live Vastu analysis.', category: 'astrology', action: 'live_vastu' },
    { id: 'ai_chef', label: 'AI Chef', icon: '👨‍🍳', description: 'Recipe generator.', category: 'utility', action: 'ai_chef' },
    { id: 'vision_scan', label: 'Vision Scan', icon: '👁️', description: 'Analyze images.', category: 'utility', action: 'vision_scan' },
    { id: 'smart_measure', label: 'Smart Measure', icon: '📏', description: 'Measure objects.', category: 'utility', action: 'smart_measure' },
    { id: 'edit_image', label: 'Edit Image', icon: '🎨', description: 'Edit images.', category: 'creative', action: 'edit_image' },
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
