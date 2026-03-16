// Entry point for the IndiaNext Agricultural Supply Chain Traceability Backend.

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

// Import route modules
const produceRoutes = require("./api/routes/produceRoutes");

// Initialise Express app
const app = express();

// ---- Middleware ----

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// ---- Routes ----

app.get("/", (_req, res) => {
  res.json({
    message: "IndiaNext Supply Chain Traceability API is running 🚀",
    version: "1.0.0",
  });
});

app.use("/api/produce", produceRoutes);

// ---- Start Server ----

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
