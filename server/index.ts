import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createReport, listReports } from "./routes/reports";
import { handleSensors, sendData } from "./routes/sensors";
import { 
  getAllMarkers, 
  getMarkersByType, 
  createSymptomReport, 
  createWaterTest, 
  createManualMarker,
  updateMarker,
  deleteMarker,
  getMarkersInBounds
} from "./routes/markers";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Reports API
  app.post("/api/reports", createReport);
  app.get("/api/reports", listReports);

  // Sensors API (simulated with optional TB integration)
  app.get("/api/sensors", handleSensors);
  app.post("/api/sensors", sendData);

  // Map Markers API
  app.get("/api/markers", getAllMarkers);
  app.get("/api/markers/type/:type", getMarkersByType);
  app.get("/api/markers/bounds", getMarkersInBounds);
  app.post("/api/markers/symptom-report", createSymptomReport);
  app.post("/api/markers/water-test", createWaterTest);
  app.post("/api/markers/manual", createManualMarker);
  app.put("/api/markers/:id", updateMarker);
  app.delete("/api/markers/:id", deleteMarker);

  return app;
}
