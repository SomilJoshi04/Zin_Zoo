import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Eye, Edit, Settings, ArrowUpDown, Check, Columns, Trash2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

export default function WithdrawMethod() {
  const [searchQuery, setSearchQuery] = useState("")
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [methodName, setMethodName] = useState("")
  const [fields, setFields] = useState([{ name: "", type: "Text", placeholder: "", isRequired: true }])
  
  const [visibleColumns, setVisibleColumns] = useState({
    si: true,
    paymentMethodName: true,
    methodFields: true,
    activeStatus: true,
    defaultMethod: true,
    actions: true,
  })

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getWithdrawMethods()
      if (response?.data?.success) {
        setMethods(response.data.data || [])
      }
    } catch (error) {
      toast.error("Failed to load withdraw methods")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      const response = await adminAPI.toggleWithdrawMethodStatus(id)
      if (response?.data?.success) {
        toast.success("Status updated")
        fetchMethods()
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleDeleteMethod = async (id) => {
    if (window.confirm("Are you sure you want to delete this method?")) {
      try {
        const response = await adminAPI.deleteWithdrawMethod(id)
        if (response?.data?.success) {
          toast.success("Method deleted")
          fetchMethods()
        }
      } catch (error) {
        toast.error("Failed to delete method")
      }
    }
  }

  const handleEdit = (method) => {
    setEditId(method._id)
    setMethodName(method.methodName)
    setFields(method.fields?.length > 0 ? method.fields : [{ name: "", type: "Text", placeholder: "", isRequired: true }])
    setIsDialogOpen(true)
  }

  const handleResetForm = () => {
    setEditId(null)
    setMethodName("")
    setFields([{ name: "", type: "Text", placeholder: "", isRequired: true }])
    setIsDialogOpen(false)
  }

  const handleSaveMethod = async (e) => {
    e.preventDefault()
    if (!methodName.trim()) return toast.error("Method Name is required")
    if (fields.some(f => !f.name.trim())) return toast.error("All fields must have a name")

    try {
      const payload = { methodName, fields }
      if (editId) {
        const response = await adminAPI.updateWithdrawMethod(editId, payload)
        if (response?.data?.success) {
          toast.success("Method updated")
          handleResetForm()
          fetchMethods()
        }
      } else {
        const response = await adminAPI.createWithdrawMethod(payload)
        if (response?.data?.success) {
          toast.success("Method created")
          handleResetForm()
          fetchMethods()
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save method")
    }
  }

  const filteredMethods = useMemo(() => {
    if (!searchQuery.trim()) return methods
    const query = searchQuery.toLowerCase().trim()
    return methods.filter(method =>
      method.methodName?.toLowerCase().includes(query)
    )
  }, [methods, searchQuery])



  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }))
  }

  const resetColumns = () => {
    setVisibleColumns({
      si: true,
      paymentMethodName: true,
      methodFields: true,
      activeStatus: true,
      defaultMethod: true,
      actions: true,
    })
  }

  const columnsConfig = {
    si: "Serial Number",
    paymentMethodName: "Payment Method Name",
    methodFields: "Method Fields",
    activeStatus: "Active Status",
    actions: "Actions",
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Withdraw Method List</h1>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {filteredMethods.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[250px]">
                <input
                  type="text"
                  placeholder="Search Method Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  handleResetForm()
                  setIsDialogOpen(true)
                }}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
                <Plus className="w-4 h-4" />
                Add Method
              </button>
            </div>
          </div>
        </div>

        {/* Methods Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {visibleColumns.si && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">SI</th>}
                  {visibleColumns.paymentMethodName && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Payment Method Name</th>}
                  {visibleColumns.methodFields && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Method Fields</th>}
                  {visibleColumns.activeStatus && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Active Status</th>}
                  {visibleColumns.actions && <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>}
                  {visibleColumns.actions && (
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : filteredMethods.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="px-6 py-8 text-center text-slate-500">
                      No methods found
                    </td>
                  </tr>
                ) : (
                  filteredMethods.map((method, index) => (
                    <tr key={method._id} className="hover:bg-slate-50 transition-colors">
                      {visibleColumns.si && <td className="px-6 py-4 text-sm font-medium text-slate-700">{index + 1}</td>}
                      {visibleColumns.paymentMethodName && <td className="px-6 py-4 text-sm font-medium text-slate-700">{method.methodName}</td>}
                      {visibleColumns.methodFields && (
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {method.fields?.map((field, fieldIndex) => (
                              <span key={fieldIndex} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                {field.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                      {visibleColumns.activeStatus && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(method._id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              method.status ? "bg-blue-600" : "bg-slate-300"
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${method.status ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(method)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMethod(method._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-white p-0 opacity-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:scale-100 data-[state=closed]:scale-100">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Table Settings
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Columns className="w-4 h-4" />
                Visible Columns
              </h3>
              <div className="space-y-2">
                {Object.entries(columnsConfig).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={() => toggleColumn(key)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                    {visibleColumns[key] && (
                      <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={resetColumns}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md"
              >
                Apply
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Method Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 opacity-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
            <DialogTitle className="text-xl font-bold">{editId ? 'Edit Method' : 'Add New Method'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMethod} className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Method Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  placeholder="e.g. Bank Transfer"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-700">Method Fields</label>
                  <button
                    type="button"
                    onClick={() => setFields([...fields, { name: "", type: "Text", placeholder: "", isRequired: true }])}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Field
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Field Name (e.g. Account No)"
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...fields];
                              newFields[idx].name = e.target.value;
                              setFields(newFields);
                            }}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded"
                            required
                          />
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...fields];
                              newFields[idx].type = e.target.value;
                              setFields(newFields);
                            }}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded"
                          >
                            <option value="Text">Text</option>
                            <option value="Number">Number</option>
                            <option value="Date">Date</option>
                            <option value="Email">Email</option>
                            <option value="Phone">Phone</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Placeholder text"
                            value={field.placeholder}
                            onChange={(e) => {
                              const newFields = [...fields];
                              newFields[idx].placeholder = e.target.value;
                              setFields(newFields);
                            }}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded"
                          />
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={(e) => {
                                const newFields = [...fields];
                                newFields[idx].isRequired = e.target.checked;
                                setFields(newFields);
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Required Field
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newFields = fields.filter((_, i) => i !== idx);
                          setFields(newFields.length > 0 ? newFields : [{ name: "", type: "Text", placeholder: "", isRequired: true }]);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                {editId ? 'Update' : 'Save'} Method
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

