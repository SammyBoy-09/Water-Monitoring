// Shared types for map markers and location data

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  coordinates: Coordinates;
}

export type MarkerType = 'symptom_report' | 'water_test' | 'manual_marker';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type MarkerStatus = 'active' | 'resolved' | 'monitoring';
export type ManualMarkerType = 'info' | 'warning' | 'danger' | 'intervention';

// Base interface for all markers
export interface BaseMarker {
  _id?: string;
  type: MarkerType;
  location: Location;
  createdAt: string;
  updatedAt?: string;
}

// Patient symptom report marker
export interface SymptomReportMarker extends BaseMarker {
  type: 'symptom_report';
  date: string;
  symptoms: string[];
  affectedCount: number;
  notes?: string;
  severity: SeverityLevel;
  reportedBy: string;
}

// Water test result marker
export interface WaterTestMarker extends BaseMarker {
  type: 'water_test';
  testResults: {
    pH?: number;
    turbidity?: number;
    chlorine?: number;
    bacteria?: string;
    [key: string]: any; // Allow additional test parameters
  };
  kitUsed: string;
  riskLevel: SeverityLevel;
  recommendations?: string[];
  testedBy: string;
}

// Manual administrative marker
export interface ManualMarker extends BaseMarker {
  type: 'manual_marker';
  title: string;
  description: string;
  markerType: ManualMarkerType;
  priority: SeverityLevel;
  status: MarkerStatus;
  createdBy: string;
}

// Union type for all marker types
export type MapMarker = SymptomReportMarker | WaterTestMarker | ManualMarker;

// Request types for creating markers
export interface CreateSymptomReportRequest {
  date: string;
  location: Location;
  symptoms: string[];
  affectedCount: number;
  notes?: string;
  severity: SeverityLevel;
  reportedBy: string;
}

export interface CreateWaterTestRequest {
  location: Location;
  testResults: Record<string, any>;
  kitUsed: string;
  riskLevel: SeverityLevel;
  recommendations?: string[];
  testedBy: string;
}

export interface CreateManualMarkerRequest {
  title: string;
  description: string;
  location: Location;
  markerType: ManualMarkerType;
  priority: SeverityLevel;
  status: MarkerStatus;
  createdBy: string;
}

// Response type for marker operations
export interface MarkerResponse {
  success: boolean;
  marker?: MapMarker;
  markers?: MapMarker[];
  error?: string;
}

// Clustering data
export interface MarkerCluster {
  coordinates: Coordinates;
  count: number;
  markers: MapMarker[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}