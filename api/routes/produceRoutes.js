// Defines all routes related to agricultural produce.

const express = require("express");
const router = express.Router();

const {
  getAllBatches,
  addProduce,
  traceProduce,
  approveBatch,
  transferProduce,
  updateStage,
} = require("../controllers/produceController");

// @route   GET /api/produce/all
// @desc    Get all incoming batches with stats
router.get("/all", getAllBatches);

// @route   POST /api/produce/add
// @desc    Register a new agricultural batch
router.post("/add", addProduce);

// @route   GET /api/produce/trace/:id
// @desc    Get provenance journey for a batch
router.get("/trace/:id", traceProduce);

// @route   POST /api/produce/approve
// @desc    Approve/verify a batch
router.post("/approve", approveBatch);

// @route   POST /api/produce/transfer
// @desc    Transfer ownership or update location of a batch
router.post("/transfer", transferProduce);


// --- Mapping the user's requested root-level API formats to the produce controller

// @route   POST /api/register-product
router.post("/register-product", addProduce);

// @route   POST /api/update-stage
router.post("/update-stage", updateStage);

// @route   GET /api/trace/:productID
router.get("/trace/:productID", traceProduce);

module.exports = router;
