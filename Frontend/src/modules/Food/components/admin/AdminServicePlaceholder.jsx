import React, { useState, useMemo } from 'react';
import { Search, Eye, Pencil, Trash2, Check, X, ShieldAlert, Plus, SlidersHorizontal, ChevronDown, Award, Sparkles, MapPin, Calendar, Clock, ShoppingCart, Tag } from 'lucide-react';
import { toast } from 'sonner';

// Custom dialog simulation for local mockups
function MockDialog({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminServicePlaceholder({ title }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // --- GROCERY MOCK DATA ---
  const groceryCategories = useMemo(() => [], []);
  const groceryProducts = useMemo(() => [], []);
  const groceryOrders = useMemo(() => [], []);

  // --- SERVICE MOCK DATA ---
  const serviceCategories = useMemo(() => [], []);
  const servicesList = useMemo(() => [], []);
  const serviceAddonsList = useMemo(() => [], []);
  const serviceBookings = useMemo(() => [], []);
  const serviceApprovals = useMemo(() => [], []);

  // --- ACTIONS HANDLERS ---
  const handleView = (item) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  const handleEdit = (itemName) => {
    toast.info(`Editing "${itemName}" (Mock Action)`);
  };

  const handleDelete = (itemName) => {
    toast.error(`Deleted "${itemName}" (Mock Action)`);
  };

  const handleApprove = (providerName, action) => {
    if (action === 'approve') {
      toast.success(`Approved "${providerName}" successfully!`);
    } else {
      toast.error(`Rejected "${providerName}" request.`);
    }
  };

  // --- DYNAMIC DATA SELECTION BASED ON TITLE ---
  const normalizedTitle = title.toLowerCase();

  const isGroceryProducts = normalizedTitle.includes('products list');
  const isGroceryCategories = normalizedTitle.includes('grocery categories');
  const isGroceryOrders = normalizedTitle.includes('orders') && normalizedTitle.includes('grocery');
  
  const isServiceApproval = normalizedTitle.includes('service approval');
  const isServicesList = normalizedTitle.includes('services list');
  const isServiceAddons = normalizedTitle.includes('addons');
  const isServiceCategories = normalizedTitle.includes('service categories');
  const isServiceBookings = normalizedTitle.includes('bookings');

  // Filter orders based on page path
  const targetGroceryOrders = useMemo(() => {
    if (normalizedTitle.includes('pending')) {
      return groceryOrders.filter(o => o.deliveryStatus === 'Pending');
    }
    if (normalizedTitle.includes('delivered')) {
      return groceryOrders.filter(o => o.deliveryStatus === 'Delivered');
    }
    return groceryOrders;
  }, [normalizedTitle, groceryOrders]);

  // Filter bookings based on page path
  const targetServiceBookings = useMemo(() => {
    if (normalizedTitle.includes('pending')) {
      return serviceBookings.filter(b => b.status === 'Pending');
    }
    if (normalizedTitle.includes('completed')) {
      return serviceBookings.filter(b => b.status === 'Completed');
    }
    return serviceBookings;
  }, [normalizedTitle, serviceBookings]);

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">{title}</h1>
              <p className="text-xs font-semibold text-emerald-600 mt-0.5 tracking-wider uppercase">Demo Database Active</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 lg:w-60 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          {/* 1. GROCERY PRODUCTS LIST */}
          {isGroceryProducts && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price / Unit</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {groceryProducts
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((product, idx) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                          <span className="text-xs font-bold text-slate-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{product.category}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">₹{product.price} <span className="text-[10px] text-slate-400 font-medium">/ {product.unit}</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          product.stock > 15 ? 'bg-green-50 text-green-700' : product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {product.stock} left
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(product)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(product.name)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(product.name)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 2. GROCERY CATEGORIES */}
          {isGroceryCategories && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Count</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {groceryCategories
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((category, idx) => (
                    <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={category.image} alt={category.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                          <span className="text-xs font-bold text-slate-800">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{category.itemsCount} Products</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {category.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(category)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(category.name)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(category.name)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 3. GROCERY ORDERS (All, Pending, Delivered) */}
          {isGroceryOrders && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {targetGroceryOrders
                  .filter(o => o.orderId.includes(searchQuery) || o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((order, idx) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">{order.orderId}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{order.customerName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{order.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{order.date}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">₹{order.total}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : order.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : order.deliveryStatus === 'Pending' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.deliveryStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(order)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(order.orderId)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(order.orderId)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. SERVICE APPROVALS */}
          {isServiceApproval && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provider / Owner</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Offered</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {serviceApprovals
                  .filter(p => p.providerName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((approval, idx) => (
                    <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{approval.providerName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">Owner: {approval.ownerName} ({approval.phone})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">{approval.servicesOffered}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{approval.appliedDate}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                          {approval.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApprove(approval.providerName, 'approve')} className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 rounded hover:bg-emerald-700 inline-flex items-center gap-1 transition-colors">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => handleApprove(approval.providerName, 'reject')} className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 inline-flex items-center gap-1 transition-colors">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 5. SERVICES LIST */}
          {isServicesList && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hourly Rate</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {servicesList
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((service, idx) => (
                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{service.name}</span>
                          <span className="text-[10px] text-amber-500 font-bold">★ {service.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-800 font-bold">{service.provider}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{service.category}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">₹{service.rate} <span className="text-[9px] text-slate-400 font-semibold">/ hr</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          service.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(service)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(service.name)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(service.name)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 6. SERVICE ADDONS LIST */}
          {isServiceAddons && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Addon Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Service</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {serviceAddonsList
                  .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((addon, idx) => (
                    <tr key={addon.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">{addon.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{addon.parentService}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">₹{addon.price}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {addon.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(addon)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(addon.name)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(addon.name)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 7. SERVICE CATEGORIES */}
          {isServiceCategories && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provider Count</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {serviceCategories
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((category, idx) => (
                    <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={category.image} alt={category.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                          <span className="text-xs font-bold text-slate-800">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{category.providersCount} Providers</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {category.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(category)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(category.name)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(category.name)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 8. SERVICE BOOKINGS (All, Pending, Completed) */}
          {isServiceBookings && (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {targetServiceBookings
                  .filter(b => b.bookingId.includes(searchQuery) || b.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((booking, idx) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">{booking.bookingId}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{booking.customerName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{booking.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{booking.serviceName}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">{booking.provider}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{booking.date}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{booking.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">₹{booking.total}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          booking.status === 'Completed' ? 'bg-green-50 text-green-700' : booking.status === 'Confirmed' ? 'bg-blue-50 text-blue-700' : booking.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleView(booking)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(booking.bookingId)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(booking.bookingId)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info pagination mock */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/60 bg-slate-50">
          <span className="text-xs text-slate-500 font-medium">Showing 0 to 0 of 0 entries</span>
          <div className="inline-flex gap-1.5">
            <button className="px-3 py-1.5 text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-not-allowed" disabled>Previous</button>
            <button className="px-3.5 py-1.5 text-[11px] font-bold bg-slate-900 text-white rounded-lg transition-all">1</button>
            <button className="px-3 py-1.5 text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-not-allowed" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DETAIL VIEW MODAL DIALOG */}
      <MockDialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} title="Detailed Overview">
        {selectedItem && (
          <div className="space-y-4">
            {/* If product or category */}
            {selectedItem.image && (
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                <div>
                  <h4 className="text-base font-bold text-slate-800">{selectedItem.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Category ID: #CAT-{selectedItem.id}</p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              {/* Product specific details */}
              {selectedItem.price && !selectedItem.orderId && !selectedItem.rate && (
                <>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Unit Price:</span><span className="text-slate-800 font-bold">₹{selectedItem.price} ({selectedItem.unit})</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Category:</span><span className="text-slate-800">{selectedItem.category}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Stock Count:</span><span className="text-slate-800">{selectedItem.stock} items</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Availability:</span><span className="text-emerald-700 font-bold">{selectedItem.status}</span></div>
                </>
              )}

              {/* Category specific details */}
              {selectedItem.itemsCount && (
                <>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total Catalog Items:</span><span className="text-slate-800 font-bold">{selectedItem.itemsCount} products</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Status:</span><span className="text-emerald-700 font-bold">{selectedItem.status}</span></div>
                </>
              )}

              {/* Order specific details */}
              {selectedItem.orderId && (
                <>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Order Reference:</span><span className="text-slate-800 font-bold">{selectedItem.orderId}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Customer Name:</span><span className="text-slate-800">{selectedItem.customerName}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Phone:</span><span className="text-slate-800">{selectedItem.customerPhone}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Items Ordered:</span><span className="text-slate-800 font-bold text-right max-w-[200px]">{selectedItem.items}</span></div>
                  <div className="flex justify-between text-xs font-semibold border-t border-slate-200/60 pt-2"><span className="text-slate-500 font-bold">Total Amount paid:</span><span className="text-slate-800 font-bold">₹{selectedItem.total}</span></div>
                </>
              )}

              {/* Service list specific details */}
              {selectedItem.rate && (
                <>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Service Title:</span><span className="text-slate-800 font-bold">{selectedItem.name}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Service Provider:</span><span className="text-slate-800">{selectedItem.provider}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Category:</span><span className="text-slate-800">{selectedItem.category}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Hourly Rate:</span><span className="text-slate-800 font-bold">₹{selectedItem.rate} / hr</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Rating:</span><span className="text-amber-600 font-bold">★ {selectedItem.rating}</span></div>
                </>
              )}

              {/* Service booking specific details */}
              {selectedItem.bookingId && (
                <>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Booking Reference:</span><span className="text-slate-800 font-bold">{selectedItem.bookingId}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Customer Details:</span><span className="text-slate-800">{selectedItem.customerName} ({selectedItem.customerPhone})</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Service Requested:</span><span className="text-slate-800 font-bold">{selectedItem.serviceName}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Assigned Provider:</span><span className="text-emerald-700 font-bold">{selectedItem.provider}</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Appointment Slot:</span><span className="text-slate-800">{selectedItem.date} at {selectedItem.time}</span></div>
                  <div className="flex justify-between text-xs font-semibold border-t border-slate-200/60 pt-2"><span className="text-slate-500 font-bold">Total Service Fee:</span><span className="text-slate-800 font-bold">₹{selectedItem.total}</span></div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => setShowDetailDialog(false)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors">Close View</button>
            </div>
          </div>
        )}
      </MockDialog>
    </div>
  );
}
