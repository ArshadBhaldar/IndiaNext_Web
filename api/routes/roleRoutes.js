// Routes for RBAC role management.

const express = require("express");
const router = express.Router();

const { grantRole } = require("../controllers/roleController");

// @route   POST /api/roles/grant
// @desc    Grant an RBAC role to a wallet address (admin-only on-chain)
router.post("/grant", grantRole);

module.exports = router;
