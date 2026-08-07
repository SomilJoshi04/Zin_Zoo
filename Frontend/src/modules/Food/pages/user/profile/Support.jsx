import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { Textarea } from "@food/components/ui/textarea"
import { Card, CardContent } from "@food/components/ui/card"
import { orderAPI, restaurantAPI, supportAPI, authAPI } from "@food/api"
import api from "@food/api"
import { API_ENDPOINTS } from "@food/api/config"
import { toast } from "sonner"
import { ArrowLeft, Building2, HelpCircle, ShoppingBag, ChevronRight, Phone, Mail, Headphones } from "lucide-react"
import { usePublicSocket } from "../../../hooks/usePublicSocket"

export default function Support() {
  const [step, setStep] = useState("pick")
  const [type, setType] = useState("")
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [issueType, setIssueType] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [supportInfo, setSupportInfo] = useState({
    title: "Help & Support",
    content: "",
    email: "",
    mobile: ""
  })

  usePublicSocket({
    "support:ticket:update": (data) => {
      if (data?.ticketId) {
        setTickets((prev) =>
          prev.map((t) =>
            String(t._id || t.id) === String(data.ticketId)
              ? { ...t, status: data.status, adminResponse: data.adminResponse }
              : t
          )
        )
      }
    },
    "support:ticket:delete": (data) => {
      if (data?.ticketId) {
        setTickets((prev) => prev.filter((t) => String(t._id || t.id) !== String(data.ticketId)))
      }
    },
  })
  const [orderSearch, setOrderSearch] = useState("")
  const [restaurantSearch, setRestaurantSearch] = useState("")

  useEffect(() => {
    setLoadingTickets(true)
    authAPI
      .getCurrentUser()
      .catch(() => null)
      .finally(async () => {
        try {
          const res = await supportAPI.getMyTickets()
          const list = res?.data?.data?.tickets || res?.data?.tickets || []
          setTickets(list)
        } catch (_) {}
        setLoadingTickets(false)
      })

    const fetchSupportData = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.ADMIN.SUPPORT_PUBLIC, { params: { module: "ALL" } })
        const payload = res?.data?.data || res?.data
        if (payload) {
          setSupportInfo({
            title: payload.title || "Help & Support",
            content: payload.content || "",
            email: payload.email || "",
            mobile: payload.mobile || ""
          })
        }
      } catch (e) {
        console.error("Error fetching support data:", e)
      }
    }
    fetchSupportData()
  }, [])

  const orderIssues = ["Item missing", "Wrong item", "Not delivered", "Payment issue"]
  const restaurantIssues = ["Bad service", "Wrong info", "Other"]

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getOrders({ limit: 10, page: 1 })
      const list = res?.data?.data?.orders || res?.data?.orders || []
      setOrders(list)
    } catch {
      toast.error("Failed to load orders")
    }
  }

  const fetchRestaurants = async () => {
    try {
      const res = await restaurantAPI.getRestaurants({ limit: 20, page: 1 })
      const list = res?.data?.data?.restaurants || res?.data?.restaurants || []
      setRestaurants(list)
    } catch {
      toast.error("Failed to load restaurants")
    }
  }

  const handlePick = (t) => {
    setType(t)
    setOrderSearch("")
    setRestaurantSearch("")
    if (t === "order") {
      fetchOrders()
      setStep("choose_order")
    } else if (t === "restaurant") {
      fetchRestaurants()
      setStep("choose_restaurant")
    } else {
      setStep("other_form")
    }
  }

  const submitTicket = async (payload) => {
    setSubmitting(true)
    try {
      const res = await supportAPI.createTicket(payload)
      const data = res?.data
      if (!data?.success) throw new Error(data?.message || "Failed")
      toast.success("Ticket created")
      setTickets((prev) => [data?.data?.ticket, ...prev])
      setStep("pick")
      setType("")
      setSelectedOrder(null)
      setSelectedRestaurant(null)
      setIssueType("")
      setSubject("")
      setDescription("")
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to create ticket"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const statusClasses = (status) => {
    const s = String(status || "").toLowerCase()
    if (s === "resolved" || s === "closed") return "bg-green-100 text-green-700"
    if (s === "open") return "bg-amber-100 text-amber-700"
    return "bg-slate-100 text-slate-700"
  }

  const getOrderLabel = (order) => {
    const restaurantName = order?.restaurantName || order?.restaurant?.restaurantName || "Restaurant"
    const dateValue = order?.createdAt || order?.date
    const dateLabel = dateValue ? new Date(dateValue).toLocaleDateString() : "No date"
    const amount = order?.pricing?.total ?? order?.total ?? 0
    return `${restaurantName} • ${dateLabel} • ₹${amount}`
  }

  const getRestaurantLabel = (restaurant) => {
    const name = restaurant?.restaurantName || restaurant?.name || "Restaurant"
    const location = restaurant?.city || restaurant?.area || ""
    return `${name}${location ? ` • ${location}` : ""}`
  }

  const filteredOrders = orders.filter((order) => {
    const q = orderSearch.trim().toLowerCase()
    if (!q) return true
    const restaurantName = (order?.restaurantName || order?.restaurant?.restaurantName || "").toLowerCase()
    const orderId = String(order?._id || order?.id || "").toLowerCase()
    return restaurantName.includes(q) || orderId.includes(q)
  })

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const q = restaurantSearch.trim().toLowerCase()
    if (!q) return true
    const name = String(restaurant?.restaurantName || restaurant?.name || "").toLowerCase()
    const city = String(restaurant?.city || restaurant?.area || "").toLowerCase()
    const id = String(restaurant?._id || restaurant?.id || "").toLowerCase()
    return name.includes(q) || city.includes(q) || id.includes(q)
  })

  const handleOrderSearchChange = (value) => {
    setOrderSearch(value)
    const normalized = value.trim().toLowerCase()
    if (!normalized) return
    const selected = filteredOrders.find((o) => getOrderLabel(o).toLowerCase() === normalized)
    if (selected) {
      setSelectedOrder(selected)
      setStep("order_issue")
    }
  }

  const handleRestaurantSearchChange = (value) => {
    setRestaurantSearch(value)
    const normalized = value.trim().toLowerCase()
    if (!normalized) return
    const selected = filteredRestaurants.find((r) => getRestaurantLabel(r).toLowerCase() === normalized)
    if (selected) {
      setSelectedRestaurant(selected)
      setStep("restaurant_issue")
    }
  }

  const TicketList = () => (
    <Card className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-slate-200 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">My Tickets</h3>
          <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {tickets.length}
          </span>
        </div>

        {loadingTickets ? (
          <p className="text-sm text-slate-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-slate-500">No tickets yet</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t._id || t.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-[#171717]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      #{String(t._id || t.id).slice(-6)} • {t.type} • {t.issueType}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${statusClasses(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                {t.adminResponse ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Reply: {t.adminResponse}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 pb-20">
        <div className="mb-4">
          <Link to="/user/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </Button>
          </Link>
        </div>

        <Card className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 mb-3 overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#F84E04]">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {supportInfo.title || "Help & Support"}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Raise a support ticket or contact our support team directly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Admin Contact Buttons */}
              {(supportInfo.mobile || supportInfo.email) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                  {supportInfo.mobile && (
                    <a
                      href={`tel:${supportInfo.mobile}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F84E04] hover:bg-[#e04502] text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{supportInfo.mobile}</span>
                    </a>
                  )}
                  {supportInfo.email && (
                    <a
                      href={`mailto:${supportInfo.email}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95"
                    >
                      <Mail className="h-4 w-4 text-[#F84E04]" />
                      <span>{supportInfo.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Admin CMS Description if set */}
            {supportInfo.content && (
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div
                  className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none prose-p:my-1"
                  dangerouslySetInnerHTML={{ __html: supportInfo.content }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 mb-3">
          <CardContent className="p-4 space-y-4">
            {step === "pick" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => handlePick("order")} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <ShoppingBag className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-3 font-semibold text-slate-900 dark:text-white">Order Issue</p>
                  <p className="text-xs text-slate-500 mt-1">Missing item, wrong item, delivery issue</p>
                </button>

                <button onClick={() => handlePick("restaurant")} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-3 font-semibold text-slate-900 dark:text-white">Restaurant Issue</p>
                  <p className="text-xs text-slate-500 mt-1">Service, listing info, behavior report</p>
                </button>

                <button onClick={() => handlePick("other")} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <HelpCircle className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-3 font-semibold text-slate-900 dark:text-white">Other Issue</p>
                  <p className="text-xs text-slate-500 mt-1">Account, app, payment or general query</p>
                </button>
              </div>
            )}

            {step === "choose_order" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Select an order</h3>
                {orders.length > 0 ? (
                  <div className="space-y-2">
                    <Input
                      list="support-order-options"
                      value={orderSearch}
                      onChange={(e) => handleOrderSearchChange(e.target.value)}
                      placeholder="Select/search order"
                    />
                    <datalist id="support-order-options">
                      {filteredOrders.map((o) => (
                        <option key={o._id || o.id} value={getOrderLabel(o)}>
                          {getOrderLabel(o)}
                        </option>
                      ))}
                    </datalist>
                    {filteredOrders.length === 0 ? <p className="text-sm text-slate-500">No matching orders found</p> : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No recent orders found</p>
                )}
                <Button variant="outline" onClick={() => setStep("pick")}>Back</Button>
              </div>
            )}

            {step === "order_issue" && selectedOrder && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Issue type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {orderIssues.map((it) => (
                    <Button key={it} variant={issueType === it ? "default" : "outline"} onClick={() => setIssueType(it)}>{it}</Button>
                  ))}
                </div>
                <Textarea placeholder="Describe the issue (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={() => submitTicket({ type: "order", orderId: selectedOrder._id || selectedOrder.id, issueType, description })} disabled={!issueType || submitting}>
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep("pick")}>Cancel</Button>
                </div>
              </div>
            )}

            {step === "choose_restaurant" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Select a restaurant</h3>
                {restaurants.length > 0 ? (
                  <div className="space-y-2">
                    <Input
                      list="support-restaurant-options"
                      value={restaurantSearch}
                      onChange={(e) => handleRestaurantSearchChange(e.target.value)}
                      placeholder="Select/search restaurant"
                    />
                    <datalist id="support-restaurant-options">
                      {filteredRestaurants.map((r) => (
                        <option key={r._id || r.id} value={getRestaurantLabel(r)}>
                          {getRestaurantLabel(r)}
                        </option>
                      ))}
                    </datalist>
                    {filteredRestaurants.length === 0 ? <p className="text-sm text-slate-500">No matching restaurants found</p> : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No restaurants found</p>
                )}
                <Button variant="outline" onClick={() => setStep("pick")}>Back</Button>
              </div>
            )}

            {step === "restaurant_issue" && selectedRestaurant && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Issue type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {restaurantIssues.map((it) => (
                    <Button key={it} variant={issueType === it ? "default" : "outline"} onClick={() => setIssueType(it)}>{it}</Button>
                  ))}
                </div>
                <Textarea placeholder="Describe the issue (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={() => submitTicket({ type: "restaurant", restaurantId: selectedRestaurant._id || selectedRestaurant.id, issueType, description })} disabled={!issueType || submitting}>
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep("pick")}>Cancel</Button>
                </div>
              </div>
            )}

            {step === "other_form" && (
              <div className="space-y-3">
                <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <Textarea placeholder="Describe your issue" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={() => submitTicket({ type: "other", issueType: subject || "Other", description })} disabled={!subject || submitting}>
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep("pick")}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <TicketList />
      </div>
    </AnimatedPage>
  )
}
