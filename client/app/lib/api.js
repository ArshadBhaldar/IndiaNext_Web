// API utility for communicating with the backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Fetch all incoming batches and stats.
 * GET /api/produce/all
 */
export async function fetchBatches() {
  const res = await fetch(`${API_BASE}/api/produce/all`);
  if (!res.ok) throw new Error("Failed to fetch batches");
  const json = await res.json();
  return json.data; // { batches, stats }
}

/**
 * Fetch the provenance journey for a specific batch.
 * GET /api/produce/trace/:id
 */
export async function fetchBatchTrace(batchId) {
  const res = await fetch(`${API_BASE}/api/produce/trace/${batchId}`);
  if (!res.ok) throw new Error(`Failed to fetch trace for ${batchId}`);
  const json = await res.json();
  return json.data; // { batch, journey }
}

/**
 * Approve (verify) a batch.
 * POST /api/produce/approve
 */
export async function approveBatch(batchId) {
  const res = await fetch(`${API_BASE}/api/produce/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId }),
  });
  if (!res.ok) throw new Error(`Failed to approve batch ${batchId}`);
  const json = await res.json();
  return json.data;
}

/**
 * Add a new produce batch.
 * POST /api/produce/add
 */
export async function addBatch(batchData) {
  const res = await fetch(`${API_BASE}/api/produce/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batchData),
  });
  if (!res.ok) throw new Error("Failed to add batch");
  const json = await res.json();
  return json.data;
}
