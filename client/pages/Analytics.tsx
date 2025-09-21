import React, { useState } from 'react';
import AnalyticsMap from '@/components/map/AnalyticsMap';
import { Button } from '@/components/ui/button';
import { Plus, Map, BarChart3, Filter } from 'lucide-react';
import { 
  CreateManualMarkerRequest, 
  ManualMarkerType, 
  SeverityLevel, 
  MarkerStatus 
} from '@shared/types/map-markers';

export default function Analytics() {
  const [showAddMarkerForm, setShowAddMarkerForm] = useState(false);
  const [newMarkerData, setNewMarkerData] = useState<Partial<CreateManualMarkerRequest>>({
    title: '',
    description: '',
    markerType: 'info',
    priority: 'medium',
    status: 'active',
    createdBy: 'admin', // In real app, get from auth context
  });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location);
    setNewMarkerData(prev => ({
      ...prev,
      location: {
        address: location.address,
        coordinates: { lat: location.lat, lng: location.lng }
      }
    }));
  };

  const handleSubmitManualMarker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMarkerData.location || !newMarkerData.title || !newMarkerData.description) {
      alert('Please fill in all required fields and select a location');
      return;
    }

    try {
      const response = await fetch('/api/markers/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMarkerData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Marker added successfully!');
        setShowAddMarkerForm(false);
        setNewMarkerData({
          title: '',
          description: '',
          markerType: 'info',
          priority: 'medium',
          status: 'active',
          createdBy: 'admin',
        });
        setSelectedLocation(null);
        // The map will automatically refresh and show the new marker
      } else {
        alert('Failed to add marker: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding marker:', error);
      alert('Error adding marker');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Water Disease Analytics & Hotspot Map
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Add analytics view toggle */}}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Charts View
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAddMarkerForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Marker
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <AnalyticsMap
          allowManualPlacement={false}
          height="100%"
        />
      </div>

      {/* Add Manual Marker Modal */}
      {showAddMarkerForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitManualMarker}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Add Manual Marker</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMarkerForm(false)}
                >
                  ×
                </Button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMarkerData.title || ''}
                    onChange={(e) => setNewMarkerData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Contaminated Water Source"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMarkerData.description || ''}
                    onChange={(e) => setNewMarkerData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide details about this location..."
                  />
                </div>

                {/* Marker Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marker Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMarkerData.markerType || 'info'}
                    onChange={(e) => setNewMarkerData(prev => ({ ...prev, markerType: e.target.value as ManualMarkerType }))}
                  >
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                    <option value="intervention">Intervention</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMarkerData.priority || 'medium'}
                    onChange={(e) => setNewMarkerData(prev => ({ ...prev, priority: e.target.value as SeverityLevel }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMarkerData.status || 'active'}
                    onChange={(e) => setNewMarkerData(prev => ({ ...prev, status: e.target.value as MarkerStatus }))}
                  >
                    <option value="active">Active</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Location Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  {selectedLocation ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-800">
                          Location Selected
                        </div>
                        <div className="text-xs text-green-600">
                          {selectedLocation.address}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLocation(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                      Click "Select Location" button below to choose a location on the map
                    </div>
                  )}
                </div>

                {/* Location Selection Map */}
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <AnalyticsMap
                    allowManualPlacement={true}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                    height="300px"
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
                    zoom={selectedLocation ? 15 : 6}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-6 border-t bg-gray-50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMarkerForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Marker
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
