// Hotspot detection utilities for map markers
import { MapMarker, Coordinates } from '@shared/types/map-markers';

export interface Hotspot {
  id: string;
  center: Coordinates;
  radius: number; // in meters
  markerCount: number;
  markers: MapMarker[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'mixed' | 'symptom_outbreak' | 'water_contamination' | 'intervention_zone';
  detectedAt: string;
  alertSent: boolean;
}

export interface HotspotConfig {
  minMarkersForHotspot: number;
  radiusMeters: number;
  severityThresholds: {
    medium: number;  // markers count
    high: number;
    critical: number;
  };
}

// Default configuration for hotspot detection
export const DEFAULT_HOTSPOT_CONFIG: HotspotConfig = {
  minMarkersForHotspot: 3,
  radiusMeters: 1000, // 1km radius
  severityThresholds: {
    medium: 3,
    high: 5,
    critical: 8
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Find markers within a specified radius of a center point
 * @param centerMarker The center marker
 * @param allMarkers All markers to search through
 * @param radiusMeters Radius in meters
 * @returns Array of markers within radius
 */
export function findMarkersInRadius(
  centerMarker: MapMarker,
  allMarkers: MapMarker[],
  radiusMeters: number
): MapMarker[] {
  return allMarkers.filter(marker => {
    if (marker._id === centerMarker._id) return false;
    
    const distance = calculateDistance(
      centerMarker.location.coordinates,
      marker.location.coordinates
    );
    
    return distance <= radiusMeters;
  });
}

/**
 * Calculate the center point of a group of markers
 * @param markers Array of markers
 * @returns Center coordinates
 */
export function calculateClusterCenter(markers: MapMarker[]): Coordinates {
  if (markers.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = markers.reduce(
    (acc, marker) => ({
      lat: acc.lat + marker.location.coordinates.lat,
      lng: acc.lng + marker.location.coordinates.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / markers.length,
    lng: sum.lng / markers.length,
  };
}

/**
 * Determine hotspot type based on marker composition
 * @param markers Array of markers in the hotspot
 * @returns Hotspot type
 */
export function determineHotspotType(markers: MapMarker[]): Hotspot['type'] {
  const types = markers.map(m => m.type);
  const symptomCount = types.filter(t => t === 'symptom_report').length;
  const waterTestCount = types.filter(t => t === 'water_test').length;
  const manualCount = types.filter(t => t === 'manual_marker').length;

  // Determine primary type
  if (symptomCount >= waterTestCount && symptomCount >= manualCount) {
    return symptomCount >= markers.length * 0.7 ? 'symptom_outbreak' : 'mixed';
  } else if (waterTestCount >= symptomCount && waterTestCount >= manualCount) {
    return waterTestCount >= markers.length * 0.7 ? 'water_contamination' : 'mixed';
  } else if (manualCount >= markers.length * 0.7) {
    return 'intervention_zone';
  }

  return 'mixed';
}

/**
 * Calculate hotspot severity based on marker count and individual marker severities
 * @param markers Array of markers in the hotspot
 * @param config Hotspot configuration
 * @returns Severity level
 */
export function calculateHotspotSeverity(
  markers: MapMarker[],
  config: HotspotConfig
): Hotspot['severity'] {
  const count = markers.length;
  
  // Base severity on count
  let baseSeverity: Hotspot['severity'] = 'low';
  if (count >= config.severityThresholds.critical) {
    baseSeverity = 'critical';
  } else if (count >= config.severityThresholds.high) {
    baseSeverity = 'high';
  } else if (count >= config.severityThresholds.medium) {
    baseSeverity = 'medium';
  }

  // Adjust based on individual marker severities
  const criticalMarkers = markers.filter(m => {
    const severity = (m as any).severity || (m as any).riskLevel || (m as any).priority;
    return severity === 'critical';
  }).length;

  const highMarkers = markers.filter(m => {
    const severity = (m as any).severity || (m as any).riskLevel || (m as any).priority;
    return severity === 'high';
  }).length;

  // Upgrade severity if many high/critical individual markers
  if (criticalMarkers >= 2 || (criticalMarkers >= 1 && highMarkers >= 2)) {
    return 'critical';
  } else if (highMarkers >= 3) {
    return baseSeverity === 'low' ? 'medium' : baseSeverity;
  }

  return baseSeverity;
}

/**
 * Detect hotspots from an array of markers
 * @param markers Array of all markers
 * @param config Hotspot detection configuration
 * @returns Array of detected hotspots
 */
export function detectHotspots(
  markers: MapMarker[],
  config: HotspotConfig = DEFAULT_HOTSPOT_CONFIG
): Hotspot[] {
  const hotspots: Hotspot[] = [];
  const processedMarkers = new Set<string>();

  for (const marker of markers) {
    // Skip if this marker is already part of a hotspot
    if (processedMarkers.has(marker._id!)) continue;

    // Find nearby markers
    const nearbyMarkers = findMarkersInRadius(marker, markers, config.radiusMeters);
    const clusterMarkers = [marker, ...nearbyMarkers];

    // Check if this forms a hotspot
    if (clusterMarkers.length >= config.minMarkersForHotspot) {
      const center = calculateClusterCenter(clusterMarkers);
      const type = determineHotspotType(clusterMarkers);
      const severity = calculateHotspotSeverity(clusterMarkers, config);

      const hotspot: Hotspot = {
        id: `hotspot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        center,
        radius: config.radiusMeters,
        markerCount: clusterMarkers.length,
        markers: clusterMarkers,
        severity,
        type,
        detectedAt: new Date().toISOString(),
        alertSent: false,
      };

      hotspots.push(hotspot);

      // Mark all markers in this cluster as processed
      clusterMarkers.forEach(m => processedMarkers.add(m._id!));
    }
  }

  return hotspots;
}

/**
 * Generate hotspot alert message
 * @param hotspot The detected hotspot
 * @returns Alert message object
 */
export function generateHotspotAlert(hotspot: Hotspot) {
  const typeDescriptions = {
    symptom_outbreak: 'Disease Outbreak Detected',
    water_contamination: 'Water Contamination Hotspot',
    intervention_zone: 'Intervention Zone Alert',
    mixed: 'Health Alert Hotspot'
  };

  const severityDescriptions = {
    low: 'Monitor Situation',
    medium: 'Attention Required',
    high: 'Urgent Action Needed',
    critical: 'Emergency Response Required'
  };

  return {
    id: `alert_${hotspot.id}`,
    title: typeDescriptions[hotspot.type],
    message: `${hotspot.markerCount} incidents detected within 1km radius. ${severityDescriptions[hotspot.severity]}.`,
    severity: hotspot.severity,
    location: hotspot.center,
    timestamp: hotspot.detectedAt,
    hotspotId: hotspot.id,
    actionRequired: hotspot.severity === 'critical' || hotspot.severity === 'high',
    estimatedPopulationAffected: Math.min(hotspot.markerCount * 50, 5000), // Rough estimate
  };
}

/**
 * Check if a new marker creates or updates a hotspot
 * @param newMarker The newly added marker
 * @param existingMarkers Array of existing markers
 * @param config Hotspot configuration
 * @returns Hotspot if one is created/updated, null otherwise
 */
export function checkForNewHotspot(
  newMarker: MapMarker,
  existingMarkers: MapMarker[],
  config: HotspotConfig = DEFAULT_HOTSPOT_CONFIG
): Hotspot | null {
  const allMarkers = [...existingMarkers, newMarker];
  const hotspots = detectHotspots(allMarkers, config);
  
  // Find hotspot that contains the new marker
  const relevantHotspot = hotspots.find(hotspot =>
    hotspot.markers.some(marker => marker._id === newMarker._id)
  );

  return relevantHotspot || null;
}

/**
 * Generate a unique hotspot ID
 * @returns A unique hotspot identifier
 */
export function generateHotspotId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `hotspot_${timestamp}_${randomStr}`;
}