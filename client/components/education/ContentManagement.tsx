import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Upload,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Save,
  X,
  FileText,
  Video,
  Image,
  CheckSquare,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  EducationalContent,
  CreateContentRequest,
  UpdateContentRequest,
  ContentCategory,
  ContentType,
  DifficultyLevel,
  CONTENT_CATEGORIES,
  CONTENT_TYPES,
  DIFFICULTY_LEVELS,
  getDifficultyColor,
  formatDuration
} from '../../../shared/types/educational-content';

export const ContentManagement: React.FC = () => {
  const [content, setContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [editingContent, setEditingContent] = useState<EducationalContent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating/editing content
  const [formData, setFormData] = useState<Partial<CreateContentRequest>>({
    title: '',
    description: '',
    category: 'water_safety',
    type: 'article',
    difficultyLevel: 'beginner',
    content: '',
    tags: [],
    estimatedReadTime: 5,
    duration: undefined,
    language: 'en',
    author: '',
    learningObjectives: [],
    prerequisites: [],
    isPublished: false,
    isFeatured: false
  });

  // Fetch all content for management
  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (!showPublishedOnly) params.append('includeUnpublished', 'true');
      params.append('limit', '50');

      const response = await fetch(`/api/education?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data.content);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new content
  const createContent = async () => {
    try {
      const response = await fetch('/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(prev => [data.content, ...prev]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        alert('Error creating content: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Error creating content');
    }
  };

  // Update content
  const updateContent = async () => {
    if (!editingContent) return;
    
    try {
      const response = await fetch(`/api/education/${editingContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(prev => prev.map(item => 
          item.id === editingContent.id ? data.content : item
        ));
        setIsEditDialogOpen(false);
        setEditingContent(null);
        resetForm();
      } else {
        alert('Error updating content: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Error updating content');
    }
  };

  // Delete content
  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const response = await fetch(`/api/education/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(prev => prev.filter(item => item.id !== id));
      } else {
        alert('Error deleting content: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Error deleting content');
    }
  };

  // Toggle publish status
  const togglePublishStatus = async (id: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/education/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(prev => prev.map(item => 
          item.id === id ? { ...item, isPublished } : item
        ));
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  // Toggle featured status
  const toggleFeaturedStatus = async (id: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/education/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(prev => prev.map(item => 
          item.id === id ? { ...item, isFeatured } : item
        ));
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'water_safety',
      type: 'article',
      difficultyLevel: 'beginner',
      content: '',
      tags: [],
      estimatedReadTime: 5,
      duration: undefined,
      language: 'en',
      author: '',
      learningObjectives: [],
      prerequisites: [],
      isPublished: false,
      isFeatured: false
    });
  };

  // Open edit dialog
  const openEditDialog = (item: EducationalContent) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      type: item.type,
      difficultyLevel: item.difficultyLevel,
      content: item.content,
      tags: item.tags,
      estimatedReadTime: item.estimatedReadTime,
      duration: item.duration,
      language: item.language,
      author: item.author,
      learningObjectives: item.learningObjectives,
      prerequisites: item.prerequisites,
      isPublished: item.isPublished,
      isFeatured: item.isFeatured
    });
    setIsEditDialogOpen(true);
  };

  // Get type icon
  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'image_guide': return <Image className="w-4 h-4" />;
      case 'checklist': return <CheckSquare className="w-4 h-4" />;
      case 'infographic': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Content form component
  const ContentForm: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Content title"
          />
        </div>
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
            placeholder="Author name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Content description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ContentCategory }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="type">Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ContentType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select 
            value={formData.difficultyLevel} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, difficultyLevel: value as DifficultyLevel }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map(diff => (
                <SelectItem key={diff} value={diff}>
                  {diff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="readTime">Estimated Read Time (minutes)</Label>
          <Input
            id="readTime"
            type="number"
            value={formData.estimatedReadTime}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedReadTime: parseInt(e.target.value) || 5 }))}
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (seconds, for videos)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : undefined }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Content body (HTML or Markdown)"
          rows={6}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags?.join(', ')}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
          }))}
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div>
        <Label htmlFor="objectives">Learning Objectives (one per line)</Label>
        <Textarea
          id="objectives"
          value={formData.learningObjectives?.join('\n')}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            learningObjectives: e.target.value.split('\n').filter(Boolean)
          }))}
          placeholder="Objective 1&#10;Objective 2"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
          />
          <Label htmlFor="published">Published</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    fetchContent();
  }, [searchQuery, selectedCategory, selectedType, showPublishedOnly]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Content Management</h1>
          <p className="text-gray-600">Manage educational content for the water monitoring system</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Educational Content</DialogTitle>
            </DialogHeader>
            <ContentForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createContent}>
                <Save className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="published-only"
              checked={showPublishedOnly}
              onCheckedChange={setShowPublishedOnly}
            />
            <Label htmlFor="published-only">Published only</Label>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CONTENT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CONTENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Educational Content ({content.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No content found</h3>
              <p className="text-gray-600">Create your first educational content to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(item.type)}
                        <h3 className="font-medium">{item.title}</h3>
                        
                        <div className="flex gap-1">
                          <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                          <Badge variant="outline" className={getDifficultyColor(item.difficultyLevel)}>
                            {item.difficultyLevel}
                          </Badge>
                          <Badge variant="secondary">{item.category.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>By {item.author}</span>
                        <span>{formatDuration(item.estimatedReadTime)}</span>
                        <span>{item.viewCount || 0} views</span>
                        <span>{item.bookmarkCount || 0} bookmarks</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublishStatus(item.id, !item.isPublished)}
                      >
                        {item.isPublished ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeaturedStatus(item.id, !item.isFeatured)}
                      >
                        {item.isFeatured ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContent(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Educational Content</DialogTitle>
          </DialogHeader>
          <ContentForm isEdit />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateContent}>
              <Save className="w-4 h-4 mr-2" />
              Update Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;