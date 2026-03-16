// Entry point for the IndiaNext Agricultural Supply Chain Traceability Backend.

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

// Import route modules
const produceRoutes = require("./api/routes/produceRoutes");
const roleRoutes = require("./api/routes/roleRoutes");
const uploadRoutes = require("./api/routes/uploadRoutes");

// Import services
const web3Service = require("./api/services/web3Service");
const ipfsService = require("./api/services/ipfsService");

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
    blockchain: web3Service.isAvailable() ? "connected" : "mock-mode",
    ipfs: ipfsService.isAvailable() ? "connected" : "mock-mode",
  });
});

app.use("/api/produce", produceRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/upload", uploadRoutes);

// ---- Start Server ----

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✅ Server is running on http://localhost:${PORT}`);

  // Initialise services
  web3Service.init();
  ipfsService.init();
  console.log("");
});
