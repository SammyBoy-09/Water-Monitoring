import React, { useState } from 'react';
import EducationalLibrary from '@/components/education/EducationalLibrary';
import ContentViewer from '@/components/education/ContentViewer';
import ContentManagement from '@/components/education/ContentManagement';
import QuickContentCreator from '@/components/education/QuickContentCreator';
import { Button } from '@/components/ui/button';
import { Settings, BookOpen, Users, Upload } from 'lucide-react';
import { EducationalContent } from '../../shared/types/educational-content';

type ViewMode = 'library' | 'content' | 'admin' | 'create';

export default function EduModules() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // In production, this would come from user auth

  const handleContentSelect = (content: EducationalContent) => {
    setSelectedContent(content);
    setViewMode('content');
  };

  const handleBackToLibrary = () => {
    setSelectedContent(null);
    setViewMode('library');
  };

  const handleProgressUpdate = (progress: number) => {
    // Handle progress updates if needed
    console.log('Progress updated:', progress);
  };

  const handleContentCreated = (content: EducationalContent) => {
    // Show success message and switch back to library view
    console.log('Content created:', content);
    setViewMode('library');
  };

  return (
    <div className="min-h-screen">
      {/* Header with navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Educational Center</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'library' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('library')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Library
                </Button>
                
                <Button
                  variant={viewMode === 'create' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('create')}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Quick Upload
                </Button>
                
                {isAdmin && (
                  <Button
                    variant={viewMode === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('admin')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Content
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdmin(!isAdmin)}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {isAdmin ? 'User Mode' : 'Admin Mode'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-gray-50 min-h-screen">
        {viewMode === 'library' && (
          <EducationalLibrary onContentSelect={handleContentSelect} />
        )}
        
        {viewMode === 'create' && (
          <QuickContentCreator onContentCreated={handleContentCreated} />
        )}
        
        {viewMode === 'content' && selectedContent && (
          <ContentViewer
            content={selectedContent}
            onBack={handleBackToLibrary}
            onProgressUpdate={handleProgressUpdate}
          />
        )}
        
        {viewMode === 'admin' && isAdmin && (
          <ContentManagement />
        )}
      </div>
    </div>
  );
}
