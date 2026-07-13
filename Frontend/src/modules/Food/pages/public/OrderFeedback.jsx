import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Star, Loader2, CheckCircle2, MessageSquare, Phone, User } from "lucide-react"
import { toast } from "sonner"
import { userAPI } from "@food/api"

export default function OrderFeedback() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get("orderId") || ""

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orderId) {
      toast.error("Invalid Order ID. Please scan the QR code on your receipt.")
      return
    }
    if (rating === 0) {
      toast.error("Please select a rating before submitting.")
      return
    }

    try {
      setSubmitting(true)
      const res = await userAPI.submitPublicFeedback({
        orderId,
        rating,
        comment: comment.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      })

      if (res.data?.success) {
        toast.success("Thank you for your valuable feedback!")
        setSubmitted(true)
      } else {
        toast.error(res.data?.message || "Failed to submit feedback")
      }
    } catch (error) {
      console.error("Public feedback error:", error)
      toast.error(error.response?.data?.message || "Feedback already submitted or invalid order details.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md w-full text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
            <p className="text-slate-600 text-sm">
              We look forward to serving you again at <span className="font-semibold text-emerald-600">Zin Zoo</span>.
            </p>
          </div>
          <div className="w-full h-px bg-slate-100" />
          <p className="text-xs text-slate-400">
            Your feedback helps us continuously improve our service quality.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/zinzoo-logo.png" alt="Zin Zoo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-slate-950">Zin Zoo</span>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 flex flex-col justify-center items-center max-w-md mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-150 p-6 md:p-8 w-full flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">
              Feedback Form
            </h2>
            <p className="text-slate-500 text-xs">
              Tell us how we did on Bill No: <span className="font-mono text-slate-800">{orderId.substring(0, 8)}...</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Customer Details */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Your Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2 py-2">
              <span className="text-xs font-semibold text-slate-600">Rate your experience:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-comment" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Comments / Suggestion
              </label>
              <textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike? How can we improve?"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 min-h-[100px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0 || !orderId}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
