import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, CheckCircle } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"
import { Card, CardContent } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"

export default function GlobalOrdersPage() {
  const { status } = useParams() // 'pending' or 'completed'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState("All")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const res = await adminAPI.getGlobalOrders({ status })
        if (res?.data?.success) {
          setOrders(res.data.data)
        }
      } catch (error) {
        toast.error("Failed to fetch global orders")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [status])

  const title = status === 'pending' ? 'Pending Orders (All)' : 'Completed Orders (All)'
  const Icon = status === 'pending' ? Clock : CheckCircle

  const filteredOrders = orders.filter(order => {
    if (selectedModule === "All") return true
    return order.category === selectedModule
  })
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/food')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{title}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Overview of {status} orders across Food, Grocery and Accessories</p>
          </div>
        </div>
      </div>

      {/* Module Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {["All", "Food", "Grocery", "Accessories"].map((mod) => (
          <button
            key={mod}
            onClick={() => setSelectedModule(mod)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              selectedModule === mod
                ? "bg-[#F84E04] text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-zinc-850"
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      <Card className="border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 dark:bg-zinc-850 border-b border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-300 font-medium">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">Loading orders...</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">No {status} orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order._id} 
                      className="hover:bg-neutral-50 dark:hover:bg-zinc-850/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{order.order_id || order.orderId}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          order.category === 'Food' 
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' 
                            : order.category === 'Accessories'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                        }`}>
                          {order.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900 dark:text-white">{order.customerName || order.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{order.customerPhone || order.userId?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">₹{order.pricing?.total || order.totalAmount || 0}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2 py-1 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                          {order.orderStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
