const web3Service = require("../services/web3Service");
const dbService = require("../services/dbService");
const aiService = require("../services/aiService");

function generateCurrentTimeStr() {
  const d = new Date();
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ==========================================
// 1. Farmer API (Minting & Onboarding)
// ==========================================

const getFarmerDashboard = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const allBatches = await dbService.getBatches();
    
    // Filter for this farmer
    const farmerBatches = allBatches.filter(b => b.farm === farmerId);
    
    const seasonTotalKg = farmerBatches.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);
    
    // Map to a lightweight history format for the Android UI
    const recentHistory = farmerBatches.slice(0, 5).map(b => ({
      batchId: b.id,
      cropTitle: b.crop,
      date: b.createdAt.split('T')[0],
      status: b.status === "verified" ? "Verified" : "Pending"
    }));

    res.status(200).json({
      seasonTotalKg,
      recentHistory
    });
  } catch (err) {
    console.error("getFarmerDashboard error:", err.message);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

const mintHarvest = async (req, res) => {
  try {
    const { farmerId, cropType, weightKg, harvestDate, location, proofImageBase64 } = req.body;
    
    // 1. Generate Batch ID mapping to the Android expectation
    const batchId = `#0x${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}`;

    // 2. AI Inspection
    console.log(`🔍 AI inspecting harvest for ${farmerId}...`);
    const aiResult = await aiService.inspectProduce(proofImageBase64 || '', cropType);

    // 3. Prepare Blockchain Payload
    const richDataPayload = JSON.stringify({
      farmerData: farmerId,
      harvestDate,
      aiQuality: aiResult,
      timestamp: new Date().toISOString()
    });

    // 4. Write to smart contract
    let txResult = null;
    if (web3Service.isAvailable()) {
      console.log(`⛓️  Writing ${batchId} to local blockchain...`);
      txResult = await web3Service.createBatch(batchId, richDataPayload);
    }

    // 5. Store DB representation for Dashboard interoperability
    const newBatch = {
      id: batchId,
      farm: farmerId || "Unknown Farmer",
      location: location?.address || "Unknown Location",
      crop: cropType,
      status: "pending",
      weightKg: weightKg || 0,
      aiQuality: aiResult,
      createdAt: new Date().toISOString()
    };
    await dbService.saveBatch(newBatch);

    await dbService.addJourneyEvent(batchId, { 
      title: "Harvest & Origin Check", 
      date: generateCurrentTimeStr(), 
      location: location?.address || "Origin Farm", 
      description: `Crop harvested on ${harvestDate}. AI Score: ${aiResult.qualityScore}/100 Grade: ${aiResult.grade}.`, 
      hasImage: true, 
      icon: "leaf" 
    });

    // Exactly matches the Kotlin Data Class expectation
    res.status(201).json({
      success: true,
      batchId: batchId,
      txHash: txResult ? txResult.txHash : "0xmockhash1234567890abcdef1234567890def456",
      message: "Blockchain Minting Successful"
    });
  } catch (err) {
    console.error("mintHarvest error:", err.message);
    res.status(500).json({ success: false, message: 'Failed to write to blockchain' });
  }
};

// ==========================================
// 2. Logistics & IoT Checkpoints
// ==========================================

const getTransitState = async (req, res) => {
  try {
    const { batchId } = req.params;
    const journey = await dbService.getJourney(batchId);
    
    if (!journey || journey.length === 0) {
      return res.status(404).json({ error: "Transit not found" });
    }

    const lastEvent = journey[journey.length - 1];

    res.status(200).json({
      batchId: `Batch ${batchId}`,
      route: "In Transit: Farm -> Distribution Hub",
      nodeId: "NODE_ID: LGS-882", // Mocking IoT sensor ID
      isNetworkLive: web3Service.isAvailable(),
      telemetry: {
        locationName: lastEvent.location,
        coordinates: lastEvent.data?.coordinates || "(73.921, 18.512)",
        temperature: lastEvent.data?.temperature || "4.2°C",
        signalStrength: "88%",
        battery: "External",
        batteryLevel: 98,
        lastSync: "Just Now"
      },
      recentEvents: journey.slice(-3).reverse().map(e => ({
        title: e.title,
        time: e.date.split('·')[1]?.trim() || "12:00 PM",
        status: "NODE_SYNC_OK"
      }))
    });
  } catch (err) {
    console.error("getTransitState error:", err.message);
    res.status(500).json({ error: "Failed to load transit state" });
  }
};

const logCheckpoint = async (req, res) => {
  try {
    const { batchId, location, coordinates, temperature } = req.body;
    
    if (web3Service.isAvailable()) {
       await web3Service.updateTransit(batchId, location, "0", "0");
    }

    await dbService.addJourneyEvent(batchId, {
      title: "Cold Chain Verified", 
      date: generateCurrentTimeStr(), 
      location: location || "Logistics Hub", 
      description: "Automated IoT or Driver swipe checkpoint.", 
      hasImage: false, 
      icon: "truck",
      data: { coordinates, temperature }
    });

    res.status(200).json({ success: true, message: "Checkpoint Logged" });
  } catch (err) {
    console.error("logCheckpoint error:", err.message);
    res.status(500).json({ error: "Failed to log checkpoint" });
  }
};

// ==========================================
// 3. Retailer Dashboard
// ==========================================

const getRetailerDashboard = async (req, res) => {
  try {
    const { retailerId } = req.params;
    const allBatches = await dbService.getBatches();
    
    // Find batches that are pending / inbound
    const inboundBatches = allBatches.filter(b => b.status === "pending");

    res.status(200).json({
      pulseMetrics: {
        throughputIncreasePercentage: 12,
        chartData: [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5, 0.95, 0.7]
      },
      incomingShipments: inboundBatches.map(b => ({
        batchId: b.id,
        supplierName: b.farm,
        eta: "Estimated in 2h",
        qualityScore: b.aiQuality ? `${b.aiQuality.qualityScore}% Quality Check` : "Pending Inspection",
        statusText: "Awaiting Scan"
      }))
    });
  } catch (err) {
    console.error("getRetailerDashboard error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

// ==========================================
// 4. Universal Verification Scanner
// ==========================================

const verifyQR = async (req, res) => {
  try {
    const { hash } = req.params;
    
    // We treat 'hash' as the batchId for the MVP
    const batch = await dbService.getBatch(hash);

    if (!batch) {
       return res.status(404).json({ isValid: false, status: "Fraudulent/Unknown" });
    }

    res.status(200).json({
      isValid: true,
      batchId: batch.id,
      status: "Authentic",
      aiScore: batch.aiQuality?.qualityScore || 0,
      gradeTitle: `Grade ${batch.aiQuality?.grade || "N/A"}`,
      gradeDesc: batch.aiQuality?.analysisNotes || "No notes available",
      network: web3Service.isAvailable() ? "Polygon Amoy" : "Mock Localnet",
      origin: batch.farm
    });

  } catch (err) {
    console.error("verifyQR error:", err.message);
    res.status(500).json({ error: "Failed to verify" });
  }
};

module.exports = {
  getFarmerDashboard,
  mintHarvest,
  getTransitState,
  logCheckpoint,
  getRetailerDashboard,
  verifyQR
};
