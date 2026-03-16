// =====================================================
// produceRoutes.js
// Defines all routes related to agricultural produce.
// =====================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  addProduce,
  traceProduce,
  transferProduce,
} = require('../controllers/produceController');

// @route   POST /api/produce/add
// @desc    Register a new agricultural batch
router.post('/add', addProduce);

// @route   GET /api/produce/trace/:id
// @desc    Get full traceability / supply chain history for a batch
router.get('/trace/:id', traceProduce);

// @route   POST /api/produce/transfer
// @desc    Transfer ownership or update location of a batch
router.post('/transfer', transferProduce);

module.exports = router;
