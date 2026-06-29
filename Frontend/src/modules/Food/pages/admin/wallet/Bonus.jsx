import { useState, useMemo, useEffect } from "react"
import { Search, Wallet, Info, Calendar, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { adminAPI } from "@food/api"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export default function Bonus() {
  const [loading, setLoading] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState("default")
  const [searchQuery, setSearchQuery] = useState("")
  const [bonuses, setBonuses] = useState([])
  const [formData, setFormData] = useState({
    id: null,
    bonusTitle: "",
    shortDescription: "",
    bonusType: "Percentage",
    bonusAmount: "",
    minAddMoney: "",
    maxBonus: "",
    startDate: "",
    expireDate: "",
  })

  useEffect(() => {
    fetchBonuses()
  }, [])

  const fetchBonuses = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getWalletBonuses()
      if (response?.data?.success) {
        setBonuses(response.data.data || [])
      }
    } catch (error) {
      debugError("Error fetching bonuses:", error)
      toast.error("Failed to load bonuses")
    } finally {
      setLoading(false)
    }
  }

  const languageTabs = [
    { key: "default", label: "Default" },
    { key: "en", label: "English(EN)" },
    { key: "bn", label: "Bengali - বাংলা(BN)" },
    { key: "ar", label: "Arabic - العربية (AR)" },
    { key: "es", label: "Spanish - espa�ol(ES)" },
  ]

  const filteredBonuses = useMemo(() => {
    if (!searchQuery.trim()) {
      return bonuses
    }
    
    const query = searchQuery.toLowerCase().trim()
    return bonuses.filter(bonus =>
      bonus.bonusTitle.toLowerCase().includes(query)
    )
  }, [bonuses, searchQuery])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (formData.id) {
        const response = await adminAPI.updateWalletBonus(formData.id, formData)
        if (response?.data?.success) {
          toast.success("Bonus updated successfully")
          handleReset()
          fetchBonuses()
        }
      } else {
        const response = await adminAPI.createWalletBonus(formData)
        if (response?.data?.success) {
          toast.success("Bonus created successfully")
          handleReset()
          fetchBonuses()
        }
      }
    } catch (error) {
      debugError("Error saving bonus:", error)
      toast.error(error.response?.data?.message || "Failed to save bonus")
    }
  }

  const handleReset = () => {
  const handleReset = () => {
    setFormData({
      id: null,
      bonusTitle: "",
      shortDescription: "",
      bonusType: "Percentage",
      bonusAmount: "",
      minAddMoney: "",
      maxBonus: "",
      startDate: "",
      expireDate: "",
    })
  }
  }

  const handleToggleStatus = async (id) => {
    try {
      const response = await adminAPI.toggleWalletBonusStatus(id)
      if (response?.data?.success) {
        toast.success("Status updated")
        fetchBonuses()
      }
    } catch (error) {
      debugError("Error toggling status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bonus?")) {
      try {
        const response = await adminAPI.deleteWalletBonus(id)
        if (response?.data?.success) {
          toast.success("Bonus deleted")
          fetchBonuses()
        }
      } catch (error) {
        debugError("Error deleting bonus:", error)
        toast.error("Failed to delete bonus")
      }
    }
  }

  const handleEdit = (bonus) => {
    setFormData({
      id: bonus._id,
      bonusTitle: bonus.bonusTitle,
      shortDescription: bonus.shortDescription,
      bonusType: bonus.bonusType,
      bonusAmount: bonus.bonusAmount,
      minAddMoney: bonus.minAddMoney,
      maxBonus: bonus.maxBonus,
      startDate: bonus.startDate ? new Date(bonus.startDate).toISOString().split('T')[0] : "",
      expireDate: bonus.expireDate ? new Date(bonus.expireDate).toISOString().split('T')[0] : "",
    })
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Bonus Setup Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Wallet Bonus Setup</h1>
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
                  Bonus Title ({activeLanguage === "default" ? "Default" : languageTabs.find(t => t.key === activeLanguage)?.label})
                </label>
                <input
                  type="text"
                  value={formData.bonusTitle}
                  onChange={(e) => handleInputChange("bonusTitle", e.target.value)}
                  placeholder="Ex: EID Dhamaka"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Short Description ({activeLanguage === "default" ? "Default" : languageTabs.find(t => t.key === activeLanguage)?.label})
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="Ex: EID Dhamaka"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bonus Type
                </label>
                <select
                  value={formData.bonusType}
                  onChange={(e) => handleInputChange("bonusType", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Amount">Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <span>Bonus Amount ({formData.bonusType === "Percentage" ? "%" : "₹"})</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bonusAmount}
                  onChange={(e) => handleInputChange("bonusAmount", e.target.value)}
                  placeholder="Ex: 100"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <span>Minimum Add Money Amount ($)</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.minAddMoney}
                  onChange={(e) => handleInputChange("minAddMoney", e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <span>Maximum Bonus ($)</span>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.maxBonus}
                  onChange={(e) => handleInputChange("maxBonus", e.target.value)}
                  placeholder="Ex: 1000"
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
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Expire Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.expireDate}
                    onChange={(e) => handleInputChange("expireDate", e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
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
                className="px-6 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md"
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Bonus List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Bonus List</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredBonuses.length}
              </span>
            </div>

            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <input
                type="text"
                placeholder="Ex: Search by bonus title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">SI</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Bonus Title</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Bonus Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Bonus Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Started On</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Expires On</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredBonuses.map((bonus, index) => (
                  <tr key={bonus._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{bonus.bonusTitle}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{bonus.shortDescription}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{bonus.bonusAmount} {bonus.bonusType === 'Percentage' ? '%' : '₹'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{new Date(bonus.startDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{new Date(bonus.expireDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(bonus._id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          bonus.status ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            bonus.status ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(bonus)}
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bonus._id)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

