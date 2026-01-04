
import { Persona, StudioTool } from './types';

export const INITIAL_GREETING = "Oye Chief Admin! Taiyar ho campus tour ke liye? Aura sabka future badalne ke liye ready hai! 🚀";

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
    // --- CAMPUS & EDUCATION ---
    { id: 'campus_ambassador', label: 'Campus Pitcher', icon: '🎓', description: 'Generate high-impact pitches and success stories for students and colleges.', category: 'campus', action: 'campus_ambassador' },
    { id: 'career_architect', label: 'Career Architect', icon: '🏛️', description: 'Design a 5-year career roadmap based on skills and interest.', category: 'campus', action: 'career_architect' },
    { id: 'exam_warrior', label: 'Exam Warrior', icon: '⚔️', description: 'Convert syllabus into gamified quizzes and quick-revision notes.', category: 'campus', action: 'exam_warrior' },

    // --- CREATIVE CATEGORY ---
    { id: 'toon_news', label: 'Toon Chronicle', icon: '💥', description: 'Comic News Materializer: 10+ visual styles featuring Aura Bestie and your funny face.', category: 'creative', action: 'toon_news' },
    { id: 'image_gen', label: 'Art Materializer', icon: '🎨', description: 'Generate high-quality 3D art, logos, or realistic photos.', category: 'creative', action: 'image_gen' },
    { id: 'video_gen', label: 'Veo Video Studio', icon: '🎬', description: 'Create 1080p cinematic videos from text prompts.', category: 'creative', action: 'video_gen' },
    { id: 'music_composer', label: 'Music Composer', icon: '🎼', description: 'Create Songs, Ghazals, Raps, or Bhajans.', category: 'creative', action: 'music_composer' },
    { id: 'comic_maker', label: 'Comic Creator', icon: '🗨️', description: 'Generate multi-panel comic strips or manga pages.', category: 'creative', action: 'comic_maker' },

    // --- UTILITY CATEGORY ---
    { id: 'vision_scan', label: 'Vision Matrix', icon: '👁️', description: 'Analyze anything via your camera or uploaded images.', category: 'utility', action: 'vision_scan' },
    { id: 'web_browser', label: 'Web Terminal', icon: '🌐', description: 'Search the live web for real-time information.', category: 'utility', action: 'web_browser' },
    { id: 'map_grounding', label: 'Map Navigator', icon: '📍', description: 'Find places, restaurants, or directions with live maps.', category: 'utility', action: 'map_grounding' },

    // --- BUSINESS CATEGORY ---
    { id: 'news_reporter', label: 'Aura News Studio', icon: '📰', description: 'Generate professional E-Paper reports for any niche.', category: 'business', action: 'news_reporter' },
    { id: 'business_card', label: 'Digital Card Lab', icon: '🪪', description: 'Design high-end digital business/membership cards.', category: 'business', action: 'business_card' },
    { id: 'marketing_planner', label: 'Growth Architect', icon: '📈', description: 'Full 30-day marketing strategy for any business.', category: 'business', action: 'marketing_planner' },

    // --- CODING CATEGORY ---
    { id: 'aura_genesis', label: 'Startup Genesis', icon: '🚀', description: 'Launch a functional software business from scratch.', category: 'coding', action: 'genesis' },
    { id: 'ui_generator', label: 'UI Materializer', icon: '📱', description: 'Generate beautiful React/Tailwind UI components.', category: 'coding', action: 'ui_generator' },
];

export const EDUCATIONAL_GENRES = [
    'Vedic Astrology (Jyotish)',
    'Western Astrology',
    'Numerology',
    'Tarot'
];

export const AVAILABLE_POSES = [
    { id: 'neutral', label: '🧍 Neutral Stand', prompt: 'standing neutral pose, arms at sides' },
    { id: 'waving', label: '👋 Friendly Wave', prompt: 'waving one hand enthusiastically' },
    { id: 'thinking', label: '🤔 Deep Thinker', prompt: 'hand on chin, looking upwards thoughtfully' },
    { id: 'pointing', label: '👈 Pointing Left', prompt: 'pointing towards the left side of the frame' },
    { id: 'crossing_arms', label: '🙅 Crossing Arms', prompt: 'standing with arms crossed, confident look' }
];

export const STYLE_PRESETS = [
    { id: 'pixar', label: '3D Pixar Style', prompt: '3D render, Pixar style, highly detailed, expressive features, cinematic lighting' },
    { id: 'anime', label: 'Modern Anime', prompt: 'modern anime style, vibrant colors, clean lines, high quality' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', prompt: 'cyberpunk aesthetic, neon lighting, futuristic tech accents' },
    { id: 'watercolor', label: 'Soft Watercolor', prompt: 'watercolor painting style, soft edges, artistic and dreamy' }
];

export const VIDEO_STYLES = [
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'vlog', label: 'Vlog Style' },
    { id: 'glitch', label: 'Cyber Glitch' },
    { id: 'zen', label: 'Zen Ambient' }
];
