
export interface BusinessProfile {
    id: string;
    name: string;
    type: string; // e.g., 'Retail', 'Agency', 'Medical'
    tagline: string;
    address: string;
    themeColor: string; // Tailwind color class e.g., 'blue', 'pink'
    ownerName: string;
    services: string[]; // List of services offered (e.g., "Haircut", "Audit", "Repair")
    contactEmail?: string;
    contactPhone?: string;
}

export interface CustomerJourneyPoint {
    id: string;
    icon: string; // e.g. "🔍", "📱", "💰"
    title: string; // e.g. "Scanned QR Code"
    timestamp: number;
    details?: string; // e.g. "Summer Flyer Campaign"
}

export interface Contact {
    id: string;
    businessId: string; // Links contact to a specific business
    type: 'personal' | 'business'; // B2C vs B2B
    source?: 'offline' | 'social' | 'referral' | 'direct'; // Where did they come from?
    journey: CustomerJourneyPoint[]; // The tracked history
    name: string;
    companyName?: string; // For B2B
    role?: string; // For B2B
    phone: string;
    email?: string;
    notes: string;
    tags: string[];
    membershipCardHtml?: string; // HTML code for the generated card
    businessCardHtml?: string; // HTML code for B2B card
    joinedDate: number;
}

export interface MarketingCampaign {
    id: string;
    businessId: string;
    name: string; // e.g. "Summer Flyer"
    channel: 'offline' | 'social' | 'email'; // Where is this placed?
    type: 'whatsapp' | 'website' | 'call';
    target: string; // Phone number or URL
    triggerMessage?: string; // For WhatsApp (e.g. "I saw the poster")
    generatedLink: string;
    qrCodeUrl: string;
    createdAt: number;
    scansLogged: number; // Manual counter for tracking
}

export interface BusinessInsight {
    sentimentScore: number; // 0 to 100
    topKeywords: string[];
    recentReviewsSummary: string;
    searchIntent: string; // "Looking for discounts", "Emergency service", etc.
    competitorMove: string;
    lastUpdated: number;
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    visualPrompt: string;
    voiceName: string;
    isCustom?: boolean;
    xp?: number;
    level?: number;
    focusGenre?: string;
    careerPath?: string;
    soulVibe?: string;
}

export interface StudioTool {
    id: string;
    label: string;
    icon: string;
    description: string;
    category: string;
    action: string;
}

export interface VideoStyle {
    id: string;
    label: string;
}

export enum Sender {
    User = 'user',
    Bot = 'bot'
}

export type ContentType = 
    | 'text' 
    | 'html' 
    | 'react_app' 
    | 'comic' 
    | 'patrika' 
    | 'horoscope' 
    | 'kundli_milan' 
    | 'numerology' 
    | 'blog' 
    | 'earth' 
    | 'music_visual' 
    | 'spreadsheet' 
    | 'document' 
    | 'viral_post' 
    | 'script' 
    | 'file_attachment' 
    | 'genesis_result'
    | 'trend_report'
    | 'invoice'
    | 'membership_card'
    | 'business_card';

export interface ViralMetadata {
    title: string;
    hashtags: string[];
    initialViews?: number;
    comments: Array<{ user: string; text: string }>;
}

export interface GenesisStep {
    id: string;
    type: 'text' | 'image' | 'video' | 'code' | 'audio';
    label: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: string;
    prompt?: string;
}

export interface Message {
    id: string;
    text: string;
    sender: Sender;
    timestamp: Date;
    contentType?: ContentType;
    attachmentUrl?: string;
    videoUrl?: string;
    audioUrl?: string; // Added for Viral Video (Audio track)
    codeSnippet?: string;
    groundingMetadata?: any;
    directionsUrl?: string;
    viralMetadata?: ViralMetadata;
    genesisSteps?: GenesisStep[];
    fileName?: string;
    earthLocation?: any;
    feedback?: 'positive' | 'negative';
}

export interface NeuralContext {
    userIdentity: string;
    businessProfile: string;
    brandVoice: string;
    antiPatterns: string;
}

export interface AvatarState {
    imageUrl: string | null;
    videoUrl: string | null;
    isLoading: boolean;
    isTalking: boolean;
    userPhotoUrl: string | null;
}

export interface AvatarLayout {
    scale: number;
    x: number;
    y: number;
}

export interface VoiceSettings {
    speed: number;
    pitch: number;
}

export interface PersonalitySettings {
    playfulness: number;
    empathy: number;
    directness: number;
}

export interface AstrologyDetails {
    name: string;
    dob: string;
    time: string;
    place: string;
    gender: 'Female' | 'Male' | 'Cosmic';
    selectedGenre: string;
}

export interface StoredFile {
    id: string;
    name: string;
    type: string;
    data: string;
    timestamp: number;
}

export interface BrowserState {
    isOpen: boolean;
    url: string;
    advice: string;
    isLoadingAdvice: boolean;
}

export type ComicLayout = '1-panel' | '3-panel-strip' | '4-panel-grid' | 'manga-page';
export type ComicGenre = 'superhero' | 'manga' | 'noir' | 'retro' | 'cyberpunk' | 'fantasy' | 'comedy';
export type ComicLanguage = 'english' | 'hindi' | 'hinglish' | 'japanese' | 'spanish';

export interface MemoryVector {
    id: string;
    text: string;
    vector: number[];
    timestamp: number;
}
