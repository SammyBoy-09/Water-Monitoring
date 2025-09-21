import { RequestHandler } from "express";

// In-memory simulated sensor state for smoother values
let state = {
  ph: 7.2,
  turbidity: 2.1,
  temperature: 26.5,
};

export const handleSensors: RequestHandler = async (_req, res) => {
  // TODO: Integrate with ThingsBoard REST API if device and keys are configured.
  // The app is also embedding the public dashboard URL on the frontend for visual parity.
  res.json({
    timestamp: Date.now(),
    data: {
      ph: state.ph,
      turbidity: state.turbidity,
      temperature: state.temperature,
    },
  });
};

export const sendData: RequestHandler = async (req, res) => {
  // TODO: Integrate with ThingsBoard REST API if device and keys are configured.
  // The app is also embedding the public dashboard URL on the frontend for visual parity.
  state = {
    ph: req.body.ph,
    turbidity: req.body.turbidity,
    temperature: req.body.temperature,
  };

  res.json({
    timestamp: Date.now(),
    data: {
      ph: state.ph,
      turbidity: state.turbidity,
      temperature: state.temperature,
    },
  });
};
