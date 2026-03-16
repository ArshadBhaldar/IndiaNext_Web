// Controllers for agricultural produce operations.
// Uses Web3 when available, falls back to mock data otherwise.

const web3Service = require("../services/web3Service");

// ---- In-memory mock data store (fallback) ----
const mockBatches = [
  { id: "BA-20260302-0007", farm: "Sunvalley Organics", location: "Santa Clara, CA", crop: "Organic Kale", status: "pending" },
  { id: "BA-20260301-1192", farm: "Green Fork Estates", location: "Yuma, AZ", crop: "Romaine Lettuce", status: "pending" },
  { id: "BA-20260228-0884", farm: "Blue Ridge Orchards", location: "Wenatchee, WA", crop: "Honeycrisp Apples", status: "pending" },
  { id: "BA-20260228-0442", farm: "Desert Bloom Farms", location: "Imperial Valley, CA", crop: "Baby Spinach", status: "pending" },
  { id: "BA-20260227-1029", farm: "Highland Meadows", location: "Boise, ID", crop: "Russet Potatoes", status: "pending" },
];

const mockJourneys = {
  "BA-20260302-0007": [
    { title: "Harvest & Origin Check", date: "Mar 10, 2026 · 08:12 AM", location: "Field 4-B, Sunvalley Organics", description: "Crop harvested at peak ripeness. Nitrogen levels and moisture content within organic thresholds. Farmer signature secured via Polygon.", hasImage: true, icon: "leaf" },
    { title: "Cold Chain Logistics", date: "Mar 12, 2026 · 02:17 PM", location: "I-880 Logistics Corridor, Hayward, CA", description: "Batch transferred to temperature-controlled transit. Sensor ID SN-992 monitored 4°C stability. Truck ID: AGRI-TRK-44.", hasImage: true, icon: "truck" },
    { title: "Retailer Hub Arrival", date: "Mar 18, 2026 · 09:21 AM", location: "Retailer Loading Dock #4", description: "Batch arrived at retail distribution center. Condition inspection passed. Awaiting store manager verification.", hasImage: false, icon: "store" },
  ],
};

const defaultJourney = [
  { title: "Harvest & Origin Check", date: "Mar 8, 2026 · 07:30 AM", location: "Origin Farm", description: "Crop harvested and initial quality checks performed. Organic certification verified.", hasImage: true, icon: "leaf" },
  { title: "Cold Chain Logistics", date: "Mar 10, 2026 · 11:00 AM", location: "Regional Logistics Hub", description: "Batch loaded into temperature-controlled transport. Cold chain integrity monitored throughout transit.", hasImage: true, icon: "truck" },
  { title: "Retailer Hub Arrival", date: "Mar 14, 2026 · 08:45 AM", location: "Retailer Loading Dock", description: "Batch arrived at retail distribution center. Pending verification by store manager.", hasImage: false, icon: "store" },
];

// ---- Helpers ----

function formatTimestamp(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ---- Controllers ----

/**
 * GET /api/produce/all — List all incoming batches.
 * Batch catalogue is kept off-chain (mock store) by design.
 */
const getAllBatches = (_req, res) => {
  const pending = mockBatches.filter((b) => b.status === "pending").length;
  const verified = mockBatches.filter((b) => b.status === "verified").length;

  res.status(200).json({
    success: true,
    data: {
      batches: mockBatches,
      stats: { pending, verified, total: mockBatches.length },
    },
  });
};

/**
 * POST /api/produce/add — Create a new batch.
 * If Web3 is available, writes to the smart contract.
 */
const addProduce = async (req, res) => {
  try {
    const { batchName, origin, crop, quantity, unit, farmerName, ipfsCID } = req.body;

    const batchId = `BA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 10000)
    ).padStart(4, "0")}`;

    let txResult = null;

    // Write to blockchain if available
    if (web3Service.isAvailable()) {
      txResult = await web3Service.createBatch(batchId, ipfsCID || "");
    }

    // Also add to in-memory store for the dashboard
    const newBatch = {
      id: batchId,
      farm: farmerName || "Unknown Farm",
      location: origin || "Unknown Origin",
      crop: crop || "Unknown Crop",
      status: "pending",
    };
    mockBatches.unshift(newBatch);

    res.status(201).json({
      success: true,
      message: "Agricultural batch created successfully.",
      data: {
        ...newBatch,
        blockchain: txResult
          ? { txHash: txResult.txHash, blockNumber: txResult.blockNumber }
          : null,
      },
    });
  } catch (err) {
    console.error("addProduce error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/produce/trace/:id — Get provenance journey.
 * If Web3 is available, reconstructs timeline from on-chain events.
 * Otherwise returns mock journey data.
 */
const traceProduce = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = mockBatches.find((b) => b.id === id);

    if (!batch) {
      return res.status(404).json({ success: false, message: `Batch ${id} not found.` });
    }

    let journey;
    let onChainBatch = null;

    if (web3Service.isAvailable()) {
      try {
        // Get on-chain batch data
        onChainBatch = await web3Service.getBatch(id);

        // Reconstruct full timeline from events
        const history = await web3Service.getBatchHistory(id);

        journey = history.map((event) => ({
          title: event.title,
          date: formatTimestamp(event.timestamp),
          location: event.location || event.previousState + " → " + event.newState,
          description: event.type === "created"
            ? `Batch created on-chain. IPFS CID: ${event.ipfsCID || "N/A"}. Farmer: ${event.farmer}.`
            : event.type === "checkpoint"
            ? `Transit checkpoint logged. GPS: ${event.gpsLat}, ${event.gpsLong}. Handler: ${event.handler}.`
            : `State changed from ${event.previousState} to ${event.newState}.`,
          hasImage: event.type === "created",
          icon: event.icon,
          txHash: event.txHash,
          blockNumber: event.blockNumber,
        }));

        // If no on-chain events yet, fall back to mock
        if (journey.length === 0) {
          journey = mockJourneys[id] || defaultJourney;
        }
      } catch (contractErr) {
        // Batch exists locally but not on-chain — use mock
        console.log(`Batch ${id} not found on-chain, using mock journey.`);
        journey = mockJourneys[id] || defaultJourney;
      }
    } else {
      journey = mockJourneys[id] || defaultJourney;
    }

    res.status(200).json({
      success: true,
      data: {
        batch: {
          ...batch,
          ...(onChainBatch && {
            onChain: {
              farmerAddress: onChainBatch.farmerAddress,
              ipfsCID: onChainBatch.ipfsCID,
              state: onChainBatch.state,
              timestamp: onChainBatch.timestamp,
            },
          }),
        },
        journey,
      },
    });
  } catch (err) {
    console.error("traceProduce error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/produce/approve — Approve/verify a batch.
 * If Web3 is available, calls receiveAtRetail on the contract.
 */
const approveBatch = async (req, res) => {
  try {
    const { batchId } = req.body;
    const batch = mockBatches.find((b) => b.id === batchId);

    if (!batch) {
      return res.status(404).json({ success: false, message: `Batch ${batchId} not found.` });
    }

    let txResult = null;

    if (web3Service.isAvailable()) {
      try {
        txResult = await web3Service.receiveAtRetail(batchId);
      } catch (contractErr) {
        console.log(`On-chain approval failed for ${batchId}:`, contractErr.message);
        // Continue with off-chain approval
      }
    }

    batch.status = "verified";

    res.status(200).json({
      success: true,
      message: `Batch ${batchId} approved successfully.`,
      data: {
        ...batch,
        blockchain: txResult
          ? { txHash: txResult.txHash, blockNumber: txResult.blockNumber }
          : null,
      },
    });
  } catch (err) {
    console.error("approveBatch error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/produce/transfer — Transfer ownership.
 */
const transferProduce = async (req, res) => {
  try {
    const { batchId, newOwner, newLocation, notes, gpsLat, gpsLong } = req.body;

    let txResult = null;

    if (web3Service.isAvailable()) {
      try {
        txResult = await web3Service.updateTransit(
          batchId,
          newLocation || "Unknown",
          gpsLat || "0",
          gpsLong || "0"
        );
      } catch (contractErr) {
        console.log(`On-chain transfer failed for ${batchId}:`, contractErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Produce ownership/location updated successfully.",
      data: {
        batchId: batchId || "BATCH-UNKNOWN",
        previousOwner: "Green Valley Farms",
        newOwner: newOwner || "Unknown New Owner",
        newLocation: newLocation || "Unknown Location",
        notes: notes || "",
        transferredAt: new Date().toISOString(),
        blockchain: txResult
          ? { txHash: txResult.txHash, blockNumber: txResult.blockNumber }
          : null,
      },
    });
  } catch (err) {
    console.error("transferProduce error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllBatches, addProduce, traceProduce, approveBatch, transferProduce };
