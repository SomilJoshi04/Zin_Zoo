import React, { useState, useEffect } from 'react';
import { Search, Loader2, Calendar, MapPin, Phone, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAdminAPI } from '@food/api';

export default function BookingsList({ statusFilter = 'all' }) {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [searchQuery, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await servicesAdminAPI.getBookings({ 
        search: searchQuery,
        status: statusFilter 
      });
      if (response?.data?.success) {
        setBookings(response.data.data.bookings);
      }
    } catch (error) {
      toast.error('Failed to fetch bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await servicesAdminAPI.updateBookingStatus(id, newStatus);
      toast.success(`Booking marked as ${newStatus}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Accepted</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                {statusFilter === 'pending' ? 'Pending Bookings' : statusFilter === 'completed' ? 'Completed Bookings' : 'All Bookings'}
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Manage and track service bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 lg:w-60 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID / Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Info</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-2 text-sm text-slate-500">Loading bookings...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600">No bookings found.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">#{booking._id.substring(booking._id.length - 6).toUpperCase()}</div>
                      <div className="text-xs font-semibold text-slate-700">
                        {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {booking.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {booking.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{booking.serviceId?.name || 'Unknown Service'}</span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                          {booking.serviceId?.category || 'No Category'}
                        </span>
                        <div className="flex items-start gap-1.5 text-[11px] font-medium text-slate-600 mt-1 max-w-[150px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate" title={booking.serviceAddress}>{booking.serviceAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {booking.timeSlot}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-800">₹{booking.totalAmount}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {booking.status === 'pending' && (
                          <button onClick={() => handleUpdateStatus(booking._id, 'accepted')} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1">
                            Accept
                          </button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'accepted') && (
                          <button onClick={() => handleUpdateStatus(booking._id, 'completed')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Complete
                          </button>
                        )}
                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                          <button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Cancel
                          </button>
                        )}
                        {(booking.status === 'completed' || booking.status === 'cancelled') && (
                          <span className="text-[10px] font-medium text-slate-400">No actions</span>
                        )}
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
  );
}
