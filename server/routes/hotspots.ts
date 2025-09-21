import express from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { detectHotspots, generateHotspotId } from '../../shared/utils/hotspot-detection';
import { MapMarker } from '../../shared/types/map-markers';

const router = express.Router();

// Zod schemas for validation
const HotspotSchema = z.object({
  id: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  markerCount: z.number(),
  markerIds: z.array(z.string()),
  radius: z.number(),
  detectedAt: z.date(),
  acknowledged: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  notes: z.string().optional()
});

const CreateHotspotSchema = HotspotSchema.omit({ id: true, detectedAt: true });
const UpdateHotspotSchema = HotspotSchema.partial().omit({ id: true, detectedAt: true });

// GET /api/hotspots - Get all hotspots
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    // Parse query parameters
    const { 
      severity, 
      acknowledged, 
      resolved,
      limit = '50',
      skip = '0',
      sortBy = 'detectedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter: any = {};
    
    if (severity) {
      const severities = (severity as string).split(',');
      filter.severity = { $in: severities };
    }
    
    if (acknowledged !== undefined) {
      filter.acknowledged = acknowledged === 'true';
    }
    
    if (resolved !== undefined) {
      if (resolved === 'true') {
        filter.resolvedAt = { $exists: true };
      } else {
        filter.resolvedAt = { $exists: false };
      }
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const hotspots = await collection
      .find(filter)
      .sort(sort)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .toArray();

    const total = await collection.countDocuments(filter);

    res.json({
      hotspots,
      pagination: {
        total,
        skip: parseInt(skip as string),
        limit: parseInt(limit as string),
        hasMore: parseInt(skip as string) + parseInt(limit as string) < total
      }
    });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({ error: 'Failed to fetch hotspots' });
  }
});

// GET /api/hotspots/stats/summary - Get hotspot statistics  
router.get('/stats/summary', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          critical: { 
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          high: { 
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          },
          medium: { 
            $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
          },
          low: { 
            $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] }
          },
          acknowledged: { 
            $sum: { $cond: ['$acknowledged', 1, 0] }
          },
          resolved: { 
            $sum: { $cond: [{ $exists: '$resolvedAt' }, 1, 0] }
          },
          unresolved: { 
            $sum: { $cond: [{ $not: { $exists: '$resolvedAt' } }, 1, 0] }
          }
        }
      }
    ]).toArray();
    
    const summary = stats[0] || {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      acknowledged: 0,
      resolved: 0,
      unresolved: 0
    };
    
    // Remove the _id field
    delete summary._id;
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching hotspot stats:', error);
    res.status(500).json({ error: 'Failed to fetch hotspot statistics' });
  }
});

// GET /api/hotspots/:id - Get specific hotspot
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const hotspot = await collection.findOne({ id: req.params.id });
    
    if (!hotspot) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    res.json(hotspot);
  } catch (error) {
    console.error('Error fetching hotspot:', error);
    res.status(500).json({ error: 'Failed to fetch hotspot' });
  }
});

// POST /api/hotspots/detect - Detect hotspots from current markers
router.post('/detect', async (req, res) => {
  try {
    const db = await getDb();
    const markersCollection = db.collection('markers');
    const hotspotsCollection = db.collection('hotspots');
    
    // Get all active markers
    const markers = await markersCollection.find({ 
      status: { $ne: 'resolved' } 
    }).toArray() as unknown as MapMarker[];

    // Detect hotspots
    const detectedHotspots = detectHotspots(markers, {
      minMarkersForHotspot: 3,
      radiusMeters: 1000, // 1km radius
      severityThresholds: {
        medium: 3,
        high: 5,
        critical: 8
      }
    });

    // Save new hotspots to database
    const newHotspots = [];
    for (const hotspot of detectedHotspots) {
      // Check if hotspot already exists in this location
      const existingHotspot = await hotspotsCollection.findOne({
        'center.lat': { $gte: hotspot.center.lat - 0.001, $lte: hotspot.center.lat + 0.001 },
        'center.lng': { $gte: hotspot.center.lng - 0.001, $lte: hotspot.center.lng + 0.001 },
        resolvedAt: { $exists: false }
      });

      if (!existingHotspot) {
        const hotspotDoc = {
          ...hotspot,
          detectedAt: new Date(),
          acknowledged: false
        };
        
        await hotspotsCollection.insertOne(hotspotDoc);
        newHotspots.push(hotspotDoc);
      }
    }

    res.json({
      message: `Detected ${detectedHotspots.length} hotspots, ${newHotspots.length} new`,
      allHotspots: detectedHotspots,
      newHotspots: newHotspots
    });
  } catch (error) {
    console.error('Error detecting hotspots:', error);
    res.status(500).json({ error: 'Failed to detect hotspots' });
  }
});

// POST /api/hotspots - Create new hotspot manually
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validatedData = CreateHotspotSchema.parse(req.body);
    
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const hotspot = {
      ...validatedData,
      id: generateHotspotId(),
      detectedAt: new Date()
    };
    
    await collection.insertOne(hotspot);
    
    res.status(201).json(hotspot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error creating hotspot:', error);
    res.status(500).json({ error: 'Failed to create hotspot' });
  }
});

// PUT /api/hotspots/:id - Update hotspot
router.put('/:id', async (req, res) => {
  try {
    // Validate request body
    const validatedData = UpdateHotspotSchema.parse(req.body);
    
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { 
        $set: {
          ...validatedData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    
    const updatedHotspot = await collection.findOne({ id: req.params.id });
    res.json(updatedHotspot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating hotspot:', error);
    res.status(500).json({ error: 'Failed to update hotspot' });
  }
});

// PATCH /api/hotspots/:id/acknowledge - Acknowledge a hotspot
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { 
        $set: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: req.body.acknowledgedBy || 'system'
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    
    const updatedHotspot = await collection.findOne({ id: req.params.id });
    res.json(updatedHotspot);
  } catch (error) {
    console.error('Error acknowledging hotspot:', error);
    res.status(500).json({ error: 'Failed to acknowledge hotspot' });
  }
});

// PATCH /api/hotspots/:id/resolve - Resolve a hotspot
router.patch('/:id/resolve', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { 
        $set: {
          resolvedAt: new Date(),
          resolvedBy: req.body.resolvedBy || 'system',
          resolutionNotes: req.body.notes || ''
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    
    const updatedHotspot = await collection.findOne({ id: req.params.id });
    res.json(updatedHotspot);
  } catch (error) {
    console.error('Error resolving hotspot:', error);
    res.status(500).json({ error: 'Failed to resolve hotspot' });
  }
});

// DELETE /api/hotspots/:id - Delete hotspot
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection('hotspots');
    
    const result = await collection.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    
    res.json({ message: 'Hotspot deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotspot:', error);
    res.status(500).json({ error: 'Failed to delete hotspot' });
  }
});

export default router;