"use client";

const cropColors = {
  "Organic Kale":       { bg: "bg-green-100",  text: "text-green-700" },
  "Romaine Lettuce":    { bg: "bg-blue-100",   text: "text-blue-700" },
  "Honeycrisp Apples":  { bg: "bg-orange-100", text: "text-orange-700" },
  "Baby Spinach":       { bg: "bg-emerald-100",text: "text-emerald-700" },
  "Russet Potatoes":    { bg: "bg-rose-100",   text: "text-rose-700" },
};

export default function BatchTable({ batches, selectedId, onSelectBatch }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Batch ID, Farm, or Origin..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Polygon Status: All
        </button>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch ID</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Origin Farm</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Crop Type</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr
              key={batch.id}
              onClick={() => onSelectBatch(batch)}
              className={`cursor-pointer border-b border-slate-50 transition-all duration-150 ${
                selectedId === batch.id
                  ? "bg-green-50/60"
                  : "hover:bg-slate-50"
              }`}
            >
              <td className="px-5 py-4">
                <span className="text-sm font-semibold text-green-600">{batch.id}</span>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-slate-700">{batch.farm}</p>
                <p className="text-xs text-slate-400">{batch.location}</p>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    cropColors[batch.crop]?.bg || "bg-slate-100"
                  } ${cropColors[batch.crop]?.text || "text-slate-600"}`}
                >
                  {batch.crop}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="px-5 py-3 text-xs text-slate-400">
        Showing 1 to {batches.length} of 24 incoming batches
      </div>
    </div>
  );
}
