import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  Image, 
  Video, 
  FileText, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUpload {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface QuickContentCreatorProps {
  onContentCreated?: (content: any) => void;
}

export const QuickContentCreator: React.FC<QuickContentCreatorProps> = ({
  onContentCreated
}) => {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // File type detection
  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  // Create preview for images and videos
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = [];
    
    for (const file of acceptedFiles) {
      const type = getFileType(file);
      let preview: string | undefined;
      
      if (type === 'image' || type === 'video') {
        preview = await createPreview(file);
      }
      
      newUploads.push({
        file,
        type,
        preview,
        status: 'pending'
      });
    }
    
    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
      'text/*': ['.txt', '.md'],
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  // Remove file
  const removeFile = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  // Simulate file upload (in production, this would upload to a real server)
  const uploadFile = async (file: File): Promise<string> => {
    // Simulate upload progress
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return a mock URL - in production, this would be the actual uploaded file URL
        resolve(`https://example.com/uploads/${file.name}`);
      }, 2000);
    });
  };

  // Create content from uploaded files
  const createContent = async () => {
    if (!title.trim() || uploads.length === 0) return;
    
    setIsCreating(true);
    
    try {
      // Update upload status to uploading
      setUploads(prev => prev.map(upload => ({ ...upload, status: 'uploading' as const })));
      
      // Upload all files
      const uploadPromises = uploads.map(async (upload, index) => {
        try {
          const url = await uploadFile(upload.file);
          setUploads(prev => prev.map((u, i) => 
            i === index ? { ...u, status: 'completed', progress: 100 } : u
          ));
          return { type: upload.type, url };
        } catch (error) {
          setUploads(prev => prev.map((u, i) => 
            i === index ? { ...u, status: 'error', error: 'Upload failed' } : u
          ));
          throw error;
        }
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Determine content type based on uploaded files
      const hasImages = uploadedFiles.some(f => f.type === 'image');
      const hasVideos = uploadedFiles.some(f => f.type === 'video');
      
      let contentType = 'article';
      let mediaUrl = '';
      
      if (hasVideos) {
        contentType = 'video';
        mediaUrl = uploadedFiles.find(f => f.type === 'video')?.url || '';
      } else if (hasImages) {
        contentType = 'image_guide';
        mediaUrl = uploadedFiles.find(f => f.type === 'image')?.url || '';
      }
      
      // Create the educational content
      const contentData = {
        title: title.trim(),
        description: description.trim() || `Educational content: ${title}`,
        category: 'water_safety', // Default category
        type: contentType,
        difficultyLevel: 'beginner',
        content: description.trim() || 'Content uploaded via drag and drop.',
        mediaUrl,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        estimatedReadTime: Math.max(1, Math.ceil(description.length / 200)), // Rough estimate
        language: 'en',
        author: 'Content Creator',
        learningObjectives: [`Learn about ${title}`],
        isPublished: true,
        isFeatured: false
      };
      
      // Submit to API
      const response = await fetch('/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        onContentCreated?.(result.content);
        // Reset form
        setTitle('');
        setDescription('');
        setTags('');
        setUploads([]);
      } else {
        throw new Error(result.error || 'Failed to create content');
      }
      
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-generate title from first image/video name
  const autoGenerateTitle = () => {
    if (!title && uploads.length > 0) {
      const firstFile = uploads[0].file;
      const name = firstFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  React.useEffect(autoGenerateTitle, [uploads]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Quick Content Creator</h2>
        <p className="text-gray-600">Simply drag and drop your images or videos to create educational content</p>
      </div>

      {/* Drag and Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop your files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                <p className="text-gray-500 mb-4">or click to browse</p>
                <div className="flex justify-center gap-4 text-sm text-gray-400">
                  <Badge variant="outline">Images (PNG, JPG, GIF)</Badge>
                  <Badge variant="outline">Videos (MP4, WebM, MOV)</Badge>
                  <Badge variant="outline">Documents (PDF, TXT, MD)</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-2">Max file size: 50MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Previews */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Uploaded Files ({uploads.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploads.map((upload, index) => (
                <div key={index} className="relative border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {upload.type === 'image' && <Image className="w-4 h-4 text-blue-600" />}
                      {upload.type === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                      {upload.type === 'document' && <FileText className="w-4 h-4 text-green-600" />}
                      <span className="text-sm font-medium truncate">
                        {upload.file.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* Preview */}
                  {upload.preview && (
                    <div className="mb-2">
                      {upload.type === 'image' ? (
                        <img
                          src={upload.preview}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <video
                          src={upload.preview}
                          className="w-full h-24 object-cover rounded"
                          muted
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <div className="flex items-center gap-1">
                      {upload.status === 'pending' && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                      {upload.status === 'uploading' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                      {upload.status === 'completed' && <Check className="w-3 h-3 text-green-500" />}
                      {upload.status === 'error' && <X className="w-3 h-3 text-red-500" />}
                      <span className={`
                        ${upload.status === 'pending' ? 'text-yellow-600' : ''}
                        ${upload.status === 'uploading' ? 'text-blue-600' : ''}
                        ${upload.status === 'completed' ? 'text-green-600' : ''}
                        ${upload.status === 'error' ? 'text-red-600' : ''}
                      `}>
                        {upload.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Details Form */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold mb-4">Content Details</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your content"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this content teaches or explains..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="water safety, hygiene, emergency (comma-separated)"
              />
            </div>

            {/* Auto-detection info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Content will be automatically categorized based on your uploaded files:
                {uploads.some(u => u.type === 'video') && ' Video content detected.'}
                {uploads.some(u => u.type === 'image') && ' Image guide detected.'}
                {uploads.some(u => u.type === 'document') && ' Document content detected.'}
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={createContent}
              disabled={!title.trim() || uploads.length === 0 || isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Content...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Educational Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickContentCreator;