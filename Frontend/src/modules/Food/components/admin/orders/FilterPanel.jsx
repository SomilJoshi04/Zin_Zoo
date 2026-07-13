import { X } from "lucide-react"

export default function FilterPanel({ isOpen, onClose, filters, setFilters, onApply, onReset, restaurants = [] }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-transparent dark:border-[#333]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-[#333] px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Filter Orders</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Payment Status Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["All", "Paid", "Pending", "Failed", "Refunded"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilters(prev => ({ ...prev, paymentStatus: status === "All" ? "" : status }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filters.paymentStatus === status || (status === "All" && !filters.paymentStatus)
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#333] border border-transparent dark:border-[#404040]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#333]">
            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minAmount || ""}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0);
                    setFilters(prev => ({ ...prev, minAmount: val }))
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#404040] rounded-lg bg-white dark:bg-[#262626] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxAmount || ""}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0);
                    setFilters(prev => ({ ...prev, maxAmount: val }))
                  }}
                  placeholder="10000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#404040] rounded-lg bg-white dark:bg-[#262626] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={filters.fromDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#404040] rounded-lg bg-white dark:bg-[#262626] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={filters.toDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#404040] rounded-lg bg-white dark:bg-[#262626] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="sticky bottom-0 bg-slate-50 dark:bg-[#161616] border-t border-slate-200 dark:border-[#333] px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-[#404040] bg-white dark:bg-[#262626] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#333] transition-all"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-md"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
