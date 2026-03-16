// IPFS Service — Pins files and JSON to IPFS via Pinata.
// Falls back gracefully when PINATA_JWT is not configured.

const pinataSDK = require("pinata");

let pinata = null;
let gatewayUrl = null;
let initialised = false;

/**
 * Initialise the Pinata client. Call once on server startup.
 */
function init() {
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";

  if (!jwt || jwt === "your_pinata_jwt_here") {
    console.log("⚠️  IPFS Service: PINATA_JWT not set. File pinning disabled.");
    return;
  }

  try {
    pinata = new pinataSDK.PinataSDK({ pinataJwt: jwt });
    gatewayUrl = gateway;
    initialised = true;
    console.log("✅ IPFS Service: Pinata connected");
    console.log(`   Gateway: ${gatewayUrl}`);
  } catch (err) {
    console.error("❌ IPFS Service: Failed to initialise —", err.message);
  }
}

/**
 * Check if IPFS pinning is available.
 */
function isAvailable() {
  return initialised && pinata !== null;
}

/**
 * Pin a file buffer to IPFS.
 * @param {Buffer} fileBuffer - The file data
 * @param {string} fileName - Original filename
 * @returns {{ cid: string, gatewayUrl: string } | null}
 */
async function pinFile(fileBuffer, fileName) {
  if (!isAvailable()) return null;

  try {
    const blob = new Blob([fileBuffer]);
    const file = new File([blob], fileName, { type: "application/octet-stream" });

    const result = await pinata.upload.file(file);

    const cid = result.cid || result.IpfsHash;
    return {
      cid,
      gatewayUrl: `${gatewayUrl}/${cid}`,
    };
  } catch (err) {
    console.error("IPFS pinFile error:", err.message);
    throw err;
  }
}

/**
 * Pin a JSON object to IPFS (for batch metadata).
 * @param {object} jsonData - The JSON to pin
 * @param {string} name - Descriptive name for the pin
 * @returns {{ cid: string, gatewayUrl: string } | null}
 */
async function pinJSON(jsonData, name) {
  if (!isAvailable()) return null;

  try {
    const result = await pinata.upload.json(jsonData);

    const cid = result.cid || result.IpfsHash;
    return {
      cid,
      gatewayUrl: `${gatewayUrl}/${cid}`,
    };
  } catch (err) {
    console.error("IPFS pinJSON error:", err.message);
    throw err;
  }
}

/**
 * Get the gateway URL for a CID.
 * @param {string} cid
 * @returns {string}
 */
function getFileUrl(cid) {
  const gw = gatewayUrl || "https://gateway.pinata.cloud/ipfs";
  return `${gw}/${cid}`;
}

module.exports = {
  init,
  isAvailable,
  pinFile,
  pinJSON,
  getFileUrl,
};
