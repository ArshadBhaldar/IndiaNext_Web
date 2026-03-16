// =====================================================
// produceController.js
// Controllers for agricultural produce operations.
// Returns mock data until the database layer is set up.
// =====================================================

/**
 * @desc    Add a new agricultural batch to the system
 * @route   POST /api/produce/add
 * @access  Public (will be protected later)
 */
const addProduce = (req, res) => {
  // Extract the batch details sent in the request body
  const { batchName, origin, crop, quantity, unit, farmerName } = req.body;

  // Return a mock success response with a generated batch ID
  res.status(201).json({
    success: true,
    message: 'Agricultural batch added successfully (mock).',
    data: {
      batchId: `BATCH-${Date.now()}`,
      batchName: batchName || 'Unnamed Batch',
      origin: origin || 'Unknown Origin',
      crop: crop || 'Unknown Crop',
      quantity: quantity || 0,
      unit: unit || 'kg',
      farmerName: farmerName || 'Unknown Farmer',
      createdAt: new Date().toISOString(),
      status: 'Registered',
    },
  });
};

/**
 * @desc    Retrieve supply chain history & origin details of a batch
 * @route   GET /api/produce/trace/:id
 * @access  Public
 */
const traceProduce = (req, res) => {
  const { id } = req.params;

  // Return mock traceability data for the requested batch ID
  res.status(200).json({
    success: true,
    message: `Traceability data for batch ${id} (mock).`,
    data: {
      batchId: id,
      crop: 'Alphonso Mango',
      origin: {
        farm: 'Green Valley Farms',
        district: 'Ratnagiri',
        state: 'Maharashtra',
        country: 'India',
      },
      farmerName: 'Ramesh Patil',
      harvestDate: '2026-02-15',
      supplyChainHistory: [
        {
          stage: 'Harvested',
          location: 'Green Valley Farms, Ratnagiri',
          timestamp: '2026-02-15T06:00:00Z',
          handler: 'Ramesh Patil',
        },
        {
          stage: 'Quality Inspected',
          location: 'Ratnagiri Collection Centre',
          timestamp: '2026-02-16T10:30:00Z',
          handler: 'Quality Inspector #12',
        },
        {
          stage: 'In Transit',
          location: 'Logistics Hub, Pune',
          timestamp: '2026-02-17T14:00:00Z',
          handler: 'TransCold Logistics',
        },
        {
          stage: 'Delivered to Retailer',
          location: 'FreshMart Store, Mumbai',
          timestamp: '2026-02-18T09:00:00Z',
          handler: 'FreshMart Receiving',
        },
      ],
      currentStatus: 'Delivered to Retailer',
    },
  });
};

/**
 * @desc    Transfer ownership or update physical location of produce
 * @route   POST /api/produce/transfer
 * @access  Public (will be protected later)
 */
const transferProduce = (req, res) => {
  const { batchId, newOwner, newLocation, notes } = req.body;

  // Return a mock transfer confirmation
  res.status(200).json({
    success: true,
    message: 'Produce ownership/location updated successfully (mock).',
    data: {
      batchId: batchId || 'BATCH-UNKNOWN',
      previousOwner: 'Green Valley Farms',
      newOwner: newOwner || 'Unknown New Owner',
      previousLocation: 'Ratnagiri, Maharashtra',
      newLocation: newLocation || 'Unknown Location',
      notes: notes || '',
      transferredAt: new Date().toISOString(),
    },
  });
};

module.exports = {
  addProduce,
  traceProduce,
  transferProduce,
};
