import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import './MapStyles.css';
import { MapMarker, SymptomReportMarker, WaterTestMarker, ManualMarker } from '@shared/types/map-markers';

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
        setMarkers(data.markers || []);
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

    return () => {
      delete (window as any).editMarker;
      delete (window as any).deleteMarker;
    };
  }, [fetchMarkers]);

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
    </div>
  );
};

export default AnalyticsMap;