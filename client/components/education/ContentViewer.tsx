import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BookmarkPlus, 
  BookmarkCheck, 
  Clock, 
  User, 
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  Circle,
  Download,
  Share2,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  EducationalContent,
  UserProgress,
  getDifficultyColor,
  formatDuration
} from '../../../shared/types/educational-content';

interface ContentViewerProps {
  content: EducationalContent;
  onBack: () => void;
  onProgressUpdate?: (progress: number) => void;
}

export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  onBack,
  onProgressUpdate
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Fetch user progress for this content
  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/education/user/progress');
      const data = await response.json();
      
      if (data.success) {
        const contentProgress = data.progress.find((p: UserProgress) => p.contentId === content.id);
        if (contentProgress) {
          setUserProgress(contentProgress);
          setIsBookmarked(contentProgress.bookmarked || false);
          setRating(contentProgress.rating || 0);
          setNotes(contentProgress.notes || '');
          setReadingProgress(contentProgress.progress || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  // Update progress
  const updateProgress = async (progress: number, status: 'not_started' | 'in_progress' | 'completed' = 'in_progress') => {
    try {
      const response = await fetch(`/api/education/${content.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress,
          status,
          rating: rating || undefined,
          notes: notes || undefined,
          timeSpent: Math.round(Date.now() / 1000) // Simplified time tracking
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReadingProgress(progress);
        onProgressUpdate?.(progress);
        
        if (progress === 100) {
          setUserProgress(prev => prev ? { ...prev, status: 'completed' } : null);
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async () => {
    try {
      const response = await fetch(`/api/education/${content.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: !isBookmarked })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsBookmarked(data.bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Save notes and rating
  const saveUserData = async () => {
    if (notes || rating > 0) {
      await updateProgress(readingProgress, userProgress?.status || 'in_progress');
    }
  };

  // Render content based on type
  const renderContent = () => {
    switch (content.type) {
      case 'video':
        return (
          <div className="relative bg-black rounded-lg overflow-hidden">
            {content.mediaUrl ? (
              <video
                src={content.mediaUrl}
                poster={content.thumbnailUrl}
                controls
                className="w-full h-64 md:h-96"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => updateProgress(100, 'completed')}
                muted={videoMuted}
              />
            ) : (
              <div className="w-full h-64 md:h-96 flex items-center justify-center bg-gray-800 text-white">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-2" />
                  <p>Video content not available</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVideoMuted(!videoMuted)}
              >
                {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        );
        
      case 'image_guide':
        return (
          <div className="space-y-4">
            {content.mediaUrl ? (
              <div className="relative">
                <img
                  src={content.mediaUrl}
                  alt={content.title}
                  className="w-full rounded-lg shadow-sm"
                />
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">Image content not available</p>
              </div>
            )}
          </div>
        );
        
      case 'interactive':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Interactive Content</h3>
              <p className="text-gray-600 mb-4">This content includes interactive elements</p>
              <Button onClick={() => updateProgress(50)}>
                Start Interactive Session
              </Button>
            </div>
          </div>
        );
        
      case 'checklist':
        const checklistItems = content.content.split('\n').filter(line => line.trim());
        return (
          <div className="space-y-2">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  className="mt-0.5"
                  onClick={() => {
                    const progress = Math.min(100, ((index + 1) / checklistItems.length) * 100);
                    updateProgress(progress);
                  }}
                >
                  <Circle className="w-5 h-5 text-gray-400 hover:text-green-600" />
                </button>
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        );
    }
  };

  // Simulate reading progress for articles
  useEffect(() => {
    if (content.type === 'article') {
      const handleScroll = () => {
        const element = document.getElementById('content-body');
        if (element) {
          const { scrollTop, scrollHeight, clientHeight } = element;
          const progress = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100);
          if (progress > readingProgress) {
            setReadingProgress(progress);
            if (progress > 90) {
              updateProgress(100, 'completed');
            } else if (progress > 10) {
              updateProgress(progress);
            }
          }
        }
      };

      const element = document.getElementById('content-body');
      element?.addEventListener('scroll', handleScroll);
      return () => element?.removeEventListener('scroll', handleScroll);
    }
  }, [content.type, readingProgress]);

  useEffect(() => {
    fetchUserProgress();
  }, [content.id]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={toggleBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 mr-2" />
            ) : (
              <BookmarkPlus className="w-4 h-4 mr-2" />
            )}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>
      </div>

      {/* Content Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline">
            {content.type.replace('_', ' ')}
          </Badge>
          <Badge 
            variant="outline" 
            className={getDifficultyColor(content.difficultyLevel)}
          >
            {content.difficultyLevel}
          </Badge>
          <Badge variant="secondary">
            {content.category.replace('_', ' ')}
          </Badge>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
        <p className="text-lg text-gray-600 mb-4">{content.description}</p>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{content.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(content.estimatedReadTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" />
            <span>{content.viewCount || 0} views</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        {readingProgress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{Math.round(readingProgress)}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Learning Objectives */}
      {content.learningObjectives && content.learningObjectives.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Learning Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites */}
      {content.prerequisites && content.prerequisites.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.prerequisites.map((prerequisite, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{prerequisite}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div id="content-body" className="max-h-96 overflow-y-auto">
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* User Interaction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rate this content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Button onClick={saveUserData} disabled={rating === 0}>
              Submit Rating
            </Button>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add your personal notes about this content..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-4"
              rows={4}
            />
            <Button onClick={saveUserData}>
              Save Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentViewer;