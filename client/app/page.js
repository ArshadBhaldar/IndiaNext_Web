"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import BatchTable from "./components/BatchTable";
import BatchDetailPanel from "./components/BatchDetailPanel";
import { fetchBatches } from "./lib/api";

export default function IncomingBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState({ pending: 0, verified: 0, total: 0 });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch batches from backend on mount
  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      setLoading(true);
      const data = await fetchBatches();
      setBatches(data.batches);
      setStats(data.stats);
      // Auto-select first batch if none selected
      if (!selectedBatch && data.batches.length > 0) {
        setSelectedBatch(data.batches[0]);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  }

  // Called after a batch is approved — refresh the list
  function handleBatchApproved() {
    loadBatches();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className={`ml-56 flex-1 transition-all duration-300 ${
          selectedBatch ? "mr-[400px]" : ""
        }`}
      >
        <div className="px-8 py-8 max-w-5xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Incoming Produce Batches
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {stats.pending} Pending Verification
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {stats.verified} Verified Today
              </span>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <BatchTable
              batches={batches}
              selectedId={selectedBatch?.id}
              onSelectBatch={setSelectedBatch}
            />
          )}
        </div>
      </main>

      {/* Detail Panel */}
      <BatchDetailPanel
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
        onBatchApproved={handleBatchApproved}
      />
    </div>
  );
}
