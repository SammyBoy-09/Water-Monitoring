import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import './MapStyles.css';
import { MapMarker, SymptomReportMarker, WaterTestMarker, ManualMarker } from '@shared/types/map-markers';
import { detectHotspots, Hotspot } from '@shared/utils/hotspot-detection';
import { notificationManager } from '@shared/utils/notification-system';
import NotificationPanel from '@/components/notifications/NotificationPanel';

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AnalyticsMapProps {
  onMarkerPlace?: (lat: number, lng: number) => void;
  allowManualPlacement?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

const AnalyticsMap: React.FC<AnalyticsMapProps> = ({
  onMarkerPlace,
  allowManualPlacement = false,
  selectedLocation,
  onLocationSelect,
  height = 'calc(100vh - 80px)',
  center = [20.5937, 78.9629], // Default to India center
  zoom = 6
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualPlacementMode, setIsManualPlacementMode] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'symptom_report' | 'water_test' | 'manual_marker'>('all');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showHotspots, setShowHotspots] = useState(true);
  const hotspotMarkersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize marker cluster group
    const markersCluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let className = 'marker-cluster marker-cluster-small';
        
        if (count >= 10) {
          className = 'marker-cluster marker-cluster-medium';
        }
        if (count >= 50) {
          className = 'marker-cluster marker-cluster-large';
        }

        return L.divIcon({
          html: `<div class="${className}">${count}</div>`,
          className: 'marker-cluster-icon',
          iconSize: [40, 40],
        });
      },
    });

    map.addLayer(markersCluster);

    mapRef.current = map;
    markersClusterRef.current = markersCluster;

    // Handle manual marker placement
    if (allowManualPlacement) {
      map.on('click', (e) => {
        if (isManualPlacementMode) {
          const { lat, lng } = e.latlng;
          
          // Remove previous selected marker
          if (selectedMarkerRef.current) {
            map.removeLayer(selectedMarkerRef.current);
          }

          // Create new selected marker
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'selected-location-marker',
              html: '<div style="background: #10b981; border: 2px solid #059669; border-radius: 50%; width: 20px; height: 20px;"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          });

          marker.addTo(map);
          selectedMarkerRef.current = marker;

          // Reverse geocoding (simplified - you might want to use a proper service)
          const address = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          
          if (onLocationSelect) {
            onLocationSelect({ lat, lng, address });
          }
          
          if (onMarkerPlace) {
            onMarkerPlace(lat, lng);
          }

          setIsManualPlacementMode(false);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, allowManualPlacement, isManualPlacementMode, onMarkerPlace, onLocationSelect]);

  // Update selected location marker
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      // Remove previous selected marker
      if (selectedMarkerRef.current) {
        mapRef.current.removeLayer(selectedMarkerRef.current);
      }

      // Add new selected marker
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: L.divIcon({
          className: 'selected-location-marker',
          html: '<div style="background: #10b981; border: 2px solid #059669; border-radius: 50%; width: 20px; height: 20px;"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      });

      marker.addTo(mapRef.current);
      selectedMarkerRef.current = marker;

      // Center map on selected location
      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
    }
  }, [selectedLocation]);

  // Fetch markers from API
  const fetchMarkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = filterType === 'all' 
        ? '/api/markers'
        : `/api/markers/type/${filterType}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        const fetchedMarkers = data.markers || [];
        setMarkers(fetchedMarkers);
        
        // Detect hotspots whenever markers are updated
        detectAndDisplayHotspots(fetchedMarkers);
      } else {
        console.error('Failed to fetch markers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching markers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  // Load markers on component mount and filter change
  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  // Create marker icon based on type and severity
  const createMarkerIcon = useCallback((marker: MapMarker) => {
    let baseClass = 'custom-marker';
    let color = '#3b82f6';
    let symbol = '●';

    switch (marker.type) {
      case 'symptom_report':
        baseClass += ' symptom-marker';
        symbol = '🏥';
        break;
      case 'water_test':
        baseClass += ' water-test-marker';
        symbol = '💧';
        break;
      case 'manual_marker':
        baseClass += ' manual-marker';
        symbol = '📍';
        break;
    }

    // Add severity class
    const severity = (marker as any).severity || (marker as any).riskLevel || (marker as any).priority || 'medium';
    baseClass += ` severity-${severity}`;

    return L.divIcon({
      className: baseClass,
      html: `<div style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">${symbol}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }, []);

  // Create popup content for markers
  const createPopupContent = useCallback((marker: MapMarker) => {
    const severity = (marker as any).severity || (marker as any).riskLevel || (marker as any).priority || 'medium';
    
    let content = `
      <div class="popup-header">${
        marker.type.charAt(0).toUpperCase() + marker.type.slice(1).replace('_', ' ')
      }</div>
      <div class="popup-detail"><strong>Location:</strong> ${marker.location.address}</div>
      <div class="popup-detail"><strong>Date:</strong> ${new Date(marker.createdAt).toLocaleDateString()}</div>
      <div class="popup-detail">
        <strong>Severity:</strong> 
        <span class="popup-severity ${severity}">${severity}</span>
      </div>
    `;

    switch (marker.type) {
      case 'symptom_report':
        const symptomMarker = marker as SymptomReportMarker;
        content += `
          <div class="popup-detail"><strong>Symptoms:</strong> ${symptomMarker.symptoms.join(', ')}</div>
          <div class="popup-detail"><strong>Affected Count:</strong> ${symptomMarker.affectedCount}</div>
          ${symptomMarker.notes ? `<div class="popup-detail"><strong>Notes:</strong> ${symptomMarker.notes}</div>` : ''}
        `;
        break;
      case 'water_test':
        const waterMarker = marker as WaterTestMarker;
        content += `
          <div class="popup-detail"><strong>Kit Used:</strong> ${waterMarker.kitUsed}</div>
          <div class="popup-detail"><strong>Test Results:</strong></div>
          <ul style="margin: 4px 0 4px 20px;">
            ${Object.entries(waterMarker.testResults).map(([key, value]) => 
              `<li>${key}: ${value}</li>`
            ).join('')}
          </ul>
        `;
        break;
      case 'manual_marker':
        const manualMarker = marker as ManualMarker;
        content += `
          <div class="popup-detail"><strong>Title:</strong> ${manualMarker.title}</div>
          <div class="popup-detail"><strong>Description:</strong> ${manualMarker.description}</div>
          <div class="popup-detail"><strong>Status:</strong> ${manualMarker.status}</div>
        `;
        break;
    }

    content += `
      <div class="popup-actions">
        <button class="popup-action-button" onclick="window.editMarker('${marker._id}')">Edit</button>
        <button class="popup-action-button danger" onclick="window.deleteMarker('${marker._id}')">Delete</button>
      </div>
    `;

    return content;
  }, []);

  // Hotspot detection and display functions
  const detectAndDisplayHotspots = useCallback((currentMarkers: MapMarker[]) => {
    // Detect hotspots using the detection algorithm
    const detectedHotspots = detectHotspots(currentMarkers, {
      minMarkersForHotspot: 3,
      radiusMeters: 1000, // 1km radius
      severityThresholds: {
        medium: 3,
        high: 5,
        critical: 8
      }
    });

    // Update hotspots state
    setHotspots(detectedHotspots);

    // Send notifications for new critical hotspots
    detectedHotspots.forEach(hotspot => {
      if (hotspot.severity === 'critical' || hotspot.severity === 'high') {
        // Check if we've already notified about this hotspot
        const existingNotifications = notificationManager.getNotifications();
        const alreadyNotified = existingNotifications.some(
          notification => 
            Math.abs(notification.location.lat - hotspot.center.lat) < 0.001 &&
            Math.abs(notification.location.lng - hotspot.center.lng) < 0.001 &&
            notification.severity === hotspot.severity
        );

        if (!alreadyNotified) {
          notificationManager.createHotspotNotification(hotspot);
        }
      }
    });

    // Display hotspots on map
    displayHotspotsOnMap(detectedHotspots);
  }, []);

  const displayHotspotsOnMap = useCallback((hotspotsToDisplay: Hotspot[]) => {
    if (!mapRef.current) return;

    // Clear existing hotspot markers
    if (hotspotMarkersRef.current) {
      mapRef.current.removeLayer(hotspotMarkersRef.current);
    }

    if (!showHotspots || hotspotsToDisplay.length === 0) return;

    // Create new hotspot layer group
    hotspotMarkersRef.current = L.layerGroup();

    hotspotsToDisplay.forEach(hotspot => {
      // Create hotspot circle
      const hotspotCircle = L.circle([hotspot.center.lat, hotspot.center.lng], {
        radius: hotspot.radius,
        fillColor: getHotspotColor(hotspot.severity),
        color: getHotspotColor(hotspot.severity),
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2,
        className: `hotspot-${hotspot.severity}`
      });

      // Create pulsing marker for hotspot center
      const hotspotMarker = L.marker([hotspot.center.lat, hotspot.center.lng], {
        icon: L.divIcon({
          className: `hotspot-marker hotspot-${hotspot.severity}`,
          html: `
            <div class="hotspot-pulse">
              <div class="hotspot-core">
                <span class="hotspot-icon">${getHotspotIcon(hotspot.severity)}</span>
                <span class="hotspot-count">${hotspot.markerCount}</span>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      });

      // Create popup for hotspot
      const popupContent = `
        <div class="hotspot-popup">
          <h3>${hotspot.severity.toUpperCase()} HOTSPOT</h3>
          <p><strong>Markers:</strong> ${hotspot.markerCount}</p>
          <p><strong>Radius:</strong> ${Math.round(hotspot.radius)}m</p>
          <p><strong>Type:</strong> ${hotspot.type.replace('_', ' ')}</p>
          <p><strong>Detected:</strong> ${new Date(hotspot.detectedAt).toLocaleString()}</p>
          <div class="hotspot-actions">
            <button onclick="window.acknowledgeHotspot('${hotspot.id}')" class="btn btn-primary">
              Acknowledge
            </button>
            <button onclick="window.viewHotspotDetails('${hotspot.id}')" class="btn btn-secondary">
              View Details
            </button>
          </div>
        </div>
      `;

      hotspotMarker.bindPopup(popupContent);

      // Add to layer group
      hotspotMarkersRef.current?.addLayer(hotspotCircle);
      hotspotMarkersRef.current?.addLayer(hotspotMarker);
    });

    // Add to map
    hotspotMarkersRef.current.addTo(mapRef.current);
  }, [showHotspots]);

  const getHotspotColor = (severity: string): string => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getHotspotIcon = (severity: string): string => {
    switch (severity) {
      case 'low': return '🟡';
      case 'medium': return '🟠';
      case 'high': return '🔴';
      case 'critical': return '🚨';
      default: return '⚠️';
    }
  };

  const handleNavigateToHotspot = useCallback((location: { lat: number; lng: number }, hotspotId: string) => {
    if (!mapRef.current) return;
    
    // Pan to hotspot location
    mapRef.current.setView([location.lat, location.lng], 15, {
      animate: true,
      duration: 1.0
    });

    // Find and open the hotspot popup
    setTimeout(() => {
      if (hotspotMarkersRef.current) {
        hotspotMarkersRef.current.eachLayer((layer: any) => {
          if (layer instanceof L.Marker && layer.getLatLng().equals([location.lat, location.lng])) {
            layer.openPopup();
          }
        });
      }
    }, 1000);
  }, []);

  // Update hotspot display when showHotspots toggle changes
  useEffect(() => {
    displayHotspotsOnMap(hotspots);
  }, [showHotspots, hotspots, displayHotspotsOnMap]);

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current || !markersClusterRef.current) return;

    // Clear existing markers
    markersClusterRef.current.clearLayers();

    // Add new markers
    markers.forEach((marker) => {
      const leafletMarker = L.marker(
        [marker.location.coordinates.lat, marker.location.coordinates.lng],
        { icon: createMarkerIcon(marker) }
      );

      leafletMarker.bindPopup(createPopupContent(marker));
      markersClusterRef.current!.addLayer(leafletMarker);
    });
  }, [markers, createMarkerIcon, createPopupContent]);

  // Global functions for popup actions
  useEffect(() => {
    (window as any).editMarker = (id: string) => {
      console.log('Edit marker:', id);
      // Implement edit functionality
    };

    (window as any).deleteMarker = async (id: string) => {
      if (confirm('Are you sure you want to delete this marker?')) {
        try {
          const response = await fetch(`/api/markers/${id}`, { method: 'DELETE' });
          const data = await response.json();
          
          if (data.success) {
            fetchMarkers(); // Refresh markers
          } else {
            alert('Failed to delete marker');
          }
        } catch (error) {
          console.error('Error deleting marker:', error);
          alert('Error deleting marker');
        }
      }
    };

    // Hotspot action functions
    (window as any).acknowledgeHotspot = async (hotspotId: string) => {
      try {
        const response = await fetch(`/api/hotspots/${hotspotId}/acknowledge`, { method: 'PATCH' });
        const data = await response.json();
        
        if (response.ok) {
          alert('Hotspot acknowledged successfully');
          // Refresh hotspots
          fetchMarkers();
        } else {
          alert('Failed to acknowledge hotspot');
        }
      } catch (error) {
        console.error('Error acknowledging hotspot:', error);
        alert('Error acknowledging hotspot');
      }
    };

    (window as any).viewHotspotDetails = (hotspotId: string) => {
      // Find the hotspot in current hotspots
      const hotspot = hotspots.find(h => h.id === hotspotId);
      if (hotspot) {
        alert(`Hotspot Details:\n\nID: ${hotspot.id}\nSeverity: ${hotspot.severity}\nMarkers: ${hotspot.markerCount}\nRadius: ${Math.round(hotspot.radius)}m\nType: ${hotspot.type}\nDetected: ${new Date(hotspot.detectedAt).toLocaleString()}`);
      }
    };

    return () => {
      delete (window as any).editMarker;
      delete (window as any).deleteMarker;
      delete (window as any).acknowledgeHotspot;
      delete (window as any).viewHotspotDetails;
    };
  }, [fetchMarkers, hotspots]);

  return (
    <div className="map-container" style={{ height }}>
      {/* Map Controls */}
      <div className="map-controls">
        {/* Filter Controls */}
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as any)}
          className="map-control-button"
        >
          <option value="all">All Markers</option>
          <option value="symptom_report">Symptom Reports</option>
          <option value="water_test">Water Tests</option>
          <option value="manual_marker">Manual Markers</option>
        </select>

        {/* Manual Placement Toggle */}
        {allowManualPlacement && (
          <button
            className={`map-control-button ${isManualPlacementMode ? 'active' : ''}`}
            onClick={() => setIsManualPlacementMode(!isManualPlacementMode)}
          >
            {isManualPlacementMode ? 'Cancel Placement' : 'Add Marker'}
          </button>
        )}

        {/* Refresh Button */}
        <button
          className="map-control-button"
          onClick={fetchMarkers}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>

        {/* Hotspot Toggle */}
        <button
          className={`map-control-button ${showHotspots ? 'active' : ''}`}
          onClick={() => setShowHotspots(!showHotspots)}
        >
          🚨 Hotspots ({hotspots.length})
        </button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="map-fullscreen"
        style={{ height }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="map-loading">
          Loading markers...
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel onNavigateToHotspot={handleNavigateToHotspot} />
    </div>
  );
};

export default AnalyticsMap;