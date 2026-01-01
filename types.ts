
export interface Project {
    id: string;
    name: string;
    description: string;
    code: string;
    author: string;
    timestamp: number;
    category: string;
    thumbnail?: string;
}

export interface CampusStat {
    id: string;
    label: string;
    value: string;
    trend: string;
    color: string;
}

export interface BusinessProfile {
    id: string;
    name: string;
    type: string; 
    tagline: string;
    address: string;
    themeColor: string; 
    ownerName: string;
    services: string[]; 
    contactEmail?: string;
    contactPhone?: string;
}

export interface CustomerJourneyPoint {
    id: string;
    icon: string; 
    title: string; 
    timestamp: number;
    details?: string; 
}

export interface Contact {
    id: string;
    businessId: string; 
    type: 'personal' | 'business'; 
    source?: 'offline' | 'social' | 'referral' | 'direct'; 
    journey: CustomerJourneyPoint[]; 
    name: string;
    companyName?: string; 
    role?: string; 
    phone: string;
    email?: string;
    notes: string;
    tags: string[];
    membershipCardHtml?: string; 
    businessCardHtml?: string; 
    joinedDate: number;
}

export interface MarketingCampaign {
    id: string;
    businessId: string;
    name: string; 
    channel: 'offline' | 'social' | 'email'; 
    type: 'whatsapp' | 'website' | 'call';
    target: string; 
    triggerMessage?: string; 
    generatedLink: string;
    qrCodeUrl: string;
    createdAt: number;
    scansLogged: number; 
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
    | 'genesis_result'
    | 'trend_report';

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
    codeSnippet?: string;
    groundingMetadata?: any;
    genesisSteps?: GenesisStep[];
    feedback?: 'like' | 'dislike' | null;
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
    isPublic?: boolean;
    isEncrypted?: boolean;
}

export interface MemoryVector {
    id: string;
    text: string;
    vector: number[];
    timestamp: number;
}

export interface VideoStyle {
    id: string;
    label: string;
}
