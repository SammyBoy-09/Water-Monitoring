import { RequestHandler } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getCollection } from "../db";
import { 
  MapMarker, 
  SymptomReportMarker, 
  WaterTestMarker, 
  ManualMarker,
  MarkerType
} from "../../shared/types/map-markers";

// Validation schemas
const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const LocationSchema = z.object({
  address: z.string().min(1),
  coordinates: CoordinatesSchema,
});

const SymptomReportSchema = z.object({
  date: z.string().min(1),
  location: LocationSchema,
  symptoms: z.array(z.string()).min(1),
  affectedCount: z.number().int().min(1),
  notes: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  reportedBy: z.string().min(1),
});

const WaterTestSchema = z.object({
  location: LocationSchema,
  testResults: z.record(z.any()),
  kitUsed: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  recommendations: z.array(z.string()).optional(),
  testedBy: z.string().min(1),
});

const ManualMarkerSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: LocationSchema,
  markerType: z.enum(['info', 'warning', 'danger', 'intervention']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'resolved', 'monitoring']),
  createdBy: z.string().min(1),
});

// Get all markers
export const getAllMarkers: RequestHandler = async (req, res) => {
  try {
    const collection = await getCollection("markers");
    const markers = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();
    
    res.json({ 
      success: true, 
      markers: markers.map(marker => ({ ...marker, _id: marker._id?.toString() }))
    });
  } catch (error: any) {
    console.error("Error fetching markers:", error);
    res.status(500).json({ success: false, error: "Failed to fetch markers" });
  }
};

// Get markers by type
export const getMarkersByType: RequestHandler = async (req, res) => {
  try {
    const { type } = req.params;
    if (!['symptom_report', 'water_test', 'manual_marker'].includes(type)) {
      return res.status(400).json({ success: false, error: "Invalid marker type" });
    }

    const collection = await getCollection("markers");
    const markers = await collection
      .find({ type: type as MarkerType })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ 
      success: true, 
      markers: markers.map(marker => ({ ...marker, _id: marker._id?.toString() }))
    });
  } catch (error: any) {
    console.error("Error fetching markers by type:", error);
    res.status(500).json({ success: false, error: "Failed to fetch markers" });
  }
};

// Create symptom report marker
export const createSymptomReport: RequestHandler = async (req, res) => {
  try {
    const parsed = SymptomReportSchema.parse(req.body);
    const marker = {
      ...parsed,
      type: 'symptom_report' as const,
      createdAt: new Date().toISOString(),
    };

    const collection = await getCollection("markers");
    const result = await collection.insertOne(marker);
    
    res.status(201).json({ 
      success: true, 
      marker: { ...marker, _id: result.insertedId.toString() }
    });
  } catch (error: any) {
    console.error("Error creating symptom report:", error);
    res.status(400).json({ success: false, error: error.message || "Invalid request" });
  }
};

// Create water test marker
export const createWaterTest: RequestHandler = async (req, res) => {
  try {
    const parsed = WaterTestSchema.parse(req.body);
    const marker = {
      ...parsed,
      type: 'water_test' as const,
      createdAt: new Date().toISOString(),
    };

    const collection = await getCollection("markers");
    const result = await collection.insertOne(marker);
    
    res.status(201).json({ 
      success: true, 
      marker: { ...marker, _id: result.insertedId.toString() }
    });
  } catch (error: any) {
    console.error("Error creating water test:", error);
    res.status(400).json({ success: false, error: error.message || "Invalid request" });
  }
};

// Create manual marker
export const createManualMarker: RequestHandler = async (req, res) => {
  try {
    const parsed = ManualMarkerSchema.parse(req.body);
    const marker = {
      ...parsed,
      type: 'manual_marker' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const collection = await getCollection("markers");
    const result = await collection.insertOne(marker);
    
    res.status(201).json({ 
      success: true, 
      marker: { ...marker, _id: result.insertedId.toString() }
    });
  } catch (error: any) {
    console.error("Error creating manual marker:", error);
    res.status(400).json({ success: false, error: error.message || "Invalid request" });
  }
};

// Update marker
export const updateMarker: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid marker ID" });
    }

    const collection = await getCollection("markers");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date().toISOString() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: "Marker not found" });
    }

    const updatedMarker = await collection.findOne({ _id: new ObjectId(id) } as any);
    res.json({ 
      success: true, 
      marker: { ...updatedMarker, _id: updatedMarker?._id?.toString() }
    });
  } catch (error: any) {
    console.error("Error updating marker:", error);
    res.status(500).json({ success: false, error: "Failed to update marker" });
  }
};

// Delete marker
export const deleteMarker: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid marker ID" });
    }

    const collection = await getCollection("markers");
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as any);

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Marker not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting marker:", error);
    res.status(500).json({ success: false, error: "Failed to delete marker" });
  }
};

// Get markers within a geographical bounds (for map viewport)
export const getMarkersInBounds: RequestHandler = async (req, res) => {
  try {
    const { north, south, east, west } = req.query;
    
    if (!north || !south || !east || !west) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing bounds parameters" 
      });
    }

    const collection = await getCollection("markers");
    const markers = await collection
      .find({
        "location.coordinates.lat": { 
          $gte: parseFloat(south as string), 
          $lte: parseFloat(north as string) 
        },
        "location.coordinates.lng": { 
          $gte: parseFloat(west as string), 
          $lte: parseFloat(east as string) 
        }
      })
      .toArray();
    
    res.json({ 
      success: true, 
      markers: markers.map(marker => ({ ...marker, _id: marker._id?.toString() }))
    });
  } catch (error: any) {
    console.error("Error fetching markers in bounds:", error);
    res.status(500).json({ success: false, error: "Failed to fetch markers" });
  }
};