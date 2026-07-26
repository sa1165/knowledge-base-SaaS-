export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  status: 'published' | 'draft';
  views: number;
  helpfulCount: number;
  unhelpfulCount: number;
  readTimeMinutes: number;
  tags: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  color: string;
  articleCount?: number;
}

export interface PortalSettings {
  portalName: string;
  tagline: string;
  logoIcon: string;
  accentColor: string;
  primaryDomain: string;
  allowPublicFeedback: boolean;
  enableAiAssistant: boolean;
  contactEmail: string;
}

export interface AnalyticsMetric {
  totalViews: number;
  helpfulPercentage: number;
  totalArticles: number;
  totalCategories: number;
  topSearchTerms: { term: string; count: number; failed: boolean }[];
  viewsOverTime: { date: string; views: number }[];
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: { title: string; slug: string; categoryName: string }[];
  timestamp: string;
}
