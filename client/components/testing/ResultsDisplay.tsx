import { useState } from 'react';
import { KitTestResult } from '@shared/types/testing-kits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Info, RotateCcw, MapPin, Save } from 'lucide-react';
import LocationPicker from '@/components/map/LocationPicker';
import { CreateWaterTestRequest, SeverityLevel } from '@shared/types/map-markers';

interface ResultsDisplayProps {
  results: KitTestResult;
  onRunNewTest: () => void;
  onBackToKitSelection: () => void;
}

export default function ResultsDisplay({ results, onRunNewTest, onBackToKitSelection }: ResultsDisplayProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-5 w-5" />;
      case 'medium': return <AlertTriangle className="h-5 w-5" />;
      case 'high': return <XCircle className="h-5 w-5" />;
    }
  };

  const getRiskBadgeVariant = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
    }
  };

  const criticalResults = results.results.filter(r => r.isInCriticalRange);
  const confidencePercentage = Math.round(results.confidence * 100);

  // Convert test results to risk level for markers
  const getRiskLevelForMarker = (overallRisk: 'low' | 'medium' | 'high'): SeverityLevel => {
    switch (overallRisk) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return criticalResults.length > 0 ? 'critical' : 'high';
    }
  };

  const saveToMap = async () => {
    if (!selectedLocation) {
      setSaveStatus('Please select a location first');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving...');

    try {
      // Convert test results to a simple format
      const testResultsData: Record<string, any> = {};
      results.results.forEach(result => {
        testResultsData[result.parameter.name] = result.value;
      });

      // Generate recommendations based on critical results
      const recommendations: string[] = [];
      if (criticalResults.length > 0) {
        recommendations.push('Water treatment required before consumption');
        recommendations.push('Consider boiling water for at least 1 minute');
        criticalResults.forEach(result => {
          recommendations.push(`Address ${result.parameter.name} levels - see ${result.parameter.pathogen_risk}`);
        });
      } else if (results.overallRisk === 'medium') {
        recommendations.push('Monitor water quality regularly');
        recommendations.push('Consider water filtration system');
      } else {
        recommendations.push('Water quality appears acceptable');
        recommendations.push('Continue regular monitoring');
      }

      const waterTestData: CreateWaterTestRequest = {
        location: {
          address: selectedLocation.address,
          coordinates: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng
          }
        },
        testResults: testResultsData,
        kitUsed: results.kit.kit,
        riskLevel: getRiskLevelForMarker(results.overallRisk),
        recommendations,
        testedBy: 'field_agent' // In real app, get from auth context
      };

      const response = await fetch('/api/markers/water-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waterTestData),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('Successfully saved to map! Results will appear in analytics.');
        setShowLocationPicker(false);
      } else {
        setSaveStatus('Failed to save: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving to map:', error);
      setSaveStatus('Error saving results to map');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Results</h2>
          <p className="text-gray-600">{results.kit.kit}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBackToKitSelection}>
            ← Different Kit
          </Button>
          <Button onClick={onRunNewTest}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Overall Risk Summary */}
      <Card className={`border-2 ${getRiskColor(results.overallRisk)}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getRiskIcon(results.overallRisk)}
            <div>
              <CardTitle className="flex items-center gap-2">
                Overall Risk Level: 
                <Badge variant={getRiskBadgeVariant(results.overallRisk)} className="ml-2">
                  {results.overallRisk.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Analysis confidence: {confidencePercentage}%
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={confidencePercentage} className="mb-4" />
          {results.overallRisk === 'high' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Immediate attention required:</strong> {criticalResults.length} parameter(s) are in critical ranges. 
                Water may not be safe for consumption without treatment.
              </AlertDescription>
            </Alert>
          )}
          {results.overallRisk === 'medium' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Caution advised:</strong> Some parameters indicate potential risks. 
                Consider water treatment or further testing.
              </AlertDescription>
            </Alert>
          )}
          {results.overallRisk === 'low' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Good water quality:</strong> All tested parameters are within acceptable ranges.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Parameter Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Parameter Details</h3>
        <div className="grid gap-4">
          {results.results.map((result, index) => (
            <Card 
              key={index} 
              className={result.isInCriticalRange ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {result.parameter.name}
                      {result.isInCriticalRange ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Your result: <strong>{result.value}{typeof result.value === 'number' ? ' units' : ''}</strong>
                    </CardDescription>
                  </div>
                  <Badge variant={getRiskBadgeVariant(result.riskLevel)}>
                    {result.riskLevel} Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Critical Range:</strong>
                    <p className="text-red-600">{result.parameter.critical_range}</p>
                  </div>
                  <div>
                    <strong>Confidence:</strong>
                    <p>{Math.round(result.parameter.confidence_score * 100)}%</p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <strong>Health Risk:</strong>
                  <p className="text-gray-700">{result.parameter.pathogen_risk}</p>
                </div>
                
                {result.parameter.associated_diseases.length > 0 && (
                  <div className="text-sm">
                    <strong>Associated Diseases:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.parameter.associated_diseases.map((disease, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {disease}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.isInCriticalRange && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This parameter is outside the safe range. Consider water treatment or consult a water quality professional.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.overallRisk === 'high' && (
            <div className="space-y-2">
              <p className="font-medium text-red-600">Immediate Actions Required:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Do not consume water without proper treatment</li>
                <li>Consider boiling water for at least 1 minute before use</li>
                <li>Contact local health authorities or water quality professionals</li>
                <li>Test water from alternative sources</li>
              </ul>
            </div>
          )}
          
          {results.overallRisk === 'medium' && (
            <div className="space-y-2">
              <p className="font-medium text-yellow-600">Precautionary Measures:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Consider basic water treatment (filtration, boiling)</li>
                <li>Monitor water quality regularly</li>
                <li>Avoid using water for vulnerable populations (infants, elderly, immunocompromised)</li>
              </ul>
            </div>
          )}

          {results.overallRisk === 'low' && (
            <div className="space-y-2">
              <p className="font-medium text-green-600">Maintenance Recommendations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Continue regular water quality monitoring</li>
                <li>Maintain proper water storage practices</li>
                <li>Keep water sources clean and protected</li>
              </ul>
            </div>
          )}
          
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> These results are based on field testing and should be supplemented with laboratory analysis 
              for definitive water quality assessment, especially for drinking water supplies.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save to Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Save Results to Analytics Map
          </CardTitle>
          <CardDescription>
            Add this test result to the water quality monitoring map for tracking and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showLocationPicker ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Share your test results</p>
                <p className="text-sm text-gray-600">
                  Help build a comprehensive water quality database by saving your results to the map.
                </p>
              </div>
              <Button onClick={() => setShowLocationPicker(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                Add to Map
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <LocationPicker
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                onClear={() => setSelectedLocation(null)}
              />
              
              {saveStatus && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{saveStatus}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <Button 
                  onClick={saveToMap} 
                  disabled={!selectedLocation || isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save to Map'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowLocationPicker(false);
                    setSaveStatus('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}