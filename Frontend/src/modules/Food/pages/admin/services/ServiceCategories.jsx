import React, { useState, useEffect } from 'react';
import { Search, Pencil, Trash2, Plus, Loader2, PlusCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAdminAPI, adminAPI, userAPI } from '@food/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"

export default function ServiceCategories() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    subCategories: []
  });

  const [subCategoryInput, setSubCategoryInput] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [searchQuery]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await servicesAdminAPI.getCategories({ search: searchQuery });
      if (response?.data?.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditId(category._id);
      setFormData({
        name: category.name,
        image: category.image || '',
        subCategories: (category.subCategories || []).map(s => typeof s === 'string' ? { name: s, image: '' } : s)
      });
    } else {
      setEditId(null);
      setFormData({
        name: '',
        image: '',
        subCategories: []
      });
    }
    setSubCategoryInput('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e, isSub = false, subIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await userAPI.uploadGenericImage(file);
      const url = res?.data?.data?.url || res?.data?.url || '';
      if (!url) throw new Error("No URL returned from server");

      if (isSub) {
        setFormData(prev => {
          const updated = [...prev.subCategories];
          updated[subIndex] = { ...updated[subIndex], image: url };
          return { ...prev, subCategories: updated };
        });
      } else {
        setFormData(prev => ({ ...prev, image: url }));
      }
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload image");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSubCategory = () => {
    const trimmed = subCategoryInput.trim();
    if (!trimmed) return;
    const nameList = formData.subCategories.map(s => typeof s === 'string' ? s : s.name);
    if (nameList.includes(trimmed)) {
      toast.error('Sub-category already exists');
      return;
    }
    setFormData(prev => ({
      ...prev,
      subCategories: [...prev.subCategories, { name: trimmed, image: '' }]
    }));
    setSubCategoryInput('');
  };

  const handleRemoveSubCategory = (subCat) => {
    const targetName = typeof subCat === 'string' ? subCat : subCat.name;
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(s => (typeof s === 'string' ? s : s.name) !== targetName)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        zoneId: null
      };

      if (editId) {
        await servicesAdminAPI.updateCategory(editId, payload);
        toast.success('Category updated successfully');
      } else {
        await servicesAdminAPI.addCategory(payload);
        toast.success('Category added successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await servicesAdminAPI.deleteCategory(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await servicesAdminAPI.updateCategory(category._id, { isActive: !category.isActive });
      toast.success('Status updated successfully');
      fetchCategories();
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
              <span className="text-white font-bold">CT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Service Categories</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Manage dynamic categories and sub-categories</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#F84E04] hover:bg-[#D40261] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-[#F84E04]/20 hover:shadow-[#F84E04]/30"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 lg:w-60 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">SL</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sub Categories</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading categories...</p>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No categories found.</p>
                  </td>
                </tr>
              ) : (
                categories.map((category, idx) => (
                  <tr key={category._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img src={category.image} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">N/A</div>
                        )}
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {category.subCategories && category.subCategories.length > 0 ? (
                          category.subCategories.map((sub, sIdx) => {
                            const subName = typeof sub === 'string' ? sub : sub.name;
                            const subImg = typeof sub === 'string' ? '' : sub.image;
                            return (
                              <span key={sIdx} className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200/60 dark:border-slate-700">
                                {subImg && <img src={subImg} className="w-3.5 h-3.5 rounded object-cover" alt="" />}
                                {subName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">No sub-categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          category.isActive
                            ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category._id, category.name)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors"
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {editId ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">Category Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Electrician, Plumbing, Cleaning"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#F84E04]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">Category Background Image</label>
              <div className="flex items-center gap-3">
                {formData.image ? (
                  <img src={formData.image} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">No Image</div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                  {isUploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">Sub-Categories (Optional)</label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. AC Repair, Fan Installation"
                  value={subCategoryInput}
                  onChange={(e) => setSubCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubCategory();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#F84E04]"
                />
                <button
                  type="button"
                  onClick={handleAddSubCategory}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              {formData.subCategories.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {formData.subCategories.map((sub, idx) => {
                    const subName = typeof sub === 'string' ? sub : sub.name;
                    const subImg = typeof sub === 'string' ? '' : (sub.image || '');
                    return (
                      <div key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                          {subImg ? (
                            <img src={subImg} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">IMG</div>
                          )}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{subName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, true, idx)}
                            />
                          </label>
                          <button type="button" onClick={() => handleRemoveSubCategory(sub)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full py-3 bg-[#F84E04] hover:bg-[#D40261] text-white font-bold rounded-xl text-sm transition-colors flex justify-center items-center gap-2 shadow-sm shadow-[#F84E04]/20 hover:shadow-[#F84E04]/30"
              >
                {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
