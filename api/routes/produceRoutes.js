// Defines all routes related to agricultural produce.

const express = require("express");
const router = express.Router();

const {
  addProduce,
  traceProduce,
  transferProduce,
} = require("../controllers/produceController");

// @route   POST /api/produce/add
router.post("/add", addProduce);

// @route   GET /api/produce/trace/:id
router.get("/trace/:id", traceProduce);

// @route   POST /api/produce/transfer
router.post("/transfer", transferProduce);

module.exports = router;
