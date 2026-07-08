import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, Save, X, DollarSign, Percent, AlertCircle } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

export default function RestaurantCommissions() {
  const [commissions, setCommissions] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // "add" | "edit"
  const [selectedCommission, setSelectedCommission] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    restaurantId: "",
    type: "percentage",
    value: "",
    notes: ""
  })
  const [saving, setSaving] = useState(false)

  // Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all commissions and bootstrap restaurants
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getRestaurantCommissionBootstrap()
      const data = res?.data?.data || res?.data || {}
      setCommissions(Array.isArray(data.commissions) ? data.commissions : [])
      
      // Filter out restaurants that already have commission setup (for the dropdown)
      setRestaurants(Array.isArray(data.restaurants) ? data.restaurants : [])
    } catch (error) {
      console.error("Error fetching commissions data:", error)
      toast.error("Failed to load commissions configuration")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Open modal for add
  const handleAddOpen = () => {
    // Show only restaurants that don't have setup yet
    const currentSetupIds = new Set(commissions.map((c) => String(c.restaurantId)))
    const availableRestaurants = restaurants.filter((r) => !currentSetupIds.has(String(r._id)))
    
    if (availableRestaurants.length === 0) {
      toast.info("All approved restaurants already have commission rules configured.")
      return
    }

    setModalMode("add")
    setSelectedCommission(null)
    setFormData({
      restaurantId: availableRestaurants[0]?._id || "",
      type: "percentage",
      value: "",
      notes: ""
    })
    setShowModal(true)
  }

  // Open modal for edit
  const handleEditOpen = (commission) => {
    setModalMode("edit")
    setSelectedCommission(commission)
    setFormData({
      restaurantId: commission.restaurantId || "",
      type: commission.defaultCommission?.type || "percentage",
      value: String(commission.defaultCommission?.value ?? ""),
      notes: commission.notes || ""
    })
    setShowModal(true)
  }

  // Handle submit save
  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!formData.restaurantId) {
      toast.error("Please select a restaurant")
      return
    }
    const val = parseFloat(formData.value)
    if (isNaN(val) || val < 0) {
      toast.error("Commission value must be a positive number")
      return
    }
    if (formData.type === "percentage" && val > 100) {
      toast.error("Percentage value cannot exceed 100%")
      return
    }

    try {
      setSaving(true)
      
      const payload = {
        restaurantId: formData.restaurantId,
        defaultCommission: {
          type: formData.type,
          value: val
        },
        notes: formData.notes
      }

      if (modalMode === "add") {
        await adminAPI.createRestaurantCommission(payload)
        toast.success("Commission rule created successfully")
      } else {
        await adminAPI.updateRestaurantCommission(selectedCommission._id, payload)
        toast.success("Commission rule updated successfully")
      }

      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error("Error saving commission rule:", error)
      toast.error(error?.response?.data?.message || "Failed to save commission rule")
    } finally {
      setSaving(false)
    }
  }

  // Toggle status
  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleRestaurantCommissionStatus(id)
      toast.success("Status toggled successfully")
      
      // Update local state directly for instant feedback
      setCommissions((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: !c.status } : c))
      )
    } catch (error) {
      console.error("Error toggling commission status:", error)
      toast.error("Failed to toggle status")
    }
  }

  // Confirm delete
  const handleDeleteClick = (commission) => {
    setDeleteTarget(commission)
    setShowDeleteDialog(true)
  }

  // Execute delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await adminAPI.deleteRestaurantCommission(deleteTarget._id)
      toast.success("Commission rule deleted successfully")
      setShowDeleteDialog(false)
      setDeleteTarget(null)
      fetchData()
    } catch (error) {
      console.error("Error deleting commission rule:", error)
      toast.error("Failed to delete commission rule")
    } finally {
      setDeleting(false)
    }
  }

  if (loading && commissions.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const currentSetupIds = new Set(commissions.map((c) => String(c.restaurantId)))
  const availableRestaurantsForDropdown = restaurants.filter(
    (r) => !currentSetupIds.has(String(r._id)) || (modalMode === "edit" && String(r._id) === String(formData.restaurantId))
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Restaurant Commissions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure order checkout commission billing rates for approved outlets.
          </p>
        </div>
        <button
          onClick={handleAddOpen}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition rounded-lg shadow-sm shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Commission Setup
        </button>
      </div>

      {/* Main List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {commissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No Commission Rules</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You haven't set up any commission rules yet. Click the button above to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 w-16">SL</th>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Commission Value</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 w-28">Status</th>
                  <th className="px-6 py-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {commissions.map((item, index) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-white">
                        {item.restaurantName || "Unknown Restaurant"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.defaultCommission?.type === "percentage"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        }`}
                      >
                        {item.defaultCommission?.type === "percentage" ? "Percentage" : "Flat Rate"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {item.defaultCommission?.type === "percentage"
                        ? `${item.defaultCommission?.value}%`
                        : `₹${item.defaultCommission?.value}`}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.notes || <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(item._id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.status ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.status ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditOpen(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {modalMode === "add" ? "Create Commission Setup" : "Update Commission Setup"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Restaurant Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Restaurant
                </label>
                <select
                  value={formData.restaurantId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, restaurantId: e.target.value }))}
                  disabled={modalMode === "edit"}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                >
                  {modalMode === "add" ? (
                    <>
                      <option value="" disabled>Select a Restaurant</option>
                      {availableRestaurantsForDropdown.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value={formData.restaurantId}>
                      {selectedCommission?.restaurantName || "Selected Restaurant"}
                    </option>
                  )}
                </select>
              </div>

              {/* Commission Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Commission Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: "percentage" }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition ${
                      formData.type === "percentage"
                        ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: "flat" }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition ${
                      formData.type === "flat"
                        ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Flat Rate
                  </button>
                </div>
              </div>

              {/* Commission Value */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Commission Value {formData.type === "percentage" ? "(%)" : "(₹)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                    step="0.01"
                    placeholder="Enter value"
                    value={formData.value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    required
                  />
                  <div className="absolute left-3 top-2.5 text-slate-400 flex items-center pointer-events-none">
                    {formData.type === "percentage" ? (
                      <Percent className="w-4 h-4" />
                    ) : (
                      <span className="font-semibold text-sm">₹</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Explanation
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Special agreement 20% on all online orders."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-sm shadow-violet-500/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Delete Commission Setup</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to remove the commission rule for{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {deleteTarget?.restaurantName || "this restaurant"}
                  </strong>
                  ? This will reset their orders to use 0 commission.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteTarget(null)
                }}
                disabled={deleting}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Setup"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
