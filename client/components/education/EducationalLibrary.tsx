import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookmarkPlus, 
  BookmarkCheck, 
  Play, 
  FileText, 
  Image, 
  CheckSquare, 
  BarChart3, 
  Clock, 
  User,
  Star,
  ArrowRight,
  Grid3X3,
  List
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  EducationalContent, 
  ContentFilter,
  ContentCategory,
  ContentType,
  DifficultyLevel,
  getCategoryIcon,
  getTypeIcon,
  getDifficultyColor,
  formatDuration
} from '../../../shared/types/educational-content';

interface EducationalContentResponse {
  content: EducationalContent[];
  totalCount: number;
  facets: {
    categories: { category: string; count: number }[];
    types: { type: string; count: number }[];
    difficulties: { difficulty: string; count: number }[];
    tags: { tag: string; count: number }[];
  };
}

interface EducationalLibraryProps {
  onContentSelect?: (content: EducationalContent) => void;
}

export const EducationalLibrary: React.FC<EducationalLibraryProps> = ({
  onContentSelect
}) => {
  // Fallback content for when API is not available
  const fallbackContent: EducationalContent[] = [
    {
      id: "demo_1",
      title: "Water Safety Basics",
      description: "Learn the fundamental principles of water safety and contamination prevention.",
      category: "water_safety",
      type: "article",
      difficultyLevel: "beginner",
      content: "Basic water safety content...",
      thumbnailUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
      tags: ["water safety", "health", "prevention"],
      estimatedReadTime: 5,
      language: "en",
      author: "Water Safety Expert",
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 245,
      bookmarkCount: 23,
      learningObjectives: ["Understand basic water safety principles"],
      isPublished: true,
      isFeatured: true
    },
    {
      id: "demo_2", 
      title: "Emergency Water Purification",
      description: "Step-by-step guide to purifying water during emergencies.",
      category: "emergency_response",
      type: "step_by_step",
      difficultyLevel: "intermediate",
      content: "Emergency purification steps...",
      thumbnailUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop",
      tags: ["emergency", "purification", "survival"],
      estimatedReadTime: 8,
      language: "en",
      author: "Emergency Response Team",
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 189,
      bookmarkCount: 34,
      learningObjectives: ["Master emergency water purification techniques"],
      isPublished: true,
      isFeatured: false
    }
  ];

  const [content, setContent] = useState<EducationalContent[]>(fallbackContent);
  const [featuredContent, setFeaturedContent] = useState<EducationalContent[]>([fallbackContent[0]]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('createdAt');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [userProgress, setUserProgress] = useState<Map<string, number>>(new Map());

  // Fetch content based on filters
  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedDifficulty !== 'all') params.append('difficultyLevel', selectedDifficulty);
      params.append('sortBy', sortBy);
      params.append('limit', '20');

      console.log('Fetching educational content from:', `/api/education?${params}`);
      const response = await fetch(`/api/education?${params}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setContent(data.data.content);
        console.log('Content set:', data.data.content.length, 'items');
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured content
  const fetchFeaturedContent = async () => {
    try {
      const response = await fetch('/api/education/featured');
      const data = await response.json();
      
      if (data.success) {
        setFeaturedContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching featured content:', error);
    }
  };

  // Fetch user progress
  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/education/user/progress');
      const data = await response.json();
      
      if (data.success) {
        const progressMap = new Map<string, number>();
        const bookmarkSet = new Set<string>();
        
        data.progress.forEach((p: any) => {
          progressMap.set(p.contentId, p.progress || 0);
          if (p.bookmarked) {
            bookmarkSet.add(p.contentId);
          }
        });
        
        setUserProgress(progressMap);
        setBookmarked(bookmarkSet);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async (contentId: string) => {
    try {
      const isBookmarked = bookmarked.has(contentId);
      
      const response = await fetch(`/api/education/${contentId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: !isBookmarked })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newBookmarked = new Set(bookmarked);
        if (data.bookmarked) {
          newBookmarked.add(contentId);
        } else {
          newBookmarked.delete(contentId);
        }
        setBookmarked(newBookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Get type icon component
  const getTypeIconComponent = (type: ContentType) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'image_guide': return <Image className="w-4 h-4" />;
      case 'checklist': return <CheckSquare className="w-4 h-4" />;
      case 'infographic': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Content card component
  const ContentCard: React.FC<{ content: EducationalContent; featured?: boolean }> = ({ 
    content, 
    featured = false 
  }) => {
    const progress = userProgress.get(content.id) || 0;
    const isBookmarked = bookmarked.has(content.id);

    return (
      <Card 
        className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
          featured ? 'border-blue-200 bg-blue-50/50' : ''
        }`}
        onClick={() => onContentSelect?.(content)}
      >
        {content.thumbnailUrl && (
          <div className="relative overflow-hidden rounded-t-lg">
            <img 
              src={content.thumbnailUrl} 
              alt={content.title}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {featured && (
              <Badge className="absolute top-2 left-2 bg-blue-600">
                Featured
              </Badge>
            )}
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getTypeIconComponent(content.type)}
                <Badge variant="outline" className="text-xs">
                  {content.type.replace('_', ' ')}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDifficultyColor(content.difficultyLevel)}`}
                >
                  {content.difficultyLevel}
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium line-clamp-2">
                {content.title}
              </CardTitle>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(content.id);
              }}
              className="ml-2 p-1 h-8 w-8"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {content.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(content.estimatedReadTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>{content.author}</span>
            </div>
          </div>
          
          {progress > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 mb-2">
            {content.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {content.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{content.tags.length - 3}
              </Badge>
            )}
          </div>
          
          <Button variant="outline" size="sm" className="w-full">
            {progress > 0 ? 'Continue' : 'Start Learning'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    fetchContent();
  }, [searchQuery, selectedCategory, selectedType, selectedDifficulty, sortBy]);

  useEffect(() => {
    fetchFeaturedContent();
    fetchUserProgress();
  }, []);

  if (loading && content.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading educational content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Educational Library</h1>
        <p className="text-gray-600">
          Explore water safety guidelines, emergency procedures, and health monitoring resources
        </p>
      </div>

      {/* Featured Content */}
      {featuredContent.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredContent.map((item) => (
              <ContentCard key={item.id} content={item} featured />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search educational content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="water_safety">Water Safety</SelectItem>
              <SelectItem value="disease_prevention">Disease Prevention</SelectItem>
              <SelectItem value="emergency_response">Emergency Response</SelectItem>
              <SelectItem value="health_monitoring">Health Monitoring</SelectItem>
              <SelectItem value="community_guidelines">Community Guidelines</SelectItem>
              <SelectItem value="water_treatment">Water Treatment</SelectItem>
              <SelectItem value="hygiene_practices">Hygiene Practices</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="image_guide">Image Guides</SelectItem>
              <SelectItem value="interactive">Interactive</SelectItem>
              <SelectItem value="infographic">Infographics</SelectItem>
              <SelectItem value="checklist">Checklists</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="step_by_step">Step by Step</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="viewCount">Most Popular</SelectItem>
              <SelectItem value="bookmarkCount">Most Bookmarked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
      }>
        {content.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>

      {/* Empty State */}
      {content.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default EducationalLibrary;