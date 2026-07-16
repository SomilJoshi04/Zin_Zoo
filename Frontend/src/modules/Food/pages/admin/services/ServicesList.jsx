import React, { useState, useEffect } from 'react';
import { Search, Eye, Pencil, Trash2, Plus, Loader2, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAdminAPI, adminAPI, userAPI } from '@food/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"

export default function ServicesList() {
  const [services, setServices] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    category: '',
    subCategory: '',
    basePrice: '',
    visitingCharge: '0',
    description: '',
    availableFrom: '09:00',
    availableTo: '18:00',
    provider: 'Admin'
  });

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await servicesAdminAPI.getCategories({});
      if (response?.data?.success) {
        setDbCategories(response.data.data.categories.filter(c => c.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch categories for dropdown', error);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await servicesAdminAPI.getServices({ search: searchQuery });
      if (response?.data?.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      toast.error('Failed to fetch services');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditId(service._id);
      setFormData({
        name: service.name,
        image: service.image || '',
        category: service.category,
        subCategory: service.subCategory || '',
        basePrice: service.basePrice,
        visitingCharge: service.visitingCharge !== undefined ? String(service.visitingCharge) : '0',
        description: service.description || '',
        availableFrom: service.availableFrom,
        availableTo: service.availableTo,
        provider: service.provider
      });
    } else {
      setEditId(null);
      setFormData({
        name: '',
        image: '',
        category: '',
        subCategory: '',
        basePrice: '',
        visitingCharge: '0',
        description: '',
        availableFrom: '09:00',
        availableTo: '18:00',
        provider: 'Admin'
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await userAPI.uploadGenericImage(file);
      const url = res?.data?.data?.url || res?.data?.url || '';
      if (!url) throw new Error('No URL returned');
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Failed to upload image');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice),
        visitingCharge: Number(formData.visitingCharge || 0),
        zoneId: null
      };

      if (editId) {
        await servicesAdminAPI.updateService(editId, payload);
        toast.success('Service updated successfully');
      } else {
        await servicesAdminAPI.addService(payload);
        toast.success('Service added successfully');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await servicesAdminAPI.deleteService(id);
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      await servicesAdminAPI.updateService(service._id, { isActive: !service.isActive });
      toast.success('Status updated successfully');
      fetchServices();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-slate-50 dark:bg-[#0f172a] min-h-screen">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-red-650 flex items-center justify-center shadow-md shadow-orange-500/10">
              <span className="text-white font-bold">SV</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Services List</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Manage all active services</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenModal()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#F84E04] hover:bg-[#D40261] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-[#F84E04]/20 hover:shadow-[#F84E04]/30"
            >
              <Plus className="w-4 h-4" /> Add Service
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 lg:w-60 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SL</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading services...</p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No services found.</p>
                  </td>
                </tr>
              ) : (
                services.map((service, idx) => (
                  <tr key={service._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{service.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-800 dark:text-slate-200 font-bold">{service.provider}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <div>{service.category} {service.subCategory ? `(${service.subCategory})` : ''}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {service.availableFrom} - {service.availableTo}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div>Base: ₹{service.basePrice}</div>
                      {service.visitingCharge > 0 && <div className="text-[10px] text-orange-500">Visit: +₹{service.visitingCharge}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(service)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          service.isActive
                            ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleOpenModal(service)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(service._id, service.name)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {editId ? 'Edit Vendor Service' : 'Add Vendor Service'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Select Category</option>
                  {dbCategories.map(cat => (
                    <option key={cat._id} value={cat.name} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{cat.name}</option>
                  ))}
                </select>
              </div>

              {formData.category && dbCategories.find(c => c.name === formData.category)?.subCategories?.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Sub-Category</label>
                  <select
                    required
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">Select Sub-Category</option>
                    {dbCategories.find(c => c.name === formData.category).subCategories.map((sub, idx) => (
                      <option key={idx} value={sub?.name || sub} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{sub?.name || sub}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Service Name</label>
              <input
                required
                type="text"
                placeholder="e.g. AC Repair Service"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#F84E04]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Service Image</label>
              <div className="flex items-center gap-3">
                {formData.image ? (
                  <img src={formData.image} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">No Img</div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                  {isUploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Available From</label>
                <input
                  required
                  type="time"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Available To</label>
                <input
                  required
                  type="time"
                  value={formData.availableTo}
                  onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Base Price (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#F84E04]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Visiting Charge (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.visitingCharge}
                  onChange={(e) => setFormData({ ...formData, visitingCharge: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#F84E04]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Description (Optional)</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#F84E04] resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full py-3 bg-[#F84E04] hover:bg-[#D40261] text-white font-bold rounded-xl text-sm transition-colors flex justify-center items-center gap-2 shadow-sm shadow-[#F84E04]/20 hover:shadow-[#F84E04]/30"
              >
                {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
