import React, { useState } from 'react';
import AnalyticsMap from './AnalyticsMap';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  selectedLocation?: { lat: number; lng: number; address: string } | null;
  onClear?: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  selectedLocation,
  onClear
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    onLocationSelect(location);
    setIsMapOpen(false);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="space-y-4">
      {/* Location Display */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {selectedLocation ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <MapPin className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">
                  Location Selected
                </div>
                <div className="text-xs text-green-600">
                  {selectedLocation.address}
                </div>
                <div className="text-xs text-gray-500">
                  Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div className="text-sm text-gray-600">
                No location selected
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Toggle Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsMapOpen(!isMapOpen)}
        className="w-full"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {isMapOpen ? 'Close Map' : 'Select Location on Map'}
      </Button>

      {/* Map Modal/Panel */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Select Location</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMapOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <AnalyticsMap
                allowManualPlacement={true}
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                height="100%"
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
                zoom={selectedLocation ? 15 : 6}
              />
            </div>

            {/* Instructions */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Click anywhere on the map to select a location for your report.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;