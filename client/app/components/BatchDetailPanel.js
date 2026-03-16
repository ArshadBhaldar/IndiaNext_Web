"use client";

import { useState, useEffect } from "react";
import { fetchBatchTrace, approveBatch } from "../lib/api";

const icons = {
  leaf: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  truck: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  store: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

const iconBgColors = {
  leaf: "bg-green-100 text-green-600",
  truck: "bg-blue-100 text-blue-600",
  store: "bg-amber-100 text-amber-600",
};

const cropColors = {
  "Organic Kale":       { bg: "bg-green-100",  text: "text-green-700" },
  "Romaine Lettuce":    { bg: "bg-blue-100",   text: "text-blue-700" },
  "Honeycrisp Apples":  { bg: "bg-orange-100", text: "text-orange-700" },
  "Baby Spinach":       { bg: "bg-emerald-100",text: "text-emerald-700" },
  "Russet Potatoes":    { bg: "bg-rose-100",   text: "text-rose-700" },
};

export default function BatchDetailPanel({ batch, onClose, onBatchApproved }) {
  const [journey, setJourney] = useState([]);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  // Fetch journey data when a batch is selected
  useEffect(() => {
    if (!batch) return;
    setApproved(batch.status === "verified");
    loadJourney(batch.id);
  }, [batch?.id]);

  async function loadJourney(batchId) {
    try {
      setLoadingJourney(true);
      const data = await fetchBatchTrace(batchId);
      setJourney(data.journey || []);
    } catch (err) {
      console.error("Failed to load journey:", err);
      setJourney([]);
    } finally {
      setLoadingJourney(false);
    }
  }

  async function handleApprove() {
    if (!batch) return;
    try {
      setApproving(true);
      await approveBatch(batch.id);
      setApproved(true);
      if (onBatchApproved) onBatchApproved();
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setApproving(false);
    }
  }

  if (!batch) return null;

  return (
    <div className="w-[400px] bg-white border-l border-slate-200 h-screen fixed right-0 top-0 overflow-y-auto shadow-[-4px_0_16px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-slate-800">{batch.id}</h2>
              <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                approved
                  ? "text-green-600 bg-green-50"
                  : "text-amber-600 bg-amber-50"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {approved
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
                {approved ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Farm info */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{batch.farm}</p>
              <p className="text-xs text-slate-400">{batch.location}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              cropColors[batch.crop]?.bg || "bg-slate-100"
            } ${cropColors[batch.crop]?.text || "text-slate-600"}`}
          >
            {batch.crop}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-b border-slate-100 space-y-2.5">
        <div className="flex gap-2.5">
          <button
            onClick={handleApprove}
            disabled={approved || approving}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm rounded-xl transition-all active:scale-[0.98] ${
              approved
                ? "bg-green-100 text-green-700 cursor-default"
                : approving
                ? "bg-green-300 text-white cursor-wait"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md shadow-green-200"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {approved ? "Batch Approved ✓" : approving ? "Approving..." : "Approve Batch"}
          </button>
          {!approved && (
            <button className="p-3 border-2 border-red-200 text-red-400 rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all active:scale-[0.98]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          disabled={!approved}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm rounded-xl transition-all ${
            approved
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-200 cursor-pointer active:scale-[0.98]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Generate Consumer QR Code
        </button>
        {!approved && (
          <p className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Verification required for QR generation
          </p>
        )}
      </div>

      {/* Provenance Journey */}
      <div className="px-6 py-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Provenance Journey
        </h3>

        {loadingJourney ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-200"></div>

            <div className="space-y-6">
              {journey.map((step, index) => (
                <div key={index} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-0.5 w-[30px] h-[30px] rounded-full flex items-center justify-center ${
                    iconBgColors[step.icon] || "bg-slate-100 text-slate-500"
                  }`}>
                    {icons[step.icon] || icons.leaf}
                  </div>

                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-semibold text-slate-700">{step.title}</h4>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">{step.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {step.location}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>

                    {step.hasImage && (
                      <div className="mt-3 flex gap-2">
                        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 border border-green-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 border border-amber-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Report
        </button>
        <a
          href="#"
          className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
        >
          Verify on Polygonscan
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
