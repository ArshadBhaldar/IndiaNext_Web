// =====================================================
// server.js
// Entry point for the IndiaNext Agricultural Supply
// Chain Traceability Backend.
// =====================================================

// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');

// Import route modules
const produceRoutes = require('./api/routes/produceRoutes');

// Initialise Express app
const app = express();

// ---- Middleware ----

// Enable CORS so that a separate frontend (web interface) can
// communicate with this API without being blocked by the browser.
app.use(
  cors({
    origin: '*', // Allow all origins during development; restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Parse incoming JSON payloads (Content-Type: application/json)
app.use(express.json());

// ---- Routes ----

// Health-check / root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'IndiaNext Supply Chain Traceability API is running 🚀',
    version: '1.0.0',
  });
});

// Mount produce-related routes under /api/produce
app.use('/api/produce', produceRoutes);

// ---- Start Server ----

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
