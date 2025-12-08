
export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export type ContentType = 'text' | 'blog' | 'song' | 'plan' | 'video' | 'html' | 'comic' | 'patrika' | 'horoscope' | 'earth' | 'code' | 'strategy' | 'music_visual' | 'social_post' | 'spreadsheet' | 'document' | 'react_app' | 'file_attachment';

// New: For storing user files securely
export interface StoredFile {
    id: string;
    name: string;
    type: string; // mime type
    data: string; // base64
    timestamp: number;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  groundingMetadata?: any; // For Google Maps/Search sources
  attachmentUrl?: string; // For generated selfies/images/comics OR retrieved files
  videoUrl?: string; // For Veo generated video
  contentType?: ContentType; // To style blogs/songs/code/comics differently
  codeSnippet?: string; // For HTML/Code generation
  earthLocation?: string; // For Google Earth deep links
  rememberedContext?: string; // New: To show what AI remembered from long-term memory
  feedback?: 'positive' | 'negative' | null; // New: Feedback loop rating
  directionsUrl?: string; // For Google Maps Navigation links
  fileId?: string; // New: Reference to a stored file in IndexedDB
  fileName?: string; // New: Display name of the file
}

export interface ChatResponse {
  text: string;
  groundingMetadata?: any;
  directionsUrl?: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string; // For text generation context
  visualPrompt: string; // For image generation
  voiceName: string; // For TTS
  isCustom?: boolean; // Flag for user-generated cosmic personas
  careerPath?: string; // E.g. "Engineer", "Politician"
  soulVibe?: string; // E.g. "Fiery Martian Energy"
  gender?: string;
  focusGenre?: string;
}

export interface AvatarState {
  imageUrl: string | null;
  videoUrl: string | null; // For Veo generated video
  userPhotoUrl?: string | null; // The user's uploaded photo for collabs
  isLoading: boolean;
  isTalking: boolean;
  error?: string; // Track generation errors
}

export interface BrowserState {
    isOpen: boolean;
    url: string;
    advice: string; // The AI's commentary on the site
    isLoadingAdvice: boolean;
}

export interface VoiceSettings {
  speed: number;
  pitch: number; // In semitones (-12 to 12)
}

export interface PersonalitySettings {
    playfulness: number; // 0-100
    empathy: number; // 0-100
    directness: number; // 0-100
}

export interface AvatarLayout {
  scale: number;
  x: number;
  y: number;
}

export interface AstrologyDetails {
  name: string;
  dob: string;
  time: string;
  place: string;
  gender: 'Male' | 'Female' | 'Cosmic'; // New
  selectedGenre: string; // New: 90+ options
}

export type VideoStyle = 'cinematic' | 'bollywood' | 'hollywood' | 'vlog' | 'documentary' | 'spiritual' | 'thriller' | 'action' | 'scifi' | 'music_video';

export type ToolCategory = 'dev' | 'business' | 'creative' | 'cosmic' | 'life' | 'custom' | 'office' | 'kids';

export interface StudioTool {
    id: string;
    label: string;
    icon: string;
    description: string;
    category: ToolCategory;
    action: 'horoscope' | 'patrika' | 'comic' | 'website' | 'ebook' | 'earth' | 'react_app' | 'python_script' | 'sql_query' | 'marketing_plan' | 'pitch_deck' | 'legal_contract' | 'gcp_arch' | 'ai_studio_prompt' | 'persona_3d' | 'full_stack_app' | 'pro_image' | 'edit_image' | 'youtube_vlog' | 'blog_post' | 'music_video_gen' | 'social_media_kit' | 'press_release' | 'email_campaign' | 'ai_chef' | 'budget_buddy' | 'news_curator' | 'language_tutor' | 'diy_tool' | 'vision_scan' | 'link_summary' | 'youtube_search' | 'web_browser' | 'execution_roadmap' | 'navigation' | 'check_location' | 'resume_review' | 'workout_plan' | 'study_notes' | 'idea_validator' | 'dream_analysis' | 'code_refactor' | 'gift_ideas' | 'travel_planner' | 'regex_gen' | 'kundli_milan' | 'numerology' | 'vastu_scan' | 'live_vastu' | 'generate_csv' | 'generate_report' | 'generate_doc' | 'smart_measure' | 'kids_mode';
}

export interface CustomTool {
    id: string;
    name: string;
    prompt: string;
    icon: string;
    createdAt: number;
}

export interface AppTemplate {
    id: string;
    label: string;
    prompt: string;
}

// For Vector Database
export interface MemoryVector {
    id: string;
    text: string;
    vector: number[];
    timestamp: number;
}

// Banking Style Auth
export interface IdentityState {
    accountNumber: string; // 12 digit unique ID
    pin: string; // 4-6 digit pin
    name: string;
    isLoggedIn: boolean;
    visualDescription?: string; // New: AI's memory of user's face
    voicePhrase?: string; // New: Voice auth phrase
}

// Kids Mode Types
export interface KidsState {
    dreamCoins: number;
    inventory: string[];
}

// NEW: Comic Specific Types
export type ComicLayout = '1-panel' | '3-panel-strip' | '4-panel-grid' | 'manga-page';
export type ComicGenre = 'superhero' | 'manga' | 'noir' | 'retro' | 'cyberpunk' | 'fantasy' | 'comedy';
export type ComicLanguage = 'english' | 'hindi' | 'hinglish' | 'japanese' | 'spanish';
export interface ComicOptions {
    layout: ComicLayout;
    genre: ComicGenre;
    language: ComicLanguage;
    sourcePages: number;
    targetPages: number;
}
