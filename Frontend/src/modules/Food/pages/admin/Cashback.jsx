import { useState, useMemo, useEffect } from "react"
import { Search, Download, ChevronDown, Edit, Trash2, Calendar, RefreshCw } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

export default function Cashback() {
  const [activeLanguage, setActiveLanguage] = useState("default")
  const [searchQuery, setSearchQuery] = useState("")
  const [cashbackType, setCashbackType] = useState("all")
  const [cashbacks, setCashbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    customer: "",
    cashbackType: "Percentage",
    cashbackAmount: "",
    minPurchase: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    limitForSameUser: "",
  })

  useEffect(() => {
    fetchCashbacks()
  }, [])

  const fetchCashbacks = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getCashbacks()
      if (response?.data?.success) {
        setCashbacks(response.data.data || [])
      }
    } catch (error) {
      toast.error("Failed to load cashbacks")
    } finally {
      setLoading(false)
    }
  }

  const languageTabs = [
    { key: "default", label: "Default" },
    { key: "en", label: "English(EN)" },
    { key: "bn", label: "Bengali - à¦¬à¦¾à¦‚à¦²à¦¾ (BN)" },
    { key: "ar", label: "Arabic - Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© (AR)" },
    { key: "es", label: "Spanish - español(ES)" },
  ]

  const filteredCashbacks = useMemo(() => {
    let result = [...cashbacks]
    
    if (cashbackType !== "all") {
      if (cashbackType === "Percentage") {
        result = result.filter(cb => cb.cashbackType === "Percentage")
      } else if (cashbackType === "Amount") {
        result = result.filter(cb => cb.cashbackType === "Amount")
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(cb =>
        cb.title?.toLowerCase().includes(query)
      )
    }

    return result
  }, [cashbacks, searchQuery, cashbackType])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title) return toast.error("Title is required")
    
    try {
      if (editId) {
        const response = await adminAPI.updateCashback(editId, formData)
        if (response?.data?.success) {
          toast.success("Cashback updated")
          handleReset()
          fetchCashbacks()
        }
      } else {
        const response = await adminAPI.createCashback(formData)
        if (response?.data?.success) {
          toast.success("Cashback created")
          handleReset()
          fetchCashbacks()
        }
      }
    } catch (error) {
      toast.error("Failed to save cashback")
    }
  }

  const handleReset = () => {
    setEditId(null)
    setFormData({
      title: "",
      customer: "",
      cashbackType: "Percentage",
      cashbackAmount: "",
      minPurchase: "",
      maxDiscount: "",
      startDate: "",
      endDate: "",
      limitForSameUser: "",
    })
  }

  const handleEdit = (cb) => {
    setEditId(cb._id)
    setFormData({
      title: cb.title || "",
      customer: cb.customer || "",
      cashbackType: cb.cashbackType || "Percentage",
      cashbackAmount: cb.cashbackAmount || "",
      minPurchase: cb.minPurchase || "",
      maxDiscount: cb.maxDiscount || "",
      startDate: cb.startDate || "",
      endDate: cb.endDate || "",
      limitForSameUser: cb.limitForSameUser || "",
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleStatus = async (id) => {
    try {
      const response = await adminAPI.toggleCashbackStatus(id)
      if (response?.data?.success) {
        toast.success("Status updated")
        fetchCashbacks()
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this cashback offer?")) {
      try {
        const response = await adminAPI.deleteCashback(id)
        if (response?.data?.success) {
          toast.success("Cashback deleted")
          fetchCashbacks()
        }
      } catch (error) {
        toast.error("Failed to delete cashback")
      }
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Create Cashback Offer Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{editId ? 'Edit' : 'Create'} Cashback Offer</h1>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
            {languageTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveLanguage(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeLanguage === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title ({activeLanguage === "default" ? "Default" : languageTabs.find(t => t.key === activeLanguage)?.label})
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Customer
                </label>
                <select
                  value={formData.customer}
                  onChange={(e) => handleInputChange("customer", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select customer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cashback Type <span className="text-red-500">*</span>
                </label>
                  <select
                    value={formData.cashbackType}
                    onChange={(e) => handleInputChange("cashbackType", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Amount">Amount ($)</option>
                  </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cashback Amount ({formData.cashbackType === "Percentage" ? "%" : "$"}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.cashbackAmount}
                  onChange={(e) => handleInputChange("cashbackAmount", e.target.value)}
                  placeholder="Ex: 100"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Minimum Purchase ($)
                </label>
                <input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => handleInputChange("minPurchase", e.target.value)}
                  placeholder="Ex: 100"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Maximum Discount ($)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => handleInputChange("maxDiscount", e.target.value)}
                  placeholder="Ex: 100"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Limit For Same User
                </label>
                <input
                  type="number"
                  value={formData.limitForSameUser}
                  onChange={(e) => handleInputChange("limitForSameUser", e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                {editId ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        {/* Cashback List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Cashback List</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredCashbacks.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={cashbackType}
                onChange={(e) => setCashbackType(e.target.value)}
                className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="all">All CashBacks</option>
                <option value="Percentage">Percentage</option>
                <option value="Amount">Amount</option>
              </select>

              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Ex: Search by title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">SI</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">CashBack Type</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Total Used</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : filteredCashbacks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                      No cashback offers found
                    </td>
                  </tr>
                ) : (
                  filteredCashbacks.map((cb, index) => (
                    <tr key={cb._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">
                          {cb.title}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{cb.cashbackType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900">
                          {cb.cashbackType === "Percentage" ? `${cb.cashbackAmount}%` : `$${cb.cashbackAmount}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{cb.startDate} - {cb.endDate}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{cb.limitForSameUser}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(cb._id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            cb.status ? "bg-blue-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              cb.status ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(cb)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cb._id)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

