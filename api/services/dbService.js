const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.json');

/**
 * Ensures the database file exists and is valid JSON.
 */
async function ensureDb() {
  try {
    await fs.access(dbPath);
    // Check if it's parsable
    const data = await fs.readFile(dbPath, 'utf8');
    JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      // If file doesn't exist or is invalid JSON, initialize it
      const defaultData = {
        batches: [],
        journeys: {}
      };
      // Ensure directory exists
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2));
    } else {
      throw error;
    }
  }
}

/**
 * Reads the entire database.
 * @returns {Promise<{ batches: Array, journeys: Object }>}
 */
async function readDb() {
  await ensureDb();
  const data = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(data);
}

/**
 * Writes data to the database.
 * @param {Object} data 
 */
async function writeDb(data) {
  await ensureDb();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get all batches.
 */
async function getBatches() {
  const data = await readDb();
  return data.batches;
}

/**
 * Get a specific batch by ID.
 */
async function getBatch(id) {
  const data = await readDb();
  return data.batches.find(b => b.id === id);
}

/**
 * Save a new batch to the database.
 */
async function saveBatch(batch) {
  const data = await readDb();
  data.batches.unshift(batch); // Add to the top
  await writeDb(data);
}

/**
 * Update an existing batch.
 */
async function updateBatch(id, updates) {
  const data = await readDb();
  const index = data.batches.findIndex(b => b.id === id);
  if (index !== -1) {
    data.batches[index] = { ...data.batches[index], ...updates };
    await writeDb(data);
    return data.batches[index];
  }
  return null;
}

/**
 * Get journey for a batch.
 */
async function getJourney(batchId) {
  const data = await readDb();
  return data.journeys[batchId] || [];
}

/**
 * Add a journey event to a batch.
 */
async function addJourneyEvent(batchId, event) {
  const data = await readDb();
  if (!data.journeys[batchId]) {
    data.journeys[batchId] = [];
  }
  data.journeys[batchId].push(event);
  await writeDb(data);
}

module.exports = {
  getBatches,
  getBatch,
  saveBatch,
  updateBatch,
  getJourney,
  addJourneyEvent
};
