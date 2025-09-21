import express from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { sampleEducationalContent } from '../data/sample-educational-content';
import { 
  EducationalContent, 
  ContentFilter, 
  UserProgress,
  CreateContentRequest,
  UpdateContentRequest,
  ProgressUpdateRequest,
  BookmarkRequest,
  CONTENT_CATEGORIES,
  CONTENT_TYPES,
  DIFFICULTY_LEVELS
} from '../../shared/types/educational-content';

const router = express.Router();

// Initialize database with sample content if empty
async function initializeSampleContent() {
  try {
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const count = await collection.countDocuments();
    if (count === 0) {
      console.log('Initializing educational content with sample data...');
      await collection.insertMany(sampleEducationalContent);
      console.log(`Inserted ${sampleEducationalContent.length} sample educational content items`);
    }
  } catch (error) {
    console.error('Error initializing sample content:', error);
  }
}

// Initialize sample content on module load
initializeSampleContent();

// Zod schemas for validation
const CreateContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(CONTENT_CATEGORIES as [string, ...string[]]),
  type: z.enum(CONTENT_TYPES as [string, ...string[]]),
  difficultyLevel: z.enum(DIFFICULTY_LEVELS as [string, ...string[]]),
  content: z.string().min(1),
  tags: z.array(z.string()),
  estimatedReadTime: z.number().min(1),
  duration: z.number().optional(),
  language: z.string().default('en'),
  author: z.string().min(1),
  learningObjectives: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false)
});

const UpdateContentSchema = CreateContentSchema.partial().extend({
  id: z.string()
});

const ProgressUpdateSchema = z.object({
  contentId: z.string(),
  progress: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

const BookmarkSchema = z.object({
  contentId: z.string(),
  bookmarked: z.boolean()
});

// GET /api/education - Get educational content with filtering
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    // Parse query parameters
    const {
      category,
      type,
      difficultyLevel,
      tags,
      searchQuery,
      author,
      language = 'en',
      isFeatured,
      minDuration,
      maxDuration,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      skip = '0'
    } = req.query;

    // Build filter
    const filter: any = { isPublished: true };
    
    if (category) {
      const categories = (category as string).split(',');
      filter.category = { $in: categories };
    }
    
    if (type) {
      const types = (type as string).split(',');
      filter.type = { $in: types };
    }
    
    if (difficultyLevel) {
      const difficulties = (difficultyLevel as string).split(',');
      filter.difficultyLevel = { $in: difficulties };
    }
    
    if (tags) {
      const tagList = (tags as string).split(',');
      filter.tags = { $in: tagList };
    }
    
    if (author) {
      filter.author = { $regex: author as string, $options: 'i' };
    }
    
    if (language) {
      filter.language = language;
    }
    
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }
    
    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = parseInt(minDuration as string);
      if (maxDuration) filter.duration.$lte = parseInt(maxDuration as string);
    }
    
    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery as string, $options: 'i' } },
        { description: { $regex: searchQuery as string, $options: 'i' } },
        { content: { $regex: searchQuery as string, $options: 'i' } },
        { tags: { $in: [(searchQuery as string).toLowerCase()] } }
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [content, totalCount] = await Promise.all([
      collection
        .find(filter)
        .sort(sort)
        .skip(parseInt(skip as string))
        .limit(parseInt(limit as string))
        .toArray(),
      collection.countDocuments(filter)
    ]);

    // Build facets for filtering UI
    const facets = await Promise.all([
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray()
    ]);

    const response = {
      content: content as unknown as EducationalContent[],
      totalCount,
      facets: {
        categories: facets[0].map(f => ({ category: f._id, count: f.count })),
        types: facets[1].map(f => ({ type: f._id, count: f.count })),
        difficulties: facets[2].map(f => ({ difficulty: f._id, count: f.count })),
        tags: facets[3].map(f => ({ tag: f._id, count: f.count }))
      }
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching educational content:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch educational content' });
  }
});

// GET /api/education/featured - Get featured content
router.get('/featured', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const featured = await collection
      .find({ isPublished: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.json({ success: true, content: featured });
  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch featured content' });
  }
});

// GET /api/education/stats - Get content statistics
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const stats = await collection.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalBookmarks: { $sum: '$bookmarkCount' },
          contentByCategory: {
            $push: {
              category: '$category',
              type: '$type',
              difficulty: '$difficultyLevel'
            }
          }
        }
      }
    ]).toArray();

    const result = stats[0] || {
      totalContent: 0,
      totalViews: 0,
      totalBookmarks: 0,
      contentByCategory: []
    };

    res.json({ success: true, stats: result });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content statistics' });
  }
});

// GET /api/education/:id - Get specific content
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const content = await collection.findOne({ 
      id: req.params.id,
      isPublished: true 
    });
    
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Increment view count
    await collection.updateOne(
      { id: req.params.id },
      { $inc: { viewCount: 1 } }
    );

    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

// POST /api/education - Create new content (admin only)
router.post('/', async (req, res) => {
  try {
    const validatedData = CreateContentSchema.parse(req.body);
    
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const content = {
      ...validatedData,
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      bookmarkCount: 0
    };
    
    await collection.insertOne(content);
    
    res.status(201).json({ success: true, content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error creating content:', error);
    res.status(500).json({ success: false, error: 'Failed to create content' });
  }
});

// PUT /api/education/:id - Update content (admin only)
router.put('/:id', async (req, res) => {
  try {
    const validatedData = UpdateContentSchema.parse({
      ...req.body,
      id: req.params.id
    });
    
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const { id, ...updateData } = validatedData;
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    const updatedContent = await collection.findOne({ id: req.params.id });
    res.json({ success: true, content: updatedContent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, error: 'Failed to update content' });
  }
});

// DELETE /api/education/:id - Delete content (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('educational_content');
    
    const result = await collection.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, error: 'Failed to delete content' });
  }
});

// POST /api/education/:id/progress - Update user progress
router.post('/:id/progress', async (req, res) => {
  try {
    const validatedData = ProgressUpdateSchema.parse({
      ...req.body,
      contentId: req.params.id
    });
    
    const db = await getDb();
    const collection = db.collection('user_progress');
    
    // For now, using a default user ID - in production, this would come from authentication
    const userId = 'default_user';
    
    const progress = {
      userId,
      contentId: req.params.id,
      ...validatedData,
      bookmarked: false,
      lastAccessed: new Date(),
      completedAt: validatedData.status === 'completed' ? new Date() : undefined
    };
    
    await collection.replaceOne(
      { userId, contentId: req.params.id },
      progress,
      { upsert: true }
    );
    
    res.json({ success: true, progress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
});

// POST /api/education/:id/bookmark - Toggle bookmark
router.post('/:id/bookmark', async (req, res) => {
  try {
    const validatedData = BookmarkSchema.parse({
      ...req.body,
      contentId: req.params.id
    });
    
    const db = await getDb();
    const progressCollection = db.collection('user_progress');
    const contentCollection = db.collection('educational_content');
    
    // For now, using a default user ID
    const userId = 'default_user';
    
    // Update user progress
    await progressCollection.updateOne(
      { userId, contentId: req.params.id },
      { 
        $set: { 
          bookmarked: validatedData.bookmarked,
          lastAccessed: new Date()
        }
      },
      { upsert: true }
    );
    
    // Update bookmark count on content
    const increment = validatedData.bookmarked ? 1 : -1;
    await contentCollection.updateOne(
      { id: req.params.id },
      { $inc: { bookmarkCount: increment } }
    );
    
    res.json({ success: true, bookmarked: validatedData.bookmarked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating bookmark:', error);
    res.status(500).json({ success: false, error: 'Failed to update bookmark' });
  }
});

// GET /api/education/user/progress - Get user's progress
router.get('/user/progress', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('user_progress');
    
    // For now, using a default user ID
    const userId = 'default_user';
    
    const progress = await collection
      .find({ userId })
      .sort({ lastAccessed: -1 })
      .toArray();
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user progress' });
  }
});

export default router;