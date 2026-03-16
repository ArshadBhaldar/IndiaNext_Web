// Web3 Service — Bridge between HTTP API and SupplyChain smart contract.
// Uses ethers.js v6 to interact with the blockchain.
// Gracefully falls back to null when CONTRACT_ADDRESS is not configured.

const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// ---- State ----
let provider = null;
let signer = null;
let contract = null;
let isInitialised = false;

// Role enum matching Solidity
const ROLES = {
  None: 0,
  Admin: 1,
  Farmer: 2,
  Logistics: 3,
  Retailer: 4,
};

// BatchState enum matching Solidity
const BATCH_STATES = ["Harvested", "InTransit", "AtRetail", "Sold"];

/**
 * Initialise the Web3 connection. Called once on server startup.
 * If CONTRACT_ADDRESS is missing the service stays dormant.
 */
function init() {
  const rpcUrl = process.env.POLYGON_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress || contractAddress === "your_deployed_contract_address_here") {
    console.log(
      "⚠️  Web3 Service: CONTRACT_ADDRESS not set. Running in mock-data mode."
    );
    return;
  }

  if (!rpcUrl || !privateKey) {
    console.log(
      "⚠️  Web3 Service: POLYGON_RPC_URL or DEPLOYER_PRIVATE_KEY missing. Running in mock-data mode."
    );
    return;
  }

  try {
    // Load the compiled contract ABI
    const artifactPath = path.join(
      __dirname,
      "../../artifacts/contracts/SupplyChain.sol/SupplyChain.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    provider = new ethers.JsonRpcProvider(rpcUrl);
    signer = new ethers.Wallet(privateKey, provider);
    contract = new ethers.Contract(contractAddress, artifact.abi, signer);

    isInitialised = true;
    console.log(`✅ Web3 Service: Connected to contract at ${contractAddress}`);
    console.log(`   Network: ${rpcUrl}`);
    console.log(`   Signer:  ${signer.address}`);
  } catch (err) {
    console.error("❌ Web3 Service: Failed to initialise —", err.message);
  }
}

/**
 * Check if Web3 is available.
 */
function isAvailable() {
  return isInitialised && contract !== null;
}

// ---- Contract Write Functions ----

/**
 * Create a new harvest batch on-chain.
 */
async function createBatch(batchId, ipfsCID) {
  const tx = await contract.createBatch(batchId, ipfsCID);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Log a transit checkpoint (emits CheckpointLogged event).
 */
async function updateTransit(batchId, location, gpsLat, gpsLong) {
  const tx = await contract.updateTransit(batchId, location, gpsLat, gpsLong);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Retailer receives batch (InTransit → AtRetail).
 */
async function receiveAtRetail(batchId) {
  const tx = await contract.receiveAtRetail(batchId);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Mark batch as sold (AtRetail → Sold).
 */
async function markSold(batchId) {
  const tx = await contract.markSold(batchId);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Grant a role to an address. Admin-only.
 */
async function grantRole(address, role) {
  const roleValue = typeof role === "string" ? ROLES[role] : role;
  const tx = await contract.grantRole(address, roleValue);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

// ---- Contract Read Functions ----

/**
 * Get on-chain batch data.
 */
async function getBatch(batchId) {
  const batch = await contract.getBatch(batchId);
  return {
    batchId: batch.batchId,
    farmerAddress: batch.farmerAddress,
    ipfsCID: batch.ipfsCID,
    timestamp: Number(batch.timestamp),
    state: BATCH_STATES[Number(batch.state)] || "Unknown",
  };
}

/**
 * Query CheckpointLogged events to reconstruct transit history.
 * This is the gas-optimised approach — history lives in events, not state.
 */
async function getCheckpointEvents(batchId) {
  const filter = contract.filters.CheckpointLogged(batchId);
  const events = await contract.queryFilter(filter);

  return events.map((event) => ({
    batchId: event.args.batchId,
    handler: event.args.handler,
    location: event.args.location,
    gpsLat: event.args.gpsLat,
    gpsLong: event.args.gpsLong,
    timestamp: Number(event.args.timestamp),
    blockNumber: event.blockNumber,
    txHash: event.transactionHash,
  }));
}

/**
 * Query all events related to a batch (creation + state changes + checkpoints).
 * Returns them in chronological order to build the full provenance timeline.
 */
async function getBatchHistory(batchId) {
  const [createdEvents, stateEvents, checkpointEvents] = await Promise.all([
    contract.queryFilter(contract.filters.BatchCreated(batchId)),
    contract.queryFilter(contract.filters.BatchStateChanged(batchId)),
    contract.queryFilter(contract.filters.CheckpointLogged(batchId)),
  ]);

  const timeline = [];

  // Add batch creation
  for (const e of createdEvents) {
    timeline.push({
      type: "created",
      title: "Harvest & Origin Check",
      icon: "leaf",
      batchId: e.args.batchId,
      farmer: e.args.farmer,
      ipfsCID: e.args.ipfsCID,
      timestamp: Number(e.args.timestamp),
      blockNumber: e.blockNumber,
      txHash: e.transactionHash,
    });
  }

  // Add checkpoints
  for (const e of checkpointEvents) {
    timeline.push({
      type: "checkpoint",
      title: "Transit Checkpoint",
      icon: "truck",
      location: e.args.location,
      gpsLat: e.args.gpsLat,
      gpsLong: e.args.gpsLong,
      handler: e.args.handler,
      timestamp: Number(e.args.timestamp),
      blockNumber: e.blockNumber,
      txHash: e.transactionHash,
    });
  }

  // Add state changes
  for (const e of stateEvents) {
    const newState = BATCH_STATES[Number(e.args.newState)];
    timeline.push({
      type: "state_change",
      title:
        newState === "InTransit"
          ? "In Transit"
          : newState === "AtRetail"
          ? "Retailer Hub Arrival"
          : newState === "Sold"
          ? "Marked as Sold"
          : newState,
      icon: newState === "AtRetail" ? "store" : "truck",
      previousState: BATCH_STATES[Number(e.args.previousState)],
      newState,
      timestamp: Number(e.args.timestamp),
      blockNumber: e.blockNumber,
      txHash: e.transactionHash,
    });
  }

  // Sort by block number, then by log index within the block
  timeline.sort((a, b) => a.blockNumber - b.blockNumber);

  return timeline;
}

module.exports = {
  init,
  isAvailable,
  ROLES,
  BATCH_STATES,
  createBatch,
  updateTransit,
  receiveAtRetail,
  markSold,
  grantRole,
  getBatch,
  getCheckpointEvents,
  getBatchHistory,
};
