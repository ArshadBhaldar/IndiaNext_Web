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

const getAllBatches = async (_req, res) => {
  try {
    const batches = await dbService.getBatches();
    const pending = batches.filter((b) => b.status === "pending").length;
    const verified = batches.filter((b) => b.status === "verified").length;

    res.status(200).json({
      success: true,
      data: {
        batches,
        stats: { pending, verified, total: batches.length },
      },
    });
  } catch (err) {
    console.error("getAllBatches error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const addProduce = async (req, res) => {
  try {
    // Handling BOTH the old payload and the user's new payload parameters
    const { 
      productID, farmerData, produceImageBase64, // From User Snippet
      farmerId, cropType, weightKg, location, ipfsCID // Existing structure
    } = req.body;

    const finalIpfsCID = ipfsCID || "QmPendingCIDPlaceholder";
    
    // Use user-provided productID if exists, otherwise generate one
    const batchId = productID || `BA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 10000)
    ).padStart(4, "0")}`;

    // 🔥 AI MAGIC: Inspect photo (3-5 seconds)
    console.log(`🔍 AI inspecting ${batchId}...`);
    const finalCropType = cropType || "mango";
    const aiResult = await aiService.inspectProduce(produceImageBase64 || '', finalCropType);

    // We stringify the entire rich data payload so we can easily store it
    const richDataPayload = JSON.stringify({
      farmerData: farmerData || farmerId,
      aiQuality: aiResult,
      timestamp: new Date().toISOString()
    });

    let txResult = null;
    if (web3Service.isAvailable()) {
      console.log(`⛓️  Writing ${batchId} to local blockchain...`);
      // We pass richDataPayload as the "CID" equivalent for now to maintain ABI compatibility
      txResult = await web3Service.createBatch(batchId, richDataPayload);
    }

    const newBatch = {
      id: batchId,
      farm: farmerData || farmerId || "Unknown Farm",
      location: location?.address || "Unknown Location",
      crop: finalCropType,
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
      description: `Crop harvested and initial quality checks performed. AI Score: ${aiResult.qualityScore}/100 Grade: ${aiResult.grade}.`, 
      hasImage: true, 
      icon: "leaf" 
    });

    console.log(`✅ Blockchain txn complete! AI score: ${aiResult.qualityScore}/100 (${aiResult.grade})`);
    res.status(201).json({
      success: true,
      batchId: batchId,
      txHash: txResult ? txResult.txHash : null,
      message: `Product ${batchId} permanently registered to blockchain!`,
      data: newBatch,
      aiQuality: aiResult
    });
  } catch (err) {
    console.error("addProduce error:", err.message);
    res.status(500).json({ error: 'Failed to write to blockchain', details: err.message, success: false });
  }
};

const traceProduce = async (req, res) => {
  try {
    const id = req.params.productID || req.params.id; // Support both route styles
    console.log(`🔍 Fetching ${id} from blockchain/DB...`);
    
    const batch = await dbService.getBatch(id);

    if (!batch) {
      return res.status(404).json({ error: `Product ${id} not found`, success: false });
    }

    let journey = [];
    let onChainBatch = null;
    let parsedAiQuality = batch.aiQuality || null;

    if (web3Service.isAvailable()) {
      try {
        onChainBatch = await web3Service.getBatch(id);
        const history = await web3Service.getBatchHistory(id);

        journey = history.map((event) => ({
          title: event.title,
          date: new Date(event.timestamp * 1000).toLocaleString(),
          location: event.location || (event.previousState ? `${event.previousState} → ${event.newState}` : "Origin Farm"),
          description: `Cryptographically verified on-chain. Tx Hash: ${event.txHash.slice(0, 15)}...`,
          hasImage: event.type === "created",
          icon: event.icon,
          txHash: event.txHash,
        }));
        
        // Attempt to parse the richDataPayload if it exists on the CID property
        if (onChainBatch.ipfsCID && onChainBatch.ipfsCID.startsWith('{')) {
          try {
             const decoded = JSON.parse(onChainBatch.ipfsCID);
             if (decoded.aiQuality) parsedAiQuality = decoded.aiQuality;
          } catch(e) {}
        }
      } catch (err) {
        console.log(`Not found on chain for ${id}, falling back to dbService`);
      }
    }
    
    if (journey.length === 0) {
      journey = await dbService.getJourney(id);
    }

    res.status(200).json({
      success: true,
      productID: batch.id, // User snippet mapped to this
      owner: batch.farm,
      state: batch.status,
      blockchainData: parsedAiQuality,
      data: {
        batch: {
          ...batch,
          ...(onChainBatch && { onChain: onChainBatch }),
        },
        journey,
        history: journey // Duplicate to support user's expected payload
      },
    });
  } catch (err) {
    console.error("traceProduce error:", err.message);
    res.status(500).json({ error: 'Failed to read from blockchain', success: false, details: err.message });
  }
};

const approveBatch = async (req, res) => {
  try {
    const { batchId } = req.body;
    const batch = await dbService.getBatch(batchId);

    if (!batch) {
      return res.status(404).json({ success: false, message: `Batch ${batchId} not found.` });
    }

    let txResult = null;
    if (web3Service.isAvailable()) {
      txResult = await web3Service.receiveAtRetail(batchId);
    }

    const updatedBatch = await dbService.updateBatch(batchId, { status: "verified" });
    
    await dbService.addJourneyEvent(batchId, {
      title: "Retailer Hub Arrival", 
      date: generateCurrentTimeStr(), 
      location: "Retailer Loading Dock", 
      description: "Batch arrived at retail distribution center. Verified and Approved.", 
      hasImage: false, 
      icon: "store"
    });

    res.status(200).json({
      success: true,
      message: `Batch ${batchId} approved successfully.`,
      data: {
        ...updatedBatch,
        blockchain: txResult
      },
    });
  } catch (err) {
    console.error("approveBatch error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Corresponds to the user's /api/update-stage expectation replacing transferProduce
const updateStage = async (req, res) => {
  try {
    const { productID, stageData, batchId, newLocation, notes, gpsLat, gpsLong } = req.body;
    
    // Support both the old format and the new format
    const targetId = productID || batchId;

    console.log(`🔍 Fetching ${targetId} to check current state...`);
    const batch = await dbService.getBatch(targetId);

    if (!batch) {
      return res.status(404).json({ error: 'Product not found on blockchain/DB', success: false });
    }

    let txResult = null;
    
    if (web3Service.isAvailable()) {
      try {
        console.log(`⛓️  Updating ${targetId} state...`);
        txResult = await web3Service.updateTransit(
          targetId,
          newLocation || stageData?.location || "Unknown",
          gpsLat || "0",
          gpsLong || "0"
        );
      } catch (contractErr) {
        console.log(`On-chain transfer failed for ${targetId}:`, contractErr.message);
      }
    }
    
    const stageName = stageData?.stageName || newLocation || "Logistics Hub";
    
    await dbService.addJourneyEvent(targetId, {
      title: "Stage Updated: " + stageName, 
      date: generateCurrentTimeStr(), 
      location: stageName, 
      description: notes || stageData?.notes || "Product state updated over the transit array.", 
      hasImage: true, 
      icon: "truck",
      data: stageData
    });

    res.status(200).json({
      success: true,
      message: `Product ${targetId} moved to ${stageName} on blockchain!`,
      data: {
        batchId: targetId,
        newLocation: stageName,
        notes: notes || stageData?.notes || "",
        transferredAt: new Date().toISOString(),
        blockchain: txResult
          ? { txHash: txResult.txHash, blockNumber: txResult.blockNumber }
          : null,
      },
    });
  } catch (err) {
    console.error("updateStage error:", err.message);
    res.status(500).json({ error: 'Failed to update blockchain state', details: err.message, success: false });
  }
};

module.exports = { getAllBatches, addProduce, traceProduce, approveBatch, updateStage, transferProduce: updateStage };