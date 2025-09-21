// Educational content types for the Water Monitoring application

export interface EducationalContent {
  _id?: string;
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  type: ContentType;
  difficultyLevel: DifficultyLevel;
  mediaUrl?: string;
  thumbnailUrl?: string;
  content: string; // Rich text content (HTML or Markdown)
  tags: string[];
  estimatedReadTime: number; // in minutes
  duration?: number; // for videos, in seconds
  language: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  bookmarkCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  prerequisites?: string[]; // IDs of prerequisite content
  learningObjectives: string[];
  downloadableResources?: DownloadableResource[];
}

export type ContentCategory = 
  | 'water_safety'
  | 'disease_prevention' 
  | 'emergency_response'
  | 'health_monitoring'
  | 'community_guidelines'
  | 'water_treatment'
  | 'hygiene_practices';

export type ContentType = 
  | 'article'
  | 'video'
  | 'image_guide'
  | 'interactive'
  | 'infographic'
  | 'checklist'
  | 'quiz'
  | 'step_by_step';

export type DifficultyLevel = 
  | 'beginner'
  | 'intermediate' 
  | 'advanced';

export interface DownloadableResource {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number; // in bytes
  description?: string;
}

export interface ContentFilter {
  category?: ContentCategory[];
  type?: ContentType[];
  difficultyLevel?: DifficultyLevel[];
  tags?: string[];
  searchQuery?: string;
  author?: string;
  language?: string;
  isFeatured?: boolean;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'title' | 'estimatedReadTime';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface UserProgress {
  _id?: string;
  userId: string;
  contentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100 percentage
  timeSpent: number; // in seconds
  lastAccessed: Date;
  completedAt?: Date;
  bookmarked: boolean;
  rating?: number; // 1-5 stars
  notes?: string;
}

export interface ContentStats {
  totalContent: number;
  contentByCategory: Record<ContentCategory, number>;
  contentByType: Record<ContentType, number>;
  contentByDifficulty: Record<DifficultyLevel, number>;
  totalViews: number;
  totalBookmarks: number;
  averageRating: number;
  popularTags: Array<{ tag: string; count: number }>;
}

export interface LearningPath {
  _id?: string;
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  estimatedDuration: number; // in minutes
  difficultyLevel: DifficultyLevel;
  contentIds: string[]; // Ordered list of content IDs
  prerequisites?: string[]; // IDs of prerequisite paths
  createdAt: Date;
  updatedAt: Date;
  enrollmentCount: number;
  completionRate: number; // percentage of users who complete
  isPublished: boolean;
}

export interface UserEnrollment {
  _id?: string;
  userId: string;
  learningPathId: string;
  enrolledAt: Date;
  currentContentIndex: number;
  completedContentIds: string[];
  overallProgress: number; // 0-100 percentage
  estimatedTimeRemaining: number; // in minutes
  lastAccessed: Date;
  completedAt?: Date;
  certificate?: {
    id: string;
    issuedAt: Date;
    certificateUrl: string;
  };
}

export interface ContentSearchResult {
  content: EducationalContent[];
  totalCount: number;
  facets: {
    categories: Array<{ category: ContentCategory; count: number }>;
    types: Array<{ type: ContentType; count: number }>;
    difficulties: Array<{ difficulty: DifficultyLevel; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
  suggestions?: string[]; // Search suggestions for no results
}

// API Request/Response types
export interface CreateContentRequest {
  title: string;
  description: string;
  category: ContentCategory;
  type: ContentType;
  difficultyLevel: DifficultyLevel;
  content: string;
  tags: string[];
  estimatedReadTime: number;
  duration?: number;
  language: string;
  author: string;
  learningObjectives: string[];
  prerequisites?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {
  id: string;
}

export interface ContentResponse {
  success: boolean;
  content?: EducationalContent;
  error?: string;
}

export interface ContentListResponse {
  success: boolean;
  data?: ContentSearchResult;
  error?: string;
}

export interface ProgressUpdateRequest {
  contentId: string;
  progress: number;
  timeSpent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  rating?: number;
  notes?: string;
}

export interface BookmarkRequest {
  contentId: string;
  bookmarked: boolean;
}

// Content validation schemas (for use with Zod)
export const CONTENT_CATEGORIES: ContentCategory[] = [
  'water_safety',
  'disease_prevention',
  'emergency_response',
  'health_monitoring',
  'community_guidelines',
  'water_treatment',
  'hygiene_practices'
];

export const CONTENT_TYPES: ContentType[] = [
  'article',
  'video',
  'image_guide',
  'interactive',
  'infographic',
  'checklist',
  'quiz',
  'step_by_step'
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced'
];

// Helper functions
export const getCategoryIcon = (category: ContentCategory): string => {
  const icons: Record<ContentCategory, string> = {
    water_safety: '🚰',
    disease_prevention: '🦠',
    emergency_response: '🚨',
    health_monitoring: '📊',
    community_guidelines: '🏘️',
    water_treatment: '🧪',
    hygiene_practices: '🧼'
  };
  return icons[category];
};

export const getTypeIcon = (type: ContentType): string => {
  const icons: Record<ContentType, string> = {
    article: '📄',
    video: '🎥',
    image_guide: '🖼️',
    interactive: '🎮',
    infographic: '📊',
    checklist: '✅',
    quiz: '❓',
    step_by_step: '📋'
  };
  return icons[type];
};

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  const colors: Record<DifficultyLevel, string> = {
    beginner: '#10b981', // green
    intermediate: '#f59e0b', // amber
    advanced: '#ef4444' // red
  };
  return colors[difficulty];
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

export const formatReadTime = (minutes: number): string => {
  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
};