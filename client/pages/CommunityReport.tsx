import { useState } from "react";
import { Button } from "@/components/ui/button";
import LocationPicker from "@/components/map/LocationPicker";
import { CreateSymptomReportRequest, SeverityLevel } from "@shared/types/map-markers";

const symptomsOptions = [
  "Diarrhea",
  "Vomiting",
  "Fever",
  "Abdominal pain",
  "Skin rashes",
  "Other",
];

export default function CommunityReport() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [locationText, setLocationText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [affectedCount, setAffectedCount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("medium");
  const [status, setStatus] = useState<string>("");

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation && !locationText) {
      setStatus("Please select a location on the map or enter a location manually");
      return;
    }

    setStatus("Submitting...");
    try {
      // Create symptom report with location data
      const symptomReportData: CreateSymptomReportRequest = {
        date,
        location: selectedLocation ? {
          address: selectedLocation.address || locationText,
          coordinates: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng
          }
        } : {
          address: locationText,
          coordinates: { lat: 0, lng: 0 } // Default coordinates if no map location
        },
        symptoms,
        affectedCount,
        notes: notes || "",
        severity,
        reportedBy: "community_user" // In real app, get from auth context
      };

      // Submit to both endpoints - old reports API and new markers API
      const [reportsRes, markersRes] = await Promise.all([
        fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            location: selectedLocation?.address || locationText,
            symptoms,
            affectedCount,
            notes,
          }),
        }),
        fetch("/api/markers/symptom-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(symptomReportData),
        })
      ]);

      if (!reportsRes.ok || !markersRes.ok) {
        throw new Error("Failed to submit report");
      }

      setStatus("Report submitted successfully! It will appear on the analytics map.");
      
      // Reset form
      setLocationText("");
      setSelectedLocation(null);
      setSymptoms([]);
      setAffectedCount(0);
      setNotes("");
      setSeverity("medium");
    } catch (err: any) {
      setStatus(err.message || "Submission failed");
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        Community Reporting
      </h1>
      <p className="text-foreground/70 mb-6">
        Help health officials by submitting observations. Data is stored
        securely.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
        {/* Location Selection */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Location *</label>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter location manually (or use map below)"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              onClear={() => setSelectedLocation(null)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {symptomsOptions.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => toggleSymptom(opt)}
                className={
                  "px-3 py-1.5 rounded-full border text-sm " +
                  (symptoms.includes(opt)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Number of Affected Individuals
          </label>
          <input
            type="number"
            min={0}
            value={affectedCount}
            onChange={(e) =>
              setAffectedCount(parseInt(e.target.value || "0", 10))
            }
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Severity Level</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="low">Low - Minor symptoms, few affected</option>
            <option value="medium">Medium - Moderate symptoms</option>
            <option value="high">High - Severe symptoms, many affected</option>
            <option value="critical">Critical - Emergency situation</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 min-h-28"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" className="px-6">
            Submit Report
          </Button>
          <span className="text-sm text-foreground/60">{status}</span>
        </div>
      </form>
    </section>
  );
}
