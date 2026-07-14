import { useEffect, useMemo, useState } from "react"
import { supportAPI } from "@food/api"
import { toast } from "sonner"
import { Eye, X } from "lucide-react"
import { usePublicSocket } from "../../hooks/usePublicSocket"

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: "", type: "" })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState("")

  usePublicSocket({
    "support:ticket:create": (data) => {
      if (data?.ticket) {
        setTickets((prev) => {
          if (prev.some((t) => String(t._id) === String(data.ticket._id))) return prev
          return [data.ticket, ...prev]
        })
      }
    },
    "support:ticket:update": (data) => {
      if (data?.ticketId) {
        setTickets((prev) =>
          prev.map((t) =>
            String(t._id) === String(data.ticketId)
              ? { ...t, status: data.status, adminResponse: data.adminResponse }
              : t
          )
        )
        setSelectedTicket((prev) => {
          if (prev && String(prev._id) === String(data.ticketId)) {
            return { ...prev, status: data.status, adminResponse: data.adminResponse }
          }
          return prev
        })
      }
    },
    "support:ticket:delete": (data) => {
      if (data?.ticketId) {
        setTickets((prev) => prev.filter((t) => String(t._id) !== String(data.ticketId)))
        setSelectedTicket((prev) => {
          if (prev && String(prev._id) === String(data.ticketId)) {
            return null
          }
          return prev
        })
      }
    },
  })

  const handleDelete = async (id, source) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return
    try {
      await supportAPI.deleteSupportTicketAdmin(id, { source })
      toast.success("Ticket deleted successfully")
      setTickets((prev) => prev.filter((t) => String(t._id) !== String(id)))
      setSelectedTicket(null)
    } catch {
      toast.error("Failed to delete ticket")
    }
  }

  const stats = useMemo(() => {
    const total = tickets.length
    const open = tickets.filter((t) => t.status === "open").length
    const inProgress = tickets.filter((t) => t.status === "in-progress").length
    const resolved = tickets.filter((t) => t.status === "resolved").length
    return { total, open, inProgress, resolved }
  }, [tickets])

  const getUserLabel = (ticket) => {
    if (ticket.source === "restaurant") return "Restaurant Panel"
    const user = ticket.user || {}
    const name = user.name || ticket.userName || ""
    const phone = user.phone || ticket.userPhone || ""
    if (name && phone) return `${name} (${phone})`
    if (name) return name
    if (phone) return phone
    const id = ticket.userId ? String(ticket.userId).slice(-6) : ""
    return id ? `#${id}` : "-"
  }

  const getRestaurantLabel = (ticket) => {
    if (Array.isArray(ticket.restaurants) && ticket.restaurants.length > 0) {
      return ticket.restaurants
        .map((r) => {
          const name = r.name || r.restaurantName || ""
          const city = r.city || ""
          return name && city ? `${name} (${city})` : name || ""
        })
        .filter(Boolean)
        .join(", ")
    }
    const restaurant = ticket.restaurant || {}
    const name = restaurant.name || ticket.restaurantName || ""
    const city = restaurant.city || ""
    if (name && city) return `${name} (${city})`
    if (name) return name
    return "-"
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await supportAPI.getSupportTicketsAdmin(filters)
      const list = res?.data?.data?.tickets || res?.data?.tickets || []
      setTickets(list)
    } catch {
      toast.error("Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [filters.status, filters.type])

  const update = async (id, patch) => {
    const ticket = tickets.find((t) => String(t._id) === String(id))
    try {
      await supportAPI.updateSupportTicketAdmin(id, { ...patch, source: ticket?.source || "user" })
      toast.success("Updated")
      setTickets((prev) => prev.map((t) => (String(t._id) === String(id) ? { ...t, ...patch } : t)))
    } catch {
      toast.error("Failed to update")
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Support Tickets</h1>
              <p className="text-sm text-slate-500 mt-1">Review and respond to user and restaurant support tickets.</p>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">All Types</option>
                <option value="order">Order</option>
                <option value="restaurant">Restaurant</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Total {stats.total}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Open {stats.open}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              In progress {stats.inProgress}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Resolved {stats.resolved}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-600">
                  <th className="px-4 py-3">Id</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Type/Category</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reply Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-500">No tickets</td></tr>
                ) : tickets.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3">#{String(t._id).slice(-6)}</td>
                    <td className="px-4 py-3">{getUserLabel(t)}</td>
                    <td className="px-4 py-3">{getRestaurantLabel(t)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{t.issueType}</div>
                      {t.subject ? <div className="text-xs text-slate-500 mt-0.5">Subject: {t.subject}</div> : null}
                      {t.orderRef ? <div className="text-xs text-slate-500 mt-0.5">Order: {t.orderRef}</div> : null}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.status}
                        onChange={(e) => update(t._id, { status: e.target.value })}
                        className="border rounded px-2 py-1 text-xs bg-white focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {t.adminResponse ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Responded
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                          Pending Reply
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        onClick={() => {
                          setSelectedTicket(t)
                          setReplyText(t.adminResponse || "")
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-semibold">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Ticket #{String(selectedTicket._id).slice(-6)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null)
                  setReplyText("")
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* User & Restaurant Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">User Details</span>
                  <span className="text-slate-800 font-semibold block">{getUserLabel(selectedTicket)}</span>
                  {selectedTicket.user?.email && (
                    <span className="text-slate-500 block mt-0.5">{selectedTicket.user.email}</span>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">Restaurant Details</span>
                  <span className="text-slate-800 font-semibold block break-words">
                    {getRestaurantLabel(selectedTicket)}
                  </span>
                </div>
              </div>

              {/* Source & Category */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Source</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {selectedTicket.source || "user"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Category / Type</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {selectedTicket.source === "restaurant" ? (selectedTicket.category || "other") : selectedTicket.type}
                  </span>
                </div>
              </div>

              {/* Issue & Description */}
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 text-xs font-medium block">Issue Type</span>
                  <p className="text-sm font-semibold text-slate-900">{selectedTicket.issueType}</p>
                </div>
                {selectedTicket.subject && (
                  <div>
                    <span className="text-slate-400 text-xs font-medium block">Subject</span>
                    <p className="text-xs text-slate-700">{selectedTicket.subject}</p>
                  </div>
                )}
                {selectedTicket.orderId && (
                  <div>
                    <span className="text-slate-400 text-xs font-medium block">Order ID</span>
                    <p className="text-xs font-mono text-slate-700">#{selectedTicket.orderId._id || selectedTicket.orderId}</p>
                  </div>
                )}
                <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-xs font-medium block mb-1">User Description</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.description || <span className="text-slate-400 italic">No description provided</span>}
                  </p>
                </div>
              </div>

              {/* Status Update */}
              <div className="pt-2">
                <label className="text-slate-400 text-xs font-medium block mb-1">Ticket Status</label>
                <select
                  value={selectedTicket.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    await update(selectedTicket._id, { status: newStatus })
                    setSelectedTicket(prev => ({ ...prev, status: newStatus }))
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Reply Field */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-medium block">Admin Response / Reply</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[100px]"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a response to the user..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => handleDelete(selectedTicket._id, selectedTicket.source)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Delete Ticket
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTicket(null)
                    setReplyText("")
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    await update(selectedTicket._id, { adminResponse: replyText })
                    setSelectedTicket(null)
                    setReplyText("")
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
                >
                  Save Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
