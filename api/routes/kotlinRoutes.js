const express = require("express");
const router = express.Router();

const {
  getFarmerDashboard,
  mintHarvest,
  getTransitState,
  logCheckpoint,
  getRetailerDashboard,
  verifyQR
} = require("../controllers/kotlinAppController");

// ==========================================
// 1. Farmer API (Minting & Onboarding)
// ==========================================
router.get("/farmer/dashboard/:farmerId", getFarmerDashboard);
router.post("/farmer/harvest/mint", mintHarvest);

// ==========================================
// 2. Logistics & IoT Checkpoints
// ==========================================
router.get("/logistics/transit/:batchId", getTransitState);
router.post("/logistics/checkpoint", logCheckpoint);

// ==========================================
// 3. Retailer Dashboard
// ==========================================
router.get("/retailer/dashboard/:retailerId", getRetailerDashboard);

// ==========================================
// 4. Universal Verification Scanner
// ==========================================
router.get("/verify/:hash", verifyQR);

module.exports = router;
