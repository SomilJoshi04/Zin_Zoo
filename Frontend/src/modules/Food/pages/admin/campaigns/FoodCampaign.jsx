import { useState, useMemo, useEffect } from "react"
import { Search, Download, ChevronDown, ArrowUpDown, Plus, Edit, Trash2, Megaphone, Settings } from "lucide-react"
import AddEditFoodCampaignDialog from "@food/components/admin/campaigns/AddEditFoodCampaignDialog"
import DeleteCampaignDialog from "@food/components/admin/campaigns/DeleteCampaignDialog"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

export default function FoodCampaign() {
  const [searchQuery, setSearchQuery] = useState("")
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getCampaigns()
      if (response?.data?.success) {
        setCampaigns((response.data.data || []).filter(c => c.campaignType === 'food'))
      }
    } catch (error) {
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) {
      return campaigns
    }
    
    const query = searchQuery.toLowerCase().trim()
    return campaigns.filter(campaign =>
      campaign.title.toLowerCase().includes(query)
    )
  }, [campaigns, searchQuery])

  const handleToggleStatus = async (id) => {
    try {
      const response = await adminAPI.toggleCampaignStatus(id)
      if (response?.data?.success) {
        toast.success("Status updated")
        fetchCampaigns()
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await adminAPI.deleteCampaign(id)
      if (response?.data?.success) {
        toast.success("Campaign deleted")
        fetchCampaigns()
        setIsDeleteOpen(false)
      }
    } catch (error) {
      toast.error("Failed to delete campaign")
    }
  }

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign)
    setIsAddEditOpen(true)
  }

  const handleAdd = () => {
    setSelectedCampaign(null)
    setIsAddEditOpen(true)
  }

  const handleSave = async (formData) => {
    try {
      const payload = { ...formData, campaignType: 'food' }
      if (selectedCampaign) {
        const response = await adminAPI.updateCampaign(selectedCampaign._id, payload)
        if (response?.data?.success) {
          toast.success("Campaign updated")
          fetchCampaigns()
          setIsAddEditOpen(false)
        }
      } else {
        const response = await adminAPI.createCampaign(payload)
        if (response?.data?.success) {
          toast.success("Campaign created")
          fetchCampaigns()
          setIsAddEditOpen(false)
        }
      }
    } catch (error) {
      toast.error("Failed to save campaign")
    }
  }

  const handleDeleteClick = (campaign) => {
    setSelectedCampaign(campaign)
    setIsDeleteOpen(true)
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Food Campaign</h1>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredCampaigns.length}
              </span>
            </div>
          </div>

          <button 
            onClick={handleAdd}
            className="px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Campaign
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <input
              type="text"
              placeholder="Ex : title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          <button className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-all">
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button className="p-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>SI</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Title</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-lg font-semibold text-slate-700 mb-1">Loading...</p>
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-lg font-semibold text-slate-700 mb-1">No Data Found</p>
                    <p className="text-sm text-slate-500">No campaigns match your search</p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign, index) => (
                  <tr
                    key={campaign._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {campaign.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{campaign.dateStart} - {campaign.dateEnd}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{campaign.timeStart} - {campaign.timeEnd}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">$ {campaign.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(campaign._id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          campaign.status ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            campaign.status ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(campaign)}
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

      {/* Add/Edit Dialog */}
      <AddEditFoodCampaignDialog
        isOpen={isAddEditOpen}
        onOpenChange={setIsAddEditOpen}
        campaign={selectedCampaign}
        onSave={handleSave}
      />

      {/* Delete Dialog */}
      <DeleteCampaignDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        campaign={selectedCampaign}
        onConfirm={() => handleDelete(selectedCampaign._id)}
      />
    </div>
  )
}
