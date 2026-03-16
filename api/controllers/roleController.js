// Role management controller — admin RBAC operations via smart contract.

const web3Service = require("../services/web3Service");

/**
 * POST /api/roles/grant
 * Body: { address: "0x...", role: "Farmer" | "Logistics" | "Retailer" }
 */
const grantRole = async (req, res) => {
  try {
    const { address, role } = req.body;

    if (!address || !role) {
      return res.status(400).json({
        success: false,
        message: "Both 'address' and 'role' are required.",
      });
    }

    const validRoles = ["Farmer", "Logistics", "Retailer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Valid roles: ${validRoles.join(", ")}`,
      });
    }

    if (!web3Service.isAvailable()) {
      return res.status(200).json({
        success: true,
        message: `Role '${role}' granted to ${address} (mock — blockchain not connected).`,
        data: { address, role, blockchain: null },
      });
    }

    const txResult = await web3Service.grantRole(address, role);

    res.status(200).json({
      success: true,
      message: `Role '${role}' granted to ${address} on-chain.`,
      data: {
        address,
        role,
        blockchain: {
          txHash: txResult.txHash,
          blockNumber: txResult.blockNumber,
        },
      },
    });
  } catch (err) {
    console.error("grantRole error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { grantRole };
