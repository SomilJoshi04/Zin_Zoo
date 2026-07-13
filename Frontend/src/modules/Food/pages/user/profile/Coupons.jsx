import { Link } from "react-router-dom"
import { useEffect, useMemo, useState, useCallback } from "react"
import { ArrowLeft, Copy, MapPin, TicketPercent } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import { restaurantAPI } from "@food/api"
import { toast } from "sonner"
import { usePublicSocket } from "@food/hooks/usePublicSocket"

export default function Coupons() {
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState([])
  const [activeTab, setActiveTab] = useState("all")

  const load = useCallback(async (cancelled = false) => {
    try {
      setLoading(true)
      const res = await restaurantAPI.getPublicOffers()
      const list = res?.data?.data?.allOffers || res?.data?.allOffers || []
      if (!cancelled) {
        // Only show offers meant to be visible to users (default true)
        const visible = Array.isArray(list) ? list.filter((o) => o?.showInCart !== false) : []
        setOffers(visible)
      }
    } catch (e) {
      if (!cancelled) setOffers([])
    } finally {
      if (!cancelled) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load(cancelled)
    return () => {
      cancelled = true
    }
  }, [load])

  const socketListeners = useMemo(() => ({
    "offer:update": () => {
      load(false)
    }
  }), [load])

  usePublicSocket(socketListeners)

  const counts = useMemo(() => {
    if (!Array.isArray(offers)) return { all: 0, food: 0, grocery: 0, accessories: 0 }
    return offers.reduce((acc, offer) => {
      acc.all++
      const mod = offer?.moduleType || "food"
      if (mod === "grocery") {
        acc.grocery++
      } else if (mod === "accessories") {
        acc.accessories++
      } else {
        acc.food++
      }
      return acc
    }, { all: 0, food: 0, grocery: 0, accessories: 0 })
  }, [offers])

  const filteredOffers = useMemo(() => {
    if (!Array.isArray(offers)) return []
    const filtered = offers.filter((offer) => {
      if (activeTab === "all") return true
      const mod = offer?.moduleType || "food"
      return mod === activeTab
    })
    return [...filtered].sort((a, b) => String(a?.couponCode || "").localeCompare(String(b?.couponCode || "")))
  }, [offers, activeTab])

  const handleCopy = async (code) => {
    const value = String(code || "").trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Coupon copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/user/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-black dark:text-white">Your coupons</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-600 dark:text-gray-400">
            Loading coupons...
          </div>
        ) : offers.length > 0 ? (
          <div>
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none shrink-0 -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { id: "all", label: "All" },
                { id: "food", label: "Food" },
                { id: "grocery", label: "Grocery" },
                { id: "accessories", label: "Accessories" }
              ].map(tab => {
                const count = counts[tab.id] || 0
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 outline-none ${
                      active
                        ? "bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-600 dark:text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      active 
                        ? "bg-blue-700 text-white dark:bg-white/20 dark:text-white" 
                        : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {filteredOffers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                {filteredOffers.map((offer) => {
                  const code = offer?.couponCode || ""
                  const title = offer?.title || ""
                  const isGrocery = offer?.moduleType === "grocery"
                  const isAccessories = offer?.moduleType === "accessories"
                  const scopeText = isGrocery
                    ? "Grocery Offer"
                    : isAccessories
                      ? "Accessories Offer"
                      : offer?.restaurantName || "All Restaurants"
                  const endDate = offer?.endDate ? new Date(offer.endDate) : null
                  const expiryText =
                    endDate && !Number.isNaN(endDate.getTime())
                      ? `Valid till ${endDate.toLocaleDateString()}`
                      : "No expiry"

                  return (
                    <div
                      key={offer?.id || offer?.offerId || code}
                      className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                            <TicketPercent className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {code}
                              </span>
                              {title && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                                  {title}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                              {scopeText}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                              {expiryText}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 px-3 rounded-xl"
                          onClick={() => handleCopy(code)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                <TicketPercent className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">No Offers Available</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">There are no coupons in this category at the moment.</p>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          {/* Circular Map Illustration */}
          <div className="relative mb-8">
            {/* Circular Background */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
              {/* Map Pattern Background - More detailed */}
              <svg
                className="absolute inset-0 w-full h-full opacity-70"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Main horizontal road */}
                <path
                  d="M 20 100 Q 50 80, 80 100 T 140 100"
                  stroke="#a1a1aa"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Main vertical road */}
                <path
                  d="M 100 20 Q 100 50, 100 80 T 100 140"
                  stroke="#a1a1aa"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Diagonal roads */}
                <path
                  d="M 40 40 Q 60 60, 80 80 T 120 120"
                  stroke="#b4b4b8"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 160 40 Q 140 60, 120 80 T 80 120"
                  stroke="#b4b4b8"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 30 170 Q 50 150, 70 130 T 110 90"
                  stroke="#b4b4b8"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 170 170 Q 150 150, 130 130 T 90 90"
                  stroke="#b4b4b8"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Additional connecting paths */}
                <path
                  d="M 50 50 L 70 70"
                  stroke="#c4c4c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 150 50 L 130 70"
                  stroke="#c4c4c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 50 150 L 70 130"
                  stroke="#c4c4c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 150 150 L 130 130"
                  stroke="#c4c4c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              {/* Map Pins */}
              <div className="absolute left-12 top-16 z-20">
                <MapPin className="h-7 w-7 text-red-500 drop-shadow-lg" fill="currentColor" />
              </div>
              <div className="absolute right-12 top-20 z-20">
                <MapPin className="h-7 w-7 text-red-500 drop-shadow-lg" fill="currentColor" />
              </div>

              {/* Treasure Chest and Coins */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Gold Coins Stack (Left) */}
                <div className="absolute -left-10 top-2 flex flex-col gap-0.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-yellow-600 shadow-lg"></div>
                  <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-yellow-600 shadow-lg -ml-1"></div>
                  <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-yellow-600 shadow-lg -ml-2"></div>
                </div>

                {/* Treasure Chest */}
                <div className="relative mt-4">
                  {/* Chest Body */}
                  <div className="w-24 h-20 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg shadow-xl relative">
                    {/* Chest Top/Lid */}
                    <div className="absolute -top-3 left-0 right-0 h-5 bg-gradient-to-b from-amber-900 to-amber-950 rounded-t-lg shadow-md"></div>
                    
                    {/* Chest Lock */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-2 border-yellow-700 shadow-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-yellow-700 rounded-full shadow-inner"></div>
                      </div>
                    </div>

                    {/* Chest Straps */}
                    <div className="absolute top-3 left-3 w-16 h-1.5 bg-amber-950 rounded-full shadow-sm"></div>
                    <div className="absolute bottom-3 left-3 w-16 h-1.5 bg-amber-950 rounded-full shadow-sm"></div>
                    
                    {/* Chest Details */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-amber-700"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3 max-w-sm">
            <h2 className="text-xl font-bold text-black">No coupons found</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Discover hidden coupons on your map screen after placing an order
            </p>
          </div>
        </div>
        )}
      </div>
    </AnimatedPage>
  )
}

